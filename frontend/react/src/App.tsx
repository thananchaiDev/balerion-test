import { Navigate, Route, Routes } from 'react-router-dom';

import './App.css';
import Sidebar from '@/components/Sidebar';
import { useAllocationWorkspace } from '@/hooks/useAllocationWorkspace';
import DashboardPage from '@/pages/DashboardPage';
import OrdersPage from '@/pages/OrdersPage';

function App() {
  const workspace = useAllocationWorkspace();

  return (
    <div className="flex h-full">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 max-w-[1400px] mx-auto w-full space-y-4">
          <Routes>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <DashboardPage
                  orders={workspace.dataset.orders}
                  stocks={workspace.dataset.stocks}
                  customers={workspace.dataset.customers}
                  result={workspace.result}
                />
              }
            />
            <Route
              path="/orders"
              element={
                <OrdersPage
                  filter={workspace.filter}
                  customerOptions={workspace.customerOptions}
                  warehouseOptions={workspace.warehouseOptions}
                  supplierOptions={workspace.supplierOptions}
                  filteredOrderCount={workspace.filteredOrderCount}
                  totalOrderCount={workspace.totalOrderCount}
                  paginatedOrders={workspace.paginatedOrders}
                  result={workspace.result}
                  errors={workspace.errors}
                  busy={workspace.busy}
                  orderSort={workspace.orderSort}
                  orderStartIndex={workspace.orderStartIndex}
                  orderPage={workspace.orderPage}
                  orderPageSize={workspace.orderPageSize}
                  orderPageSizeOptions={workspace.orderPageSizeOptions}
                  onFilterChange={workspace.handleFilterChange}
                  onManualChange={workspace.handleManualChange}
                  validateAllocationChange={workspace.validateAllocationChange}
                  onOrderSortChange={workspace.handleOrderSortChange}
                  onOrderPageChange={workspace.handleOrderPageChange}
                  onOrderPageSizeChange={workspace.handleOrderPageSizeChange}
                  onReAutoAllocate={workspace.handleReAutoAllocate}
                  onResetSample={workspace.handleResetSample}
                  onGenerate={workspace.handleGenerate}
                />
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
