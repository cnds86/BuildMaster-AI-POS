import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Dashboard } from '../components/Dashboard';
import { Inventory } from '../components/Inventory';
import { PosTerminal } from '../components/PosTerminal';
import { UnitManagement } from '../components/UnitManagement';
import { CategoryManagement } from '../components/CategoryManagement';
import { BranchManagement } from '../components/BranchManagement';
import { WarehouseManagement } from '../components/WarehouseManagement';
import { StockManagement } from '../components/StockManagement';
import { ApprovalManagement } from '../components/ApprovalManagement';
import { UserManagement } from '../components/UserManagement';
import { Settings } from '../components/Settings';
import { SyncManagement } from '../components/SyncManagement';
import { CustomerManagement } from '../components/CustomerManagement';
import { ShiftManagement } from '../components/ShiftManagement';
import { PromotionsManagement } from '../components/PromotionsManagement';
import { ReportsManagement } from '../components/ReportsManagement';
import { UserProfile } from '../components/UserProfile';
import { SalesHistory } from '../components/SalesHistory';
import { QuotationsManagement } from '../components/QuotationsManagement';
import { DeliveryDashboard } from '../components/delivery/DeliveryDashboard';
import { ExpenseManagement } from '../components/ExpenseManagement';
import { LoginPage } from '../components/LoginPage';
import { CustomerDisplayPage } from '../components/CustomerDisplayPage';
import { WMSDashboard } from '../components/wms/WMSDashboard';
import { useGlobal } from '../context/GlobalContext';
import { UserRole } from '../types';
import { ErrorBoundary } from '../components/ux/ErrorBoundary';

/**
 * Wraps a page component in an inline ErrorBoundary so a single page
 * crash (e.g. unexpected null in a render) shows a recoverable error
 * card in the main area instead of white-screening the whole POS.
 * Critical for a 24/7 cash register — one bad page must not block
 * the operator from continuing to ring up sales on /pos.
 */
function withPageBoundary<P extends object>(
  Page: React.ComponentType<P>,
  displayName: string,
): React.ComponentType<P> {
  const Wrapped: React.FC<P> = (props) => (
    <ErrorBoundary
      fallback={(err, reset) => (
        <div className="max-w-2xl mx-auto mt-8 bg-white rounded-2xl border border-red-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-red-700 mb-1">
            {displayName} failed to load
          </h2>
          <p className="text-sm text-slate-600 mb-4 break-words">
            {err.message}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = '/dashboard'; }}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    >
      <Page {...props} />
    </ErrorBoundary>
  );
  Wrapped.displayName = `withPageBoundary(${displayName})`;
  return Wrapped;
}

