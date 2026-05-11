import { useCallback, useMemo, useState } from 'react';

import {
  SAMPLE_ORDERS,
  SAMPLE_PRICES,
  SAMPLE_STOCK,
  SAMPLE_CREDITS,
  generateSyntheticOrders,
  generateCreditsForOrders,
  generateStockForOrders,
} from '../data/mock';
import {
  autoAllocate,
  applyManualUpdate,
  type AllocationContext,
  type AllocationResult,
} from '../logic/allocation/allocate';
import { uniqueSortedStrings } from '../utils/collection';
import { initialFilter, type FilterState } from '../utils/filterState';
import { sortOrders, type OrderSortDirection } from '../utils/orderSort';
import type { Order } from '../domain/types';

const ORDER_PAGE_SIZE_OPTIONS = [25, 50, 100, 250, 500] as const;
const DEFAULT_ORDER_PAGE_SIZE = 100;

export function useAllocationWorkspace() {
  const [orders, setOrders] = useState(SAMPLE_ORDERS);
  const [prices, setPrices] = useState(SAMPLE_PRICES);
  const [stock, setStock] = useState(SAMPLE_STOCK);
  const [credits, setCredits] = useState(SAMPLE_CREDITS);

  const ctx: AllocationContext = useMemo(
    () => ({ orders, prices, stock, credits }),
    [orders, prices, stock, credits],
  );

  const [result, setResult] = useState<AllocationResult>(() =>
    autoAllocate(ctx),
  );
  const [filter, setFilter] = useState<FilterState>(initialFilter);
  const [orderSortDirection, setOrderSortDirection] =
    useState<OrderSortDirection>('asc');
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState<number>(
    DEFAULT_ORDER_PAGE_SIZE,
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const customerOptions = useMemo(
    () => uniqueSortedStrings(orders.map(o => o.customerId)),
    [orders],
  );
  const warehouseOptions = useMemo(
    () => uniqueSortedStrings(orders.map(o => o.warehouseId)),
    [orders],
  );
  const supplierOptions = useMemo(
    () => uniqueSortedStrings(orders.map(o => o.supplierId)),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const q = filter.search.trim().toLowerCase();
    return orders.filter(o => {
      if (filter.type !== 'ALL' && o.type !== filter.type) return false;
      if (filter.customerId && o.customerId !== filter.customerId) return false;
      if (filter.warehouseId && o.warehouseId !== filter.warehouseId)
        return false;
      if (filter.supplierId && o.supplierId !== filter.supplierId) return false;
      if (!q) return true;
      return (
        o.orderId.toLowerCase().includes(q) ||
        o.subOrderId.toLowerCase().includes(q) ||
        o.customerId.toLowerCase().includes(q) ||
        o.itemId.toLowerCase().includes(q)
      );
    });
  }, [orders, filter]);

  const sortedOrders = useMemo(
    () => sortOrders(filteredOrders, orderSortDirection),
    [filteredOrders, orderSortDirection],
  );

  const orderPageCount = Math.max(
    1,
    Math.ceil(sortedOrders.length / orderPageSize),
  );
  const safeOrderPage = Math.min(orderPage, orderPageCount);
  const orderStartIndex = (safeOrderPage - 1) * orderPageSize;

  const paginatedOrders: Order[] = useMemo(
    () => sortedOrders.slice(orderStartIndex, orderStartIndex + orderPageSize),
    [sortedOrders, orderPageSize, orderStartIndex],
  );

  const reAllocate = useCallback((next: AllocationContext) => {
    setResult(autoAllocate(next));
  }, []);

  const handleFilterChange = useCallback((next: FilterState) => {
    setFilter(next);
    setOrderPage(1);
  }, []);

  const handleOrderPageSizeChange = useCallback((size: number) => {
    setOrderPageSize(size);
    setOrderPage(1);
  }, []);

  const handleOrderSortChange = useCallback((direction: OrderSortDirection) => {
    setOrderSortDirection(direction);
    setOrderPage(1);
  }, []);

  const handleManualChange = useCallback(
    (subOrderId: string, raw: number) => {
      const outcome = applyManualUpdate(ctx, result, {
        subOrderId,
        newAllocated: raw,
      });
      if (!outcome.ok) {
        setErrors(e => ({ ...e, [subOrderId]: outcome.reason }));
        return { ok: false as const, reason: outcome.reason };
      }
      setResult(outcome.result);
      setErrors(e => ({ ...e, [subOrderId]: undefined }));
      return { ok: true as const };
    },
    [ctx, result],
  );

  const handleReAutoAllocate = useCallback(() => {
    if (busy) return;
    setBusy(true);
    setBusyAction('re-auto-allocate');
    setTimeout(() => {
      reAllocate(ctx);
      setErrors({});
      setBusy(false);
      setBusyAction(null);
    }, 0);
  }, [busy, ctx, reAllocate]);

  const handleResetSample = useCallback(() => {
    if (busy) return;
    setBusy(true);
    setBusyAction('reset-sample');
    setTimeout(() => {
      setOrders(SAMPLE_ORDERS);
      setPrices(SAMPLE_PRICES);
      setStock(SAMPLE_STOCK);
      setCredits(SAMPLE_CREDITS);
      reAllocate({
        orders: SAMPLE_ORDERS,
        prices: SAMPLE_PRICES,
        stock: SAMPLE_STOCK,
        credits: SAMPLE_CREDITS,
      });
      setFilter(initialFilter);
      setErrors({});
      setOrderPage(1);
      setBusy(false);
      setBusyAction(null);
    }, 0);
  }, [busy, reAllocate]);

  const handleGenerate = useCallback(
    (n: number) => {
      if (busy) return;
      setBusy(true);
      setBusyAction(`generate-${n}`);
      setTimeout(() => {
        const newOrders = generateSyntheticOrders(n);
        const newCredits = generateCreditsForOrders(newOrders);
        const newStock = generateStockForOrders(newOrders);
        setOrders(newOrders);
        setCredits(newCredits);
        setStock(newStock);
        reAllocate({
          orders: newOrders,
          prices,
          stock: newStock,
          credits: newCredits,
        });
        setFilter(initialFilter);
        setErrors({});
        setOrderPage(1);
        setBusy(false);
        setBusyAction(null);
      }, 0);
    },
    [busy, prices, reAllocate],
  );

  return {
    orders,
    prices,
    stock,
    credits,
    result,
    busyAction,
    filter,
    orderSortDirection,
    customerOptions,
    warehouseOptions,
    supplierOptions,
    filteredOrderCount: filteredOrders.length,
    totalOrderCount: orders.length,
    filteredOrders: sortedOrders,
    paginatedOrders,
    errors,
    busy,
    orderStartIndex,
    orderPage: safeOrderPage,
    orderPageSize,
    orderPageSizeOptions: ORDER_PAGE_SIZE_OPTIONS,
    handleFilterChange,
    handleOrderSortChange,
    handleManualChange,
    handleOrderPageChange: setOrderPage,
    handleOrderPageSizeChange,
    handleReAutoAllocate,
    handleResetSample,
    handleGenerate,
  };
}

export type AllocationWorkspace = ReturnType<typeof useAllocationWorkspace>;
