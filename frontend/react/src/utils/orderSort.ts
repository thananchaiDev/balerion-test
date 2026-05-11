import type { AllocationResult, Order } from '@/domain/types';
import { TYPE_PRIORITY } from '@/domain/types';
import { compareNumber, compareText } from './compare';

export type OrderSortKey =
  | 'order'
  | 'subOrder'
  | 'itemId'
  | 'warehouseId'
  | 'supplierId'
  | 'request'
  | 'type'
  | 'createDate'
  | 'customerId'
  | 'allocated';

export type SortDirection = 'asc' | 'desc';

export type OrderSortState = {
  key: OrderSortKey;
  direction: SortDirection;
} | null;

export function compareOrdersByKey(
  a: Order,
  b: Order,
  key: OrderSortKey,
  result: AllocationResult,
) {
  switch (key) {
    case 'order':
      return compareText(a.order, b.order);
    case 'subOrder':
      return compareText(a.subOrder, b.subOrder);
    case 'itemId':
      return compareText(a.itemId, b.itemId);
    case 'warehouseId':
      return compareText(a.warehouseId, b.warehouseId);
    case 'supplierId':
      return compareText(a.supplierId, b.supplierId);
    case 'request':
      return compareNumber(a.request, b.request);
    case 'type':
      return compareNumber(TYPE_PRIORITY[a.type], TYPE_PRIORITY[b.type]);
    case 'createDate':
      return compareText(a.createDate, b.createDate);
    case 'customerId':
      return compareText(a.customerId, b.customerId);
    case 'allocated':
      return compareNumber(
        result.allocated[a.subOrder] ?? 0,
        result.allocated[b.subOrder] ?? 0,
      );
  }
}

export function compareOrders(
  a: Order,
  b: Order,
  sort: OrderSortState,
  result: AllocationResult,
) {
  if (!sort) return 0;
  const primary = compareOrdersByKey(a, b, sort.key, result);
  if (primary !== 0) return sort.direction === 'asc' ? primary : -primary;
  return compareText(a.subOrder, b.subOrder);
}

export function sortOrders(
  orders: Order[],
  sort: OrderSortState,
  result: AllocationResult,
) {
  if (!sort) return orders;
  return [...orders].sort((a, b) => compareOrders(a, b, sort, result));
}
