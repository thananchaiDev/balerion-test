import { useMemo, type ReactNode } from 'react';

import {
  Card as UICard,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/utils/cn';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  AllocationResult,
  Customer,
  Order,
  OrderType,
  StockRow,
} from '@/domain/types';
import { stockKey } from '@/domain/types';
import { priceOf } from '@/logic/allocation/math';
import { theme } from '@/theme';

interface Props {
  orders: Order[];
  stocks: StockRow[];
  customers: Customer[];
  result: AllocationResult;
}

export default function AllocationSummary({
  orders,
  stocks,
  customers,
  result,
}: Props) {
  const totalAllocated = useMemo(
    () =>
      Object.values(result.allocated).reduce(
        (a, b) => a + (Number.isFinite(b) ? b : 0),
        0,
      ),
    [result.allocated],
  );
  const totalRequested = useMemo(
    () => orders.reduce((a, o) => a + o.request, 0),
    [orders],
  );
  const fillRate = totalRequested > 0 ? totalAllocated / totalRequested : 0;

  const typeBreakdown = useMemo(() => {
    const counts: Record<OrderType, number> = {
      EMERGENCY: 0,
      OVER_DUE: 0,
      DAILY: 0,
    };
    for (const o of orders) counts[o.type] += 1;
    return (Object.keys(counts) as OrderType[])
      .map((t) => ({ name: t, value: counts[t] }))
      .filter((d) => d.value > 0);
  }, [orders]);

  const stockData = useMemo(() => {
    const map = new Map<string, { onHand: number; remaining: number }>();
    for (const s of stocks) {
      const cur = map.get(s.itemId) ?? { onHand: 0, remaining: 0 };
      cur.onHand += s.quantity;
      cur.remaining +=
        result.stockRemaining[stockKey(s.warehouseId, s.supplierId, s.itemId)] ??
        s.quantity;
      map.set(s.itemId, cur);
    }
    return Array.from(map.entries())
      .map(([itemId, v]) => ({
        itemId,
        used: Math.max(0, v.onHand - v.remaining),
        remaining: v.remaining,
      }))
      .sort((a, b) => a.itemId.localeCompare(b.itemId));
  }, [stocks, result.stockRemaining]);

  const customerData = useMemo(() => {
    const usedByLookup = new Map<string, number>();
    for (const o of orders) {
      const qty = result.allocated[o.subOrder] ?? 0;
      if (qty <= 0) continue;
      const f = result.fulfillment[o.subOrder];
      if (!f) continue;
      usedByLookup.set(
        o.customerId,
        (usedByLookup.get(o.customerId) ?? 0) + priceOf(qty, f.unitPrice),
      );
    }
    return customers
      .filter((c) => (usedByLookup.get(c.customerId) ?? 0) > 0)
      .map((c) => {
        const used = usedByLookup.get(c.customerId) ?? 0;
        return {
          label: c.name ?? c.customerId,
          used: Math.round(used),
          limit: c.creditLimit,
          pct: c.creditLimit > 0 ? (used / c.creditLimit) * 100 : 0,
        };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 10);
  }, [customers, orders, result.allocated, result.fulfillment]);

  return (
    <div className="space-y-4">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Sub-orders" value={orders.length.toLocaleString()} />
        <Kpi label="Requested" value={totalRequested.toLocaleString()} />
        <Kpi
          label="Allocated"
          value={totalAllocated.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}
        />
        <Kpi
          label="Fill rate"
          value={`${(fillRate * 100).toFixed(1)}%`}
          accent={fillRate > 0.95 ? 'green' : fillRate > 0.7 ? 'blue' : 'amber'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Stock chart */}
        <Card title="Stock by item" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid stroke={theme.charts.grid} strokeDasharray="3 3" />
                <XAxis dataKey="itemId" tick={{ fill: theme.charts.tick, fontSize: 11 }} />
                <YAxis tick={{ fill: theme.charts.tick, fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: theme.charts.tooltipCursor }}
                  contentStyle={{
                    backgroundColor: theme.charts.background,
                    border: `1px solid ${theme.charts.grid}`,
                    color: theme.charts.tooltipText,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: theme.charts.tooltipText }}
                  itemStyle={{ color: theme.charts.tooltipText }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: theme.charts.tick }} />
                <Bar dataKey="used" stackId="s" fill={theme.charts.stock.used} name="Used" />
                <Bar
                  dataKey="remaining"
                  stackId="s"
                  fill={theme.charts.stock.remaining}
                  name="Remaining"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Order type breakdown */}
        <Card title="Order type mix">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {typeBreakdown.map((d) => (
                    <Cell
                      key={d.name}
                      fill={theme.orderTypes[d.name as OrderType].color}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.charts.background,
                    border: `1px solid ${theme.charts.grid}`,
                    color: theme.charts.tooltipText,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: theme.charts.tooltipText }}
                  itemStyle={{ color: theme.charts.tooltipText }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: theme.charts.tick }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Customer credit utilization */}
      <Card title="Top customers by credit used (%)">
        <div className="h-80">
          {customerData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-empty-foreground">
              No allocations yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={customerData}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 16, bottom: 8 }}
              >
                <CartesianGrid stroke={theme.charts.grid} strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: theme.charts.tick, fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fill: theme.charts.tick, fontSize: 11 }}
                  width={130}
                />
                <Tooltip
                  cursor={{ fill: theme.charts.tooltipCursor }}
                  contentStyle={{
                    backgroundColor: theme.charts.background,
                    border: `1px solid ${theme.charts.grid}`,
                    color: theme.charts.tooltipText,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: theme.charts.tooltipText }}
                  itemStyle={{ color: theme.charts.tooltipText }}
                  formatter={(value, _name, item) => {
                    const pct = typeof value === 'number' ? value : Number(value ?? 0);
                    const row = item.payload as { used: number; limit: number };
                    return [
                      `${pct.toFixed(1)}%  (${row.used.toLocaleString()} / ${row.limit.toLocaleString()})`,
                      'Credit used',
                    ];
                  }}
                />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                  {customerData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={getCreditColor(d.pct)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'green' | 'blue' | 'amber';
}) {
  const color =
    accent === 'green'
      ? 'text-success-accent'
      : accent === 'amber'
        ? 'text-warning-foreground'
        : accent === 'blue'
          ? 'text-primary'
          : 'text-foreground';
  return (
    <UICard className="p-4">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={cn('mt-1 text-2xl font-semibold', color)}>{value}</div>
    </UICard>
  );
}

function getCreditColor(percentUsed: number) {
  if (percentUsed > 95) return theme.charts.credit.danger;
  if (percentUsed > 80) return theme.charts.credit.warning;
  return theme.charts.credit.normal;
}

function Card({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <UICard className={cn('p-0', className)}>
      <CardHeader className="p-3 pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">{children}</CardContent>
    </UICard>
  );
}