// RBAC permission map — mirrors original PERMISSIONS but uses path keys
const PERMISSIONS: Record<string, string[]> = {
  '/dashboard': ['ADMIN', 'MANAGER'],
  '/reports': ['ADMIN', 'MANAGER'],
  '/pos': ['ADMIN', 'MANAGER', 'STAFF', 'CASHIER'],
  '/shifts': ['ADMIN', 'MANAGER', 'STAFF', 'CASHIER'],
  '/sales': ['ADMIN', 'MANAGER', 'CASHIER'],
  '/expenses': ['ADMIN', 'MANAGER', 'CASHIER', 'STAFF'],
  '/quotations': ['ADMIN', 'MANAGER', 'CASHIER'],
  '/inventory': ['ADMIN', 'MANAGER', 'STAFF'],
  '/stock': ['ADMIN', 'MANAGER', 'STAFF'],
  '/delivery': ['ADMIN', 'MANAGER', 'STAFF'],
  '/customers': ['ADMIN', 'MANAGER', 'CASHIER', 'STAFF'],
  '/approvals': ['ADMIN', 'MANAGER'],
  '/promotions': ['ADMIN', 'MANAGER', 'STAFF'],
  '/sync': ['ADMIN', 'MANAGER'],
  '/categories': ['ADMIN', 'STAFF', 'MANAGER'],
  '/units': ['ADMIN', 'STAFF', 'MANAGER'],
  '/branches': ['ADMIN', 'MANAGER'],
  '/warehouses': ['ADMIN', 'STAFF', 'MANAGER'],
  '/wms': ['ADMIN', 'STAFF', 'MANAGER'],
  '/users': ['ADMIN', 'MANAGER'],
  '/settings': ['ADMIN'],
  '/profile': ['ADMIN', 'MANAGER', 'STAFF', 'CASHIER'],
};
// ─── Page Wrapper
function DashboardPage() {
  const { sales, products } = useGlobal();
  return <Dashboard sales={sales} products={products} />;
}
function PosTerminalPage() {
  const { products } = useGlobal();
  const { processSale } = useGlobal();
  const { settings } = useGlobal();
  return <PosTerminal products={products} onProcessSale={processSale} settings={settings} />;
}
function ShiftManagementPage() {
  const { shifts, branches, users } = useGlobal();
  const { currentUser } = useGlobal();
  const { startShift, endShift } = useGlobal();
  return <ShiftManagement shifts={shifts} branches={branches} users={users} currentUser={currentUser} onStartShift={startShift} onEndShift={endShift} />;
}
function SalesHistoryPage() {
  const { sales } = useGlobal();
  const { handleVoidSale } = useGlobal();
  return <SalesHistory sales={sales} onVoidSale={handleVoidSale} />;
}
function ExpenseManagementPage() {
  const { expenses, expenseCategories, users, branches } = useGlobal();
  return <ExpenseManagement expenses={expenses} categories={expenseCategories} users={users} branches={branches} />;
}
function InventoryPage() {
  const { products, units, categories, warehouses, sales } = useGlobal();
  const { addProduct, updateProduct, deleteProduct } = useGlobal();
  return <Inventory products={products} units={units} categories={categories} warehouses={warehouses} sales={sales} onAddProduct={addProduct} onUpdateProduct={updateProduct} onDeleteProduct={deleteProduct} />;
}
function StockManagementPage() {
  const { warehouses, products, transfers, counts, reservations, receipts, adjustments, settings } = useGlobal();
  const { updateTransfer, updateCount, updateReservation, updateReceipt, updateAdjustment, deleteTransfer, deleteCount, deleteReservation, deleteReceipt, deleteAdjustment, handleStockStatusChange } = useGlobal();
  return <StockManagement warehouses={warehouses} products={products} transfers={transfers} counts={counts} reservations={reservations} receipts={receipts} adjustments={adjustments} defaultItemsPerPage={settings.defaultItemsPerPage} onUpdateTransfer={updateTransfer} onUpdateCount={updateCount} onUpdateReservation={updateReservation} onUpdateReceipt={updateReceipt} onUpdateAdjustment={updateAdjustment} onDeleteTransfer={deleteTransfer} onDeleteCount={deleteCount} onDeleteReservation={deleteReservation} onDeleteReceipt={deleteReceipt} onDeleteAdjustment={deleteAdjustment} onStatusChange={handleStockStatusChange} />;
}
function PromotionsManagementPage() {
  const { promotions } = useGlobal();
  const { addPromotion, updatePromotion, deletePromotion } = useGlobal();
  return <PromotionsManagement promotions={promotions} onAddPromotion={addPromotion} onUpdatePromotion={updatePromotion} onDeletePromotion={deletePromotion} />;
}
function CustomerManagementPage() {
  const { customers, sales, addCustomer, updateCustomer, deleteCustomer } = useGlobal();
  return <CustomerManagement customers={customers} sales={sales} onAddCustomer={addCustomer} onUpdateCustomer={updateCustomer} onDeleteCustomer={deleteCustomer} />;
}
function UnitManagementPage() {
  const { units } = useGlobal();
  const { addUnit, updateUnit, deleteUnit } = useGlobal();
  return <UnitManagement units={units} onAddUnit={addUnit} onUpdateUnit={updateUnit} onDeleteUnit={deleteUnit} />;
}
function CategoryManagementPage() {
  const { categories } = useGlobal();
  const { addCategory, updateCategory, deleteCategory } = useGlobal();
  return <CategoryManagement categories={categories} onAddCategory={addCategory} onUpdateCategory={updateCategory} onDeleteCategory={deleteCategory} />;
}
function BranchManagementPage() {
  const { branches, posMachines } = useGlobal();
  const { addBranch, updateBranch, deleteBranch, addPos, updatePos, deletePos } = useGlobal();
  return <BranchManagement branches={branches} posMachines={posMachines} onAddBranch={addBranch} onUpdateBranch={updateBranch} onDeleteBranch={deleteBranch} onAddPosMachine={addPos} onUpdatePosMachine={updatePos} onDeletePosMachine={deletePos} />;
}
function WarehouseManagementPage() {
  const { branches, warehouses, locations } = useGlobal();
  const { addWarehouse, updateWarehouse, deleteWarehouse, addLocation, updateLocation, deleteLocation } = useGlobal();
  return <WarehouseManagement branches={branches} warehouses={warehouses} locations={locations} onAddWarehouse={addWarehouse} onUpdateWarehouse={updateWarehouse} onDeleteWarehouse={deleteWarehouse} onAddLocation={addLocation} onUpdateLocation={updateLocation} onDeleteLocation={deleteLocation} />;
}
function UserManagementPage() {
  const { users } = useGlobal();
  const { addUser, updateUser, deleteUser } = useGlobal();
  return <UserManagement users={users} onAddUser={addUser} onUpdateUser={updateUser} onDeleteUser={deleteUser} />;
}
function SettingsPage() {
  const { settings, branches, posMachines } = useGlobal();
  const { updateSettings } = useGlobal();
  return <Settings settings={settings} onUpdateSettings={updateSettings} branches={branches} posMachines={posMachines} />;
}
function SyncManagementPage() {
  const { settings, syncLogs, sales } = useGlobal();
  const { handleSyncOperation } = useGlobal();
  return <SyncManagement settings={settings} logs={syncLogs} sales={sales} onSync={handleSyncOperation} />;
}
function ApprovalManagementPage() {
  const { transfers, counts, reservations, receipts, adjustments, warehouses } = useGlobal();
  const { handleStockStatusChange } = useGlobal();
  return <ApprovalManagement transfers={transfers} counts={counts} reservations={reservations} receipts={receipts} adjustments={adjustments} warehouses={warehouses} onStatusChange={handleStockStatusChange} />;
}
function UserProfilePage() {
  const { currentUser, shifts, sales } = useGlobal();
  if (!currentUser) return null;
  return <UserProfile user={currentUser} shifts={shifts} sales={sales} />;
}
function ReportsPage() {
  const { sales, products } = useGlobal();
  return <ReportsManagement sales={sales} products={products} />;
}

