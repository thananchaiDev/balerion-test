import { Button } from '@/components/ui/button';
import Filters from '@/components/Filters';
import OrderTable from '@/components/OrderTable';
import PaginationControls from '@/components/PaginationControls';
import type { ValidationOutcome } from '@/logic/allocation';
import type { FilterState } from '@/utils/filterState';
import type { AllocationResult, Order } from '@/domain/types';
import type { OrderSortState } from '@/utils/orderSort';

interface OrdersPageProps {
  filter: FilterState;
  customerOptions: string[];
  warehouseOptions: string[];
  supplierOptions: string[];
  filteredOrderCount: number;
  totalOrderCount: number;
  paginatedOrders: Order[];
  result: AllocationResult;
  errors: Record<string, string | undefined>;
  busy: boolean;
  orderSort: OrderSortState;
  orderStartIndex: number;
  orderPage: number;
  orderPageSize: number;
  orderPageSizeOptions: readonly number[];
  onFilterChange: (filter: FilterState) => void;
  onManualChange: (subOrder: string, value: number) => void;
  validateAllocationChange: (
    subOrder: string,
    value: number,
  ) => ValidationOutcome;
  onOrderSortChange: (sort: OrderSortState) => void;
  onOrderPageChange: (page: number) => void;
  onOrderPageSizeChange: (pageSize: number) => void;
  onReAutoAllocate: () => void;
  onResetSample: () => void;
  onGenerate: (n: number) => void;
}

export default function OrdersPage({
  filter,
  customerOptions,
  warehouseOptions,
  supplierOptions,
  filteredOrderCount,
  totalOrderCount,
  paginatedOrders,
  result,
  errors,
  busy,
  orderSort,
  orderStartIndex,
  orderPage,
  orderPageSize,
  orderPageSizeOptions,
  onFilterChange,
  onManualChange,
  validateAllocationChange,
  onOrderSortChange,
  onOrderPageChange,
  onOrderPageSizeChange,
  onReAutoAllocate,
  onResetSample,
  onGenerate,
}: OrdersPageProps) {
  return (
    <>
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage sub-orders, filter by customer/warehouse/supplier, and edit
            allocations manually within stock and credit limits.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onReAutoAllocate}>
            Re-run auto-allocate
          </Button>
          <Button size="sm" variant="secondary" onClick={onResetSample}>
            Reset sample (4 orders)
          </Button>
          <Button size="sm" variant="success" onClick={() => onGenerate(1000)}>
            Generate 1,000
          </Button>
          <Button size="sm" variant="success" onClick={() => onGenerate(5000)}>
            Generate 5,000
          </Button>
          <Button size="sm" variant="success" onClick={() => onGenerate(10000)}>
            Generate 10,000
          </Button>
        </div>
      </header>
      <Filters
        value={filter}
        onChange={onFilterChange}
        customerOptions={customerOptions}
        warehouseOptions={warehouseOptions}
        supplierOptions={supplierOptions}
        matchCount={filteredOrderCount}
        totalCount={totalOrderCount}
      />
      <OrderTable
        orders={paginatedOrders}
        result={result}
        onChange={onManualChange}
        validateChange={validateAllocationChange}
        errors={errors}
        busy={busy}
        sort={orderSort}
        onSortChange={onOrderSortChange}
        startIndex={orderStartIndex}
      />
      <PaginationControls
        page={orderPage}
        pageSize={orderPageSize}
        pageSizeOptions={orderPageSizeOptions}
        totalItems={filteredOrderCount}
        onPageChange={onOrderPageChange}
        onPageSizeChange={onOrderPageSizeChange}
      />
    </>
  );
}
