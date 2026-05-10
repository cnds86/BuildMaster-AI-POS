
import React, { useState, useEffect, useRef } from 'react';
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
import { useGlobal } from '../context/GlobalContext';
import { UserRole } from '../types';

// Define Permissions Map — all uppercase for direct comparison with normalized roles
const PERMISSIONS: Record<string, string[]> = {
  'dashboard': ['ADMIN', 'MANAGER'],
  'reports': ['ADMIN', 'MANAGER'],
  'pos': ['ADMIN', 'MANAGER', 'STAFF', 'CASHIER'],
  'shifts': ['ADMIN', 'MANAGER', 'STAFF', 'CASHIER'],
  'sales': ['ADMIN', 'MANAGER', 'CASHIER'],
  'expenses': ['ADMIN', 'MANAGER', 'CASHIER', 'STAFF'],
  'quotations': ['ADMIN', 'MANAGER', 'CASHIER'],
  'inventory': ['ADMIN', 'MANAGER', 'STAFF'],
  'stock': ['ADMIN', 'MANAGER', 'STAFF'],
  'delivery': ['ADMIN', 'MANAGER', 'STAFF'],
  'customers': ['ADMIN', 'MANAGER', 'CASHIER', 'STAFF'],
  'approvals': ['ADMIN', 'MANAGER'],
  'promotions': ['ADMIN', 'MANAGER', 'STAFF'],
  'sync': ['ADMIN', 'MANAGER'],
  'categories': ['ADMIN', 'STAFF', 'MANAGER'],
  'units': ['ADMIN', 'STAFF', 'MANAGER'],
  'branches': ['ADMIN', 'MANAGER'],
  'warehouses': ['ADMIN', 'STAFF', 'MANAGER'],
  'users': ['ADMIN', 'MANAGER'],
  'settings': ['ADMIN'],
  'profile': ['ADMIN', 'MANAGER', 'STAFF', 'CASHIER']
};

