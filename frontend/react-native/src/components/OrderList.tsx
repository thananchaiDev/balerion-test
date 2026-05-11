import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import type { Order, Allocation } from '../domain/types';
import { OrderRow } from './OrderRow';
import { theme } from '../theme';

interface Props {
  orders: Order[];
  allocations: Record<string, Allocation>;
  onChange: (
    subOrderId: string,
    value: number,
  ) => { ok: true } | { ok: false; reason: string };
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  contentTopInset?: number;
}

function EmptyOrders() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No orders found</Text>
      <Text style={styles.emptyText}>Adjust search or filters to show orders.</Text>
    </View>
  );
}

export function OrderList({
  orders,
  allocations,
  onChange,
  onScroll,
  contentTopInset = 0,
}: Props) {
  const extraData = useMemo(
    () => ({
      allocations,
    }),
    [allocations],
  );

  const keyExtractor = useCallback((item: Order) => item.subOrderId, []);
  const renderItem = useCallback(
    ({ item }: { item: Order }) => (
      <OrderRow
        order={item}
        allocation={allocations[item.subOrderId]}
        onChange={onChange}
      />
    ),
    [allocations, onChange],
  );
  const contentStyle = useMemo(
    () => [styles.content, contentTopInset ? { paddingTop: contentTopInset } : null],
    [contentTopInset],
  );

  return (
    <FlatList<Order>
      data={orders}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      extraData={extraData}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={EmptyOrders}
      contentContainerStyle={contentStyle}
      removeClippedSubviews={false}
      initialNumToRender={10}
      windowSize={10}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: theme.colors.text.muted,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
});
