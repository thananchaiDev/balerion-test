import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { StockRow, Order, Allocation, CustomerCredit } from '../domain/types';

interface Props {
  orders: Order[];
  allocations: Record<string, Allocation>;
  remainingStock: StockRow[];
  creditUsed: Record<string, number>;
  credits: CustomerCredit[];
}

export function AllocationSummary({
  orders,
  allocations,
  remainingStock,
  creditUsed,
  credits,
}: Props) {
  const totalAllocated = Object.values(allocations).reduce(
    (s, a) => s + a.allocated,
    0,
  );
  const totalRequested = orders.reduce((s, o) => s + o.request, 0);

  const perItem = new Map<string, number>();
  for (const s of remainingStock) {
    perItem.set(s.itemId, (perItem.get(s.itemId) ?? 0) + s.available);
  }

  const topCredits = credits.slice(0, 8);

  return (
    <ScrollView
      className="bg-slate-50 border-t border-slate-200"
      contentContainerStyle={{ padding: 12 }}
    >
      <Text className="font-semibold text-slate-900 mb-2">Summary</Text>
      <View className="flex-row mb-2">
        <View className="flex-1 bg-white rounded-md p-2 mr-2 border border-slate-200">
          <Text className="text-[10px] text-slate-500">Total Requested</Text>
          <Text className="text-lg font-bold text-slate-900">
            {totalRequested.toLocaleString()}
          </Text>
        </View>
        <View className="flex-1 bg-white rounded-md p-2 border border-slate-200">
          <Text className="text-[10px] text-slate-500">Total Allocated</Text>
          <Text className="text-lg font-bold text-emerald-700">
            {totalAllocated.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      <Text className="text-xs font-semibold text-slate-700 mb-1">
        Remaining stock per item
      </Text>
      {Array.from(perItem.entries()).map(([item, qty]) => (
        <View
          key={item}
          className="flex-row justify-between bg-white border border-slate-200 rounded-md px-2 py-1 mb-1"
        >
          <Text className="text-xs text-slate-700">{item}</Text>
          <Text className="text-xs text-slate-900 font-medium">{qty}</Text>
        </View>
      ))}

      <Text className="text-xs font-semibold text-slate-700 mt-2 mb-1">
        Credit used (top {topCredits.length})
      </Text>
      {topCredits.map((c) => {
        const used = creditUsed[c.customerId] ?? 0;
        const pct = c.creditLimit > 0 ? Math.min(100, (used / c.creditLimit) * 100) : 0;
        return (
          <View
            key={c.customerId}
            className="bg-white border border-slate-200 rounded-md p-2 mb-1"
          >
            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-700">{c.customerId}</Text>
              <Text className="text-xs text-slate-900 font-medium">
                {used.toLocaleString()} / {c.creditLimit.toLocaleString()}
              </Text>
            </View>
            <View className="h-1 bg-slate-200 rounded mt-1 overflow-hidden">
              <View
                className="h-1 bg-emerald-500"
                style={{ width: `${pct}%` }}
              />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
