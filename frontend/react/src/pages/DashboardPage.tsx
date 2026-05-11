import AllocationSummary from '@/components/AllocationSummary';
import type { AllocationResult, Customer, Order, StockRow } from '@/domain/types';

interface DashboardPageProps {
  orders: Order[];
  stocks: StockRow[];
  customers: Customer[];
  result: AllocationResult;
}

export default function DashboardPage({
  orders,
  stocks,
  customers,
  result,
}: DashboardPageProps) {
  return (
    <>
      <header>
        <h1 className="text-xl md:text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Allocation totals, stock by item, and credit utilisation.
        </p>
      </header>
      <AllocationSummary
        orders={orders}
        stocks={stocks}
        customers={customers}
        result={result}
      />
    </>
  );
}
