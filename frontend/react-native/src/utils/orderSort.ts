import type { Order } from '../domain/types';

export type OrderSortDirection = 'asc' | 'desc';

export function sortOrders(
  orders: Order[],
  direction: OrderSortDirection,
): Order[] {
  return [...orders].sort((a, b) => {
    const primary = a.subOrderId.localeCompare(b.subOrderId);
    const fallback = a.orderId.localeCompare(b.orderId);
    const result = primary || fallback;
    return direction === 'asc' ? result : -result;
  });
}