// ─── App Routes ───────────────────────────────────────────────────────────────
function AppRoutes() {
  const { currentUser, setCurrentUser, fetchUsersFromBackend } = useGlobal();
  const navigate = useNavigate();
  const userRole = currentUser?.role?.toUpperCase() ?? null;

  // Default redirect based on role
  const defaultRoute = !currentUser ? '/login'
    : userRole === 'CASHIER' ? '/pos'
    : userRole === 'STAFF' ? '/inventory'
    : '/dashboard';

  // BUG-FE-05 FIX: When a user logs in, pull the authoritative user list
  // (real UUIDs from the DB) into the system store so that shift.userId and
  // audit log user lookups resolve against the actual backend user ids.
  useEffect(() => {
    if (currentUser) {
      void fetchUsersFromBackend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/login');
  };

  // Public routes (no auth required) — e.g. customer-facing display
  // Bug fix 2026-06-02: /customer-display must work without login (customer has no credentials)
  // Note: CustomerDisplayPage is loaded as a SEPARATE chunk (window.open from POS) to avoid
  // importing the heavy POS bundle into the public route.
  if (typeof window !== 'undefined' && window.location.pathname === '/customer-display') {
    return (
      <Routes>
        <Route path="/customer-display" element={<CustomerDisplayPage />} />
      </Routes>
    );
  }

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout onLogout={handleLogout}>
      <Routes>
        <Route path="/dashboard" element={withPageBoundary(DashboardPage, 'Dashboard')()} />
        <Route path="/reports" element={withPageBoundary(ReportsPage, 'Reports')()} />
        <Route path="/pos" element={withPageBoundary(PosTerminalPage, 'Point of Sale')()} />
        <Route path="/shifts" element={withPageBoundary(ShiftManagementPage, 'Shift Management')()} />
        <Route path="/sales" element={withPageBoundary(SalesHistoryPage, 'Sales History')()} />
        <Route path="/expenses" element={withPageBoundary(ExpenseManagementPage, 'Expenses')()} />
        <Route path="/quotations" element={withPageBoundary(QuotationsManagement, 'Quotations')()} />
        <Route path="/inventory" element={withPageBoundary(InventoryPage, 'Inventory')()} />
        <Route path="/stock" element={withPageBoundary(StockManagementPage, 'Stock Management')()} />
        <Route path="/delivery" element={withPageBoundary(DeliveryDashboard, 'Delivery & Fleet')()} />
        <Route path="/customers" element={withPageBoundary(CustomerManagementPage, 'Customers')()} />
        <Route path="/approvals" element={withPageBoundary(ApprovalManagementPage, 'Approvals')()} />
        <Route path="/promotions" element={withPageBoundary(PromotionsManagementPage, 'Promotions')()} />
        <Route path="/sync" element={withPageBoundary(SyncManagementPage, 'Data Sync')()} />
        <Route path="/units" element={withPageBoundary(UnitManagementPage, 'Unit Management')()} />
        <Route path="/categories" element={withPageBoundary(CategoryManagementPage, 'Categories')()} />
        <Route path="/branches" element={withPageBoundary(BranchManagementPage, 'Branches & POS')()} />
        <Route path="/warehouses" element={withPageBoundary(WarehouseManagementPage, 'Warehouses')()} />
        <Route path="/wms" element={withPageBoundary(WMSDashboard, 'Warehouse (WMS)')()} />
        <Route path="/users" element={withPageBoundary(UserManagementPage, 'Users & Roles')()} />
        <Route path="/settings" element={withPageBoundary(SettingsPage, 'Settings')()} />
        <Route path="/profile" element={withPageBoundary(UserProfilePage, 'User Profile')()} />
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return <AppRoutes />;
}

export default App;
