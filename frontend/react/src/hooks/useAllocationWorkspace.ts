import { useMemo, useState } from 'react';

import {
  SAMPLE_CUSTOMERS,
  SAMPLE_ORDERS,
  SAMPLE_PRICES,
  SAMPLE_STOCKS,
  generateSyntheticDataset,
  type Dataset,
} from '@/data/mockData';
import {
  autoAllocate,
  recomputeAllocation,
  validateManualChange,
} from '@/logic/allocation';
import type { AllocationResult } from '@/domain/types';
import { uniqueSortedStrings } from '@/utils/collection';
import { initialFilter, type FilterState } from '@/utils/filterState';
import { sortOrders, type OrderSortState } from '@/utils/orderSort';

const initialDataset: Dataset = {
  orders: SAMPLE_ORDERS,
  prices: SAMPLE_PRICES,
  stocks: SAMPLE_STOCKS,
  customers: SAMPLE_CUSTOMERS,
};

const ORDER_PAGE_SIZE_OPTIONS = [25, 50, 100, 250, 500] as const;
const DEFAULT_ORDER_PAGE_SIZE = 100;

export function useAllocationWorkspace() {
  const [dataset, setDataset] = useState<Dataset>(initialDataset);
  const [result, setResult] = useState<AllocationResult>(() =>
    autoAllocate(initialDataset),
  );
  const [filter, setFilter] = useState<FilterState>(initialFilter);
  const [orderSort, setOrderSort] = useState<OrderSortState>(null);
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(DEFAULT_ORDER_PAGE_SIZE);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [busy, setBusy] = useState(false);

  const customerOptions = useMemo(
    () => uniqueSortedStrings(dataset.orders.map((o) => o.customerId)),
    [dataset.orders],
  );
  const warehouseOptions = useMemo(
    () => uniqueSortedStrings(dataset.orders.map((o) => o.warehouseId)),
    [dataset.orders],
  );
  const supplierOptions = useMemo(
    () => uniqueSortedStrings(dataset.orders.map((o) => o.supplierId)),
    [dataset.orders],
  );

  const filteredOrders = useMemo(() => {
    const q = filter.search.trim().toLowerCase();
    return dataset.orders.filter((o) => {
      if (filter.type !== 'ALL' && o.type !== filter.type) return false;
      if (filter.customerId && o.customerId !== filter.customerId) return false;
      if (filter.warehouseId && o.warehouseId !== filter.warehouseId) return false;
      if (filter.supplierId && o.supplierId !== filter.supplierId) return false;
      if (!q) return true;
      return (
        o.order.toLowerCase().includes(q) ||
        o.subOrder.toLowerCase().includes(q) ||
        o.customerId.toLowerCase().includes(q) ||
        o.itemId.toLowerCase().includes(q) ||
        (o.remark ?? '').toLowerCase().includes(q)
      );
    });
  }, [dataset.orders, filter]);

  const sortedOrders = useMemo(() => {
    return sortOrders(filteredOrders, orderSort, result);
  }, [filteredOrders, orderSort, result]);

  const orderPageCount = Math.max(
    1,
    Math.ceil(sortedOrders.length / orderPageSize),
  );
  const safeOrderPage = Math.min(orderPage, orderPageCount);
  const orderStartIndex = (safeOrderPage - 1) * orderPageSize;

  const paginatedOrders = useMemo(() => {
    return sortedOrders.slice(orderStartIndex, orderStartIndex + orderPageSize);
  }, [sortedOrders, orderPageSize, orderStartIndex]);

  function handleOrderPageSizeChange(pageSize: number) {
    setOrderPageSize(pageSize);
    setOrderPage(1);
  }

  function handleFilterChange(nextFilter: FilterState) {
    setFilter(nextFilter);
    setOrderPage(1);
  }

  function handleOrderSortChange(nextSort: OrderSortState) {
    setOrderSort(nextSort);
    setOrderPage(1);
  }

  function validateAllocationChange(subOrder: string, value: number) {
    return validateManualChange({ ...dataset, current: result }, subOrder, value);
  }

  function handleManualChange(subOrder: string, raw: number) {
    const ctx = { ...dataset, current: result };
    const outcome = validateManualChange(ctx, subOrder, raw);
    if (!outcome.ok) {
      setErrors((e) => ({ ...e, [subOrder]: outcome.reason }));
      return;
    }
    const nextAllocated = { ...result.allocated, [subOrder]: raw };
    const next = recomputeAllocation(dataset, nextAllocated, result.fulfillment);
    setResult(next);
    setErrors((e) => ({ ...e, [subOrder]: undefined }));
  }

  function handleReAutoAllocate() {
    setBusy(true);
    window.setTimeout(() => {
      setResult(autoAllocate(dataset));
      setErrors({});
      setBusy(false);
    }, 0);
  }

  function handleResetSample() {
    setBusy(true);
    window.setTimeout(() => {
      setDataset(initialDataset);
      setResult(autoAllocate(initialDataset));
      setErrors({});
      setFilter(initialFilter);
      setOrderSort(null);
      setOrderPage(1);
      setBusy(false);
    }, 0);
  }

  function handleGenerate(n: number) {
    setBusy(true);
    window.setTimeout(() => {
      const nextDataset = generateSyntheticDataset(n);
      setDataset(nextDataset);
      setResult(autoAllocate(nextDataset));
      setErrors({});
      setFilter(initialFilter);
      setOrderSort(null);
      setOrderPage(1);
      setBusy(false);
    }, 0);
  }

  return {
    dataset,
    result,
    filter,
    customerOptions,
    warehouseOptions,
    supplierOptions,
    filteredOrderCount: filteredOrders.length,
    totalOrderCount: dataset.orders.length,
    paginatedOrders,
    errors,
    busy,
    orderSort,
    orderStartIndex,
    orderPage: safeOrderPage,
    orderPageSize,
    orderPageSizeOptions: ORDER_PAGE_SIZE_OPTIONS,
    handleFilterChange,
    handleManualChange,
    validateAllocationChange,
    handleOrderSortChange,
    handleOrderPageChange: setOrderPage,
    handleOrderPageSizeChange,
    handleReAutoAllocate,
    handleResetSample,
    handleGenerate,
  };
}