function App() {
  const {
    currentUser, setCurrentUser,
    users, products, sales, units, categories, branches, posMachines, warehouses, locations,
    transfers, counts, reservations, receipts, adjustments, syncLogs, customers, shifts, shiftSchedules, promotions,
    processSale, addProduct, updateProduct, deleteProduct,
    addUnit, updateUnit, deleteUnit, addCategory, updateCategory, deleteCategory,
    addBranch, updateBranch, deleteBranch, addPos, updatePos, deletePos,
    addWarehouse, updateWarehouse, deleteWarehouse, addLocation, updateLocation, deleteLocation,
    addUser, updateUser, deleteUser, addCustomer, updateCustomer, deleteCustomer,
    updateTransfer, deleteTransfer, updateCount, deleteCount, updateReservation, deleteReservation,
    updateReceipt, deleteReceipt, updateAdjustment, deleteAdjustment,
    handleStockStatusChange, handleSyncOperation,
    startShift, endShift,
    addPromotion, updatePromotion, deletePromotion,
    expenses, expenseCategories,
    settings, updateSettings,
    t, handleVoidSale, settleSaleDebt
  } = useGlobal();

  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'dashboard';
  });

  // Sync URL hash → activeTab
  // Use ref to avoid re-registering listener on every activeTab change
  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== activeTabRef.current) setActiveTab(hash);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []); // empty dep = register ONCE on mount

  const userRole = currentUser?.role?.toUpperCase() ?? null;

  useEffect(() => {
    if (currentUser && userRole) {
      if (PERMISSIONS[activeTab] && !PERMISSIONS[activeTab].includes(userRole)) {
         if (userRole === 'CASHIER') setActiveTab('pos');
         else if (userRole === 'STAFF') setActiveTab('inventory');
         else setActiveTab('dashboard');
      }
    }
  }, [currentUser, activeTab, userRole]);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleTabChange = (tabId: string) => {
    if (!currentUser || !userRole) {
      window.location.hash = tabId;
      return;
    }
    if (PERMISSIONS[tabId]?.includes(userRole)) {
      window.location.hash = tabId;
    } else {
      alert(`Access Denied: ${userRole} role cannot access "${tabId}" module.`);
    }
  };

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={handleTabChange}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {activeTab === 'dashboard' && <Dashboard sales={sales} products={products} />}
      {activeTab === 'reports' && <ReportsManagement sales={sales} products={products} />}
      {activeTab === 'pos' && <PosTerminal products={products} onProcessSale={processSale} settings={settings} />}
      {activeTab === 'shifts' && <ShiftManagement shifts={shifts} branches={branches} users={users} currentUser={currentUser} onStartShift={startShift} onEndShift={endShift} />}
      {activeTab === 'sales' && <SalesHistory sales={sales} onVoidSale={handleVoidSale} />}
      {activeTab === 'expenses' && <ExpenseManagement expenses={expenses} categories={expenseCategories} users={users} branches={branches} />}
      {activeTab === 'quotations' && <QuotationsManagement />} 
      {activeTab === 'inventory' && <Inventory products={products} units={units} categories={categories} warehouses={warehouses} sales={sales} onAddProduct={addProduct} onUpdateProduct={updateProduct} onDeleteProduct={deleteProduct} />}
      {activeTab === 'stock' && <StockManagement warehouses={warehouses} products={products} transfers={transfers} counts={counts} reservations={reservations} receipts={receipts} adjustments={adjustments} defaultItemsPerPage={settings.defaultItemsPerPage} onUpdateTransfer={updateTransfer} onUpdateCount={updateCount} onUpdateReservation={updateReservation} onUpdateReceipt={updateReceipt} onUpdateAdjustment={updateAdjustment} onDeleteTransfer={deleteTransfer} onDeleteCount={deleteCount} onDeleteReservation={deleteReservation} onDeleteReceipt={deleteReceipt} onDeleteAdjustment={deleteAdjustment} onStatusChange={handleStockStatusChange} />}
      {activeTab === 'delivery' && <DeliveryDashboard />}
      {activeTab === 'approvals' && <ApprovalManagement transfers={transfers} counts={counts} reservations={reservations} receipts={receipts} adjustments={adjustments} warehouses={warehouses} onStatusChange={handleStockStatusChange} />}
      {activeTab === 'promotions' && <PromotionsManagement promotions={promotions} onAddPromotion={addPromotion} onUpdatePromotion={updatePromotion} onDeletePromotion={deletePromotion} />}
      {activeTab === 'customers' && <CustomerManagement customers={customers} sales={sales} onAddCustomer={addCustomer} onUpdateCustomer={updateCustomer} onDeleteCustomer={deleteCustomer} />}
      {activeTab === 'sync' && <SyncManagement settings={settings} logs={syncLogs} sales={sales} onSync={handleSyncOperation} />}
      {activeTab === 'units' && <UnitManagement units={units} onAddUnit={addUnit} onUpdateUnit={updateUnit} onDeleteUnit={deleteUnit} />}
      {activeTab === 'categories' && <CategoryManagement categories={categories} onAddCategory={addCategory} onUpdateCategory={updateCategory} onDeleteCategory={deleteCategory} />}
      {activeTab === 'branches' && <BranchManagement branches={branches} posMachines={posMachines} onAddBranch={addBranch} onUpdateBranch={updateBranch} onDeleteBranch={deleteBranch} onAddPosMachine={addPos} onUpdatePosMachine={updatePos} onDeletePosMachine={deletePos} />}
      {activeTab === 'warehouses' && <WarehouseManagement branches={branches} warehouses={warehouses} locations={locations} onAddWarehouse={addWarehouse} onUpdateWarehouse={updateWarehouse} onDeleteWarehouse={deleteWarehouse} onAddLocation={addLocation} onUpdateLocation={updateLocation} onDeleteLocation={deleteLocation} />}
      {activeTab === 'users' && <UserManagement users={users} onAddUser={addUser} onUpdateUser={updateUser} onDeleteUser={deleteUser} />}
      {activeTab === 'settings' && <Settings settings={settings} onUpdateSettings={updateSettings} branches={branches} posMachines={posMachines} />}
      {activeTab === 'profile' && <UserProfile user={currentUser} shifts={shifts} sales={sales} />}
    </Layout>
  );
}

export default App;
