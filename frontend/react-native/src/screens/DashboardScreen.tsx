import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Activity,
  Boxes,
  ChartNoAxesCombined,
  CreditCard,
  PackageCheck,
} from 'lucide-react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

import type { OrderType } from '../domain/types';
import type { AllocationWorkspace } from '../hooks/useAllocationWorkspace';
import { theme } from '../theme';

interface Props {
  workspace: AllocationWorkspace;
}

type DashboardIcon = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

type BarDatum = {
  label: string;
  value: number;
  color: string;
};

const TYPE_ORDER: OrderType[] = ['EMERGENCY', 'OVER_DUE', 'DAILY'];
const TYPE_META = theme.orderTypes;

function formatQty(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function formatMoney(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} THB`;
}

function percentage(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

function MetricCard({
  label,
  value,
  helper,
  color,
  Icon,
}: {
  label: string;
  value: string;
  helper: string;
  color: string;
  Icon: DashboardIcon;
}) {
  return (
    <View style={styles.metricCard}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-[10px] font-semibold uppercase text-slate-500">
          {label}
        </Text>
        <View className="h-8 w-8 rounded-full items-center justify-center bg-slate-100">
          <Icon size={16} color={color} strokeWidth={2} />
        </View>
      </View>
      <Text className="text-xl font-bold text-slate-950" numberOfLines={1}>
        {value}
      </Text>
      <Text className="text-[11px] text-slate-500 mt-1">{helper}</Text>
    </View>
  );
}

function ProgressRing({
  value,
  color = theme.colors.status.success,
}: {
  value: number;
  color?: string;
}) {
  const size = 132;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage(value, 100) / 100) * circumference;

  return (
    <View className="h-[132px] w-[132px] items-center justify-center">
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.chart.track}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          originX={size / 2}
          originY={size / 2}
          rotation="-90"
        />
      </Svg>
      <View className="absolute items-center">
        <Text className="text-2xl font-bold text-slate-950">
          {Math.round(value)}%
        </Text>
        <Text className="text-[10px] font-semibold uppercase text-slate-500">
          Allocated
        </Text>
      </View>
    </View>
  );
}

function SegmentedBar({ rows }: { rows: BarDatum[] }) {
  const activeRows = rows.filter((row) => row.value > 0);
  if (activeRows.length === 0) {
    return <View className="h-3 rounded-full bg-slate-200" />;
  }

  return (
    <View className="h-3 rounded-full bg-slate-200 flex-row overflow-hidden">
      {activeRows.map((row) => (
        <View
          key={row.label}
          style={{ flex: row.value, backgroundColor: row.color }}
        />
      ))}
    </View>
  );
}

function HorizontalBar({
  value,
  total,
  color,
  mutedColor = theme.colors.chart.track,
}: {
  value: number;
  total: number;
  color: string;
  mutedColor?: string;
}) {
  return (
    <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: mutedColor }}>
      <View
        className="h-2 rounded-full"
        style={{ width: `${percentage(value, total)}%`, backgroundColor: color }}
      />
    </View>
  );
}

function MiniColumnChart({ rows }: { rows: BarDatum[] }) {
  const width = 280;
  const height = 128;
  const max = Math.max(1, ...rows.map((row) => row.value));
  const barWidth = rows.length > 0 ? width / rows.length - 10 : width;

  return (
    <View className="items-center">
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {rows.map((row, index) => {
          const barHeight = Math.max(8, (row.value / max) * 92);
          const x = index * (width / rows.length) + 5;
          const y = height - barHeight - 20;
          return (
            <React.Fragment key={row.label}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={5}
                fill={row.color}
              />
              <Rect
                x={x}
                y={height - 18}
                width={barWidth}
                height={3}
                rx={1.5}
                fill={theme.colors.chart.barTrack}
              />
            </React.Fragment>
          );
        })}
      </Svg>
      <View className="w-full flex-row justify-between px-2">
        {rows.map((row) => (
          <Text
            key={row.label}
            className="text-[10px] font-semibold text-slate-500 text-center flex-1"
            numberOfLines={1}
          >
            {row.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function DashboardScreen({ workspace }: Props) {
  const { orders, stock, credits, result } = workspace;

  const dashboard = React.useMemo(() => {
    const allocations = result.allocations;
    const allocationRows = Object.values(allocations);
    const totalRequested = orders.reduce((sum, order) => sum + order.request, 0);
    const totalAllocated = allocationRows.reduce(
      (sum, allocation) => sum + allocation.allocated,
      0,
    );
    const totalInitialStock = stock.reduce((sum, row) => sum + row.available, 0);
    const totalRemainingStock = result.remainingStock.reduce(
      (sum, row) => sum + row.available,
      0,
    );
    const totalCreditUsed = Object.values(result.customerCreditUsed).reduce(
      (sum, value) => sum + value,
      0,
    );

    const typeRows = TYPE_ORDER.map((type) => {
      const typeOrders = orders.filter((order) => order.type === type);
      const requested = typeOrders.reduce((sum, order) => sum + order.request, 0);
      const allocated = typeOrders.reduce(
        (sum, order) => sum + (allocations[order.subOrderId]?.allocated ?? 0),
        0,
      );
      return {
        type,
        label: TYPE_META[type].label,
        color: TYPE_META[type].color,
        muted: TYPE_META[type].muted,
        count: typeOrders.length,
        requested,
        allocated,
      };
    });

    const itemMap = new Map<
      string,
      { itemId: string; requested: number; allocated: number; remaining: number }
    >();
    for (const order of orders) {
      const row = itemMap.get(order.itemId) ?? {
        itemId: order.itemId,
        requested: 0,
        allocated: 0,
        remaining: 0,
      };
      row.requested += order.request;
      row.allocated += allocations[order.subOrderId]?.allocated ?? 0;
      itemMap.set(order.itemId, row);
    }
    for (const row of result.remainingStock) {
      const item = itemMap.get(row.itemId) ?? {
        itemId: row.itemId,
        requested: 0,
        allocated: 0,
        remaining: 0,
      };
      item.remaining += row.available;
      itemMap.set(row.itemId, item);
    }

    const itemRows = Array.from(itemMap.values())
      .sort((a, b) => b.requested - a.requested)
      .slice(0, 6);

    const creditRows = credits
      .map((credit) => {
        const used = result.customerCreditUsed[credit.customerId] ?? 0;
        return {
          customerId: credit.customerId,
          name: credit.name ?? credit.customerId,
          used,
          limit: credit.creditLimit,
          pct: percentage(used, credit.creditLimit),
        };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 6);

    const warehouseTotals = new Map<string, number>();
    for (const row of result.remainingStock) {
      warehouseTotals.set(
        row.warehouseId,
        (warehouseTotals.get(row.warehouseId) ?? 0) + row.available,
      );
    }
    const warehouseRows = Array.from(warehouseTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value], index) => ({
        label: label.replace('WH-', ''),
        value,
        color: theme.charts.warehousePalette[index]!,
      }));

    return {
      totalRequested,
      totalAllocated,
      unfulfilled: Math.max(0, totalRequested - totalAllocated),
      allocationRate: percentage(totalAllocated, totalRequested),
      totalInitialStock,
      totalRemainingStock,
      totalCreditUsed,
      typeRows,
      itemRows,
      creditRows,
      warehouseRows,
    };
  }, [credits, orders, result, stock]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="px-4 pt-3 pb-3 bg-white border-b border-slate-200">
        <Text className="text-lg font-bold text-slate-900">Visualize</Text>
        <Text className="text-xs text-slate-500">
          Allocation health, stock movement, and credit exposure.
        </Text>
      </View>
      <ScrollView className="bg-slate-50" contentContainerStyle={styles.scrollContent}>
        <View className="bg-white border border-slate-200 rounded-lg p-4 mb-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-[11px] font-semibold uppercase text-slate-500">
                Allocation health
              </Text>
              <Text className="text-2xl font-bold text-slate-950 mt-1">
                {formatQty(dashboard.totalAllocated)} kg
              </Text>
              <Text className="text-xs text-slate-500 mt-1">
                of {formatQty(dashboard.totalRequested)} kg requested
              </Text>

              <View className="mt-4">
                <Text className="text-[11px] text-slate-500 mb-1">
                  Remaining demand {formatQty(dashboard.unfulfilled)} kg
                </Text>
                <HorizontalBar
                  value={dashboard.totalAllocated}
                  total={dashboard.totalRequested}
                  color={theme.colors.status.success}
                  mutedColor={theme.colors.chart.demandMuted}
                />
              </View>
            </View>
            <ProgressRing value={dashboard.allocationRate} />
          </View>
        </View>

        <View style={styles.metricGrid}>
          <MetricCard
            label="Requested"
            value={`${formatQty(dashboard.totalRequested)} kg`}
            helper={`${orders.length.toLocaleString()} order lines`}
            color={theme.colors.status.info}
            Icon={ChartNoAxesCombined}
          />
          <MetricCard
            label="Allocated"
            value={`${formatQty(dashboard.totalAllocated)} kg`}
            helper={`${Math.round(dashboard.allocationRate)}% fulfillment`}
            color={theme.colors.action.success}
            Icon={PackageCheck}
          />
          <MetricCard
            label="Stock left"
            value={`${formatQty(dashboard.totalRemainingStock)} kg`}
            helper={`from ${formatQty(dashboard.totalInitialStock)} kg`}
            color={theme.colors.status.accent}
            Icon={Boxes}
          />
          <MetricCard
            label="Credit used"
            value={formatMoney(dashboard.totalCreditUsed)}
            helper={`${dashboard.creditRows.length} accounts ranked`}
            color={theme.colors.status.danger}
            Icon={CreditCard}
          />
        </View>

        <View className="bg-white border border-slate-200 rounded-lg p-4 mb-3">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-sm font-bold text-slate-950">
                Priority mix
              </Text>
              <Text className="text-xs text-slate-500">
                Requested quantity by allocation priority
              </Text>
            </View>
            <Activity size={18} color={theme.colors.text.muted} strokeWidth={2} />
          </View>
          <SegmentedBar
            rows={dashboard.typeRows.map((row) => ({
              label: row.label,
              value: row.requested,
              color: row.color,
            }))}
          />
          <View className="mt-3">
            {dashboard.typeRows.map((row) => (
              <View key={row.type} className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center">
                    <View
                      className="h-2.5 w-2.5 rounded-full mr-2"
                      style={{ backgroundColor: row.color }}
                    />
                    <Text className="text-xs font-semibold text-slate-800">
                      {row.label}
                    </Text>
                  </View>
                  <Text className="text-xs text-slate-500">
                    {row.count.toLocaleString()} lines
                  </Text>
                </View>
                <HorizontalBar
                  value={row.allocated}
                  total={row.requested}
                  color={row.color}
                  mutedColor={row.muted}
                />
                <Text className="text-[10px] text-slate-500 mt-1">
                  {formatQty(row.allocated)} / {formatQty(row.requested)} kg allocated
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="bg-white border border-slate-200 rounded-lg p-4 mb-3">
          <Text className="text-sm font-bold text-slate-950">Stock by SKU</Text>
          <Text className="text-xs text-slate-500 mb-3">
            Top requested items with fulfillment coverage
          </Text>
          {dashboard.itemRows.map((row) => (
            <View key={row.itemId} className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs font-semibold text-slate-800">
                  {row.itemId}
                </Text>
                <Text className="text-xs text-slate-500">
                  {formatQty(row.allocated)} / {formatQty(row.requested)} kg
                </Text>
              </View>
              <HorizontalBar
                value={row.allocated}
                total={row.requested}
                color={theme.colors.status.teal}
                mutedColor={theme.colors.chart.track}
              />
              <Text className="text-[10px] text-slate-500 mt-1">
                {formatQty(row.remaining)} kg remaining stock
              </Text>
            </View>
          ))}
        </View>

        <View className="bg-white border border-slate-200 rounded-lg p-4 mb-3">
          <Text className="text-sm font-bold text-slate-950">
            Warehouse balance
          </Text>
          <Text className="text-xs text-slate-500 mb-2">
            Remaining stock by cold-storage site
          </Text>
          <MiniColumnChart rows={dashboard.warehouseRows} />
        </View>

        <View className="bg-white border border-slate-200 rounded-lg p-4">
          <Text className="text-sm font-bold text-slate-950">
            Credit exposure
          </Text>
          <Text className="text-xs text-slate-500 mb-3">
            Highest utilisation customers
          </Text>
          {dashboard.creditRows.map((row) => (
            <View key={row.customerId} className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text
                  className="text-xs font-semibold text-slate-800 flex-1 pr-2"
                  numberOfLines={1}
                >
                  {row.name}
                </Text>
                <Text className="text-xs text-slate-500">
                  {Math.round(row.pct)}%
                </Text>
              </View>
              <HorizontalBar
                value={row.used}
                total={row.limit}
                color={
                  row.pct >= 80
                    ? theme.colors.status.danger
                    : theme.colors.status.info
                }
                mutedColor={theme.colors.chart.track}
              />
              <Text className="text-[10px] text-slate-500 mt-1">
                {formatMoney(row.used)} / {formatMoney(row.limit)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 12,
    paddingBottom: 32,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricCard: {
    width: '47.8%',
    minHeight: 126,
    backgroundColor: theme.colors.background.surface,
    borderColor: theme.colors.border.default,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
});
