
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { PosTerminal } from './components/PosTerminal';
import { UnitManagement } from './components/UnitManagement';
import { CategoryManagement } from './components/CategoryManagement';
import { BranchManagement } from './components/BranchManagement';
import { WarehouseManagement } from './components/WarehouseManagement';
import { StockManagement } from './components/StockManagement';
import { UserManagement } from './components/UserManagement';
import { Settings } from './components/Settings';
import { SyncManagement } from './components/SyncManagement';
import { CustomerManagement } from './components/CustomerManagement';
import { ShiftManagement } from './components/ShiftManagement';
import { PromotionsManagement } from './components/PromotionsManagement';
import { ReportsManagement } from './components/ReportsManagement';
import { UserProfile } from './components/UserProfile';
import { SalesHistory } from './components/SalesHistory';
import { QuotationsManagement } from './components/QuotationsManagement';
import { LoginPage } from './components/LoginPage';
import { useGlobal } from './context/GlobalContext';
import { UserRole } from './types';

const PERMISSIONS: Record<string, UserRole[]> = {
  'dashboard': ['Admin', 'Manager'],
  'reports': ['Admin', 'Manager'],
  'pos': ['Admin', 'Manager', 'Staff', 'Cashier'],
  'shifts': ['Admin', 'Manager', 'Staff', 'Cashier'],
  'sales': ['Admin', 'Manager', 'Cashier'],
  'quotations': ['Admin', 'Manager', 'Cashier'],
  'inventory': ['Admin', 'Manager', 'Staff'],
  'stock': ['Admin', 'Manager', 'Staff'],
  'customers': ['Admin', 'Manager', 'Cashier', 'Staff'],
  'approvals': ['Admin', 'Manager'],
  'promotions': ['Admin', 'Manager', 'Staff'],
  'sync': ['Admin', 'Manager'],
  'categories': ['Admin', 'Staff', 'Manager'],
  'units': ['Admin', 'Staff', 'Manager'],
  'branches': ['Admin', 'Manager'],
  'warehouses': ['Admin', 'Staff', 'Manager'],
  'users': ['Admin', 'Manager'],
  'settings': ['Admin'],
  'profile': ['Admin', 'Manager', 'Staff', 'Cashier']
};

function App() {
  const global = useGlobal();
  const { currentUser, setCurrentUser, products, sales, warehouses, settings } = global;
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (currentUser) {
      if (PERMISSIONS[activeTab] && !PERMISSIONS[activeTab].includes(currentUser.role)) {
         if (currentUser.role === 'Cashier') setActiveTab('pos');
         else if (currentUser.role === 'Staff') setActiveTab('inventory');
         else setActiveTab('dashboard');
      }
    }
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleTabChange = (tabId: string) => {
    if (currentUser && PERMISSIONS[tabId]?.includes(currentUser.role)) {
      setActiveTab(tabId);
    } else {
      alert("Access Denied");
    }
  };

  if (!currentUser) return <LoginPage />;

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={handleTabChange}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {activeTab === 'dashboard' && <Dashboard sales={sales} products={products} />}
      {activeTab === 'reports' && <ReportsManagement sales={sales} products={products} />}
      {activeTab === 'pos' && <PosTerminal products={products} onProcessSale={global.processSale} settings={settings} />}
      {activeTab === 'shifts' && <ShiftManagement shifts={global.shifts} branches={global.branches} users={global.users} currentUser={currentUser} onStartShift={global.startShift} onEndShift={global.endShift} />}
      {activeTab === 'sales' && <SalesHistory sales={sales} onVoidSale={global.handleVoidSale} />}
      {activeTab === 'quotations' && <QuotationsManagement />} 
      {activeTab === 'inventory' && <Inventory products={products} units={global.units} categories={global.categories} warehouses={warehouses} sales={sales} onAddProduct={global.addProduct} onUpdateProduct={global.updateProduct} onDeleteProduct={global.deleteProduct} />}
      {activeTab === 'stock' && <StockManagement warehouses={warehouses} products={products} transfers={global.transfers} counts={global.counts} reservations={global.reservations} receipts={global.receipts} adjustments={global.adjustments} defaultItemsPerPage={settings.defaultItemsPerPage} onUpdateTransfer={global.updateTransfer} onUpdateCount={global.updateCount} onUpdateReservation={global.updateReservation} onUpdateReceipt={global.updateReceipt} onUpdateAdjustment={global.updateAdjustment} onDeleteTransfer={global.deleteTransfer} onDeleteCount={global.deleteCount} onDeleteReservation={global.deleteReservation} onDeleteReceipt={global.deleteReceipt} onDeleteAdjustment={global.deleteAdjustment} onStatusChange={global.handleStockStatusChange} />}
      {activeTab === 'promotions' && <PromotionsManagement promotions={global.promotions} onAddPromotion={global.addPromotion} onUpdatePromotion={global.updatePromotion} onDeletePromotion={global.deletePromotion} />}
      {activeTab === 'customers' && <CustomerManagement customers={global.customers} sales={sales} onAddCustomer={global.addCustomer} onUpdateCustomer={global.updateCustomer} onDeleteCustomer={global.deleteCustomer} />}
      {activeTab === 'sync' && <SyncManagement settings={settings} logs={global.syncLogs} sales={sales} onSync={global.handleSyncOperation} />}
      {activeTab === 'units' && <UnitManagement units={global.units} onAddUnit={global.addUnit} onUpdateUnit={global.updateUnit} onDeleteUnit={global.deleteUnit} />}
      {activeTab === 'categories' && <CategoryManagement categories={global.categories} onAddCategory={global.addCategory} onUpdateCategory={global.updateCategory} onDeleteCategory={global.deleteCategory} />}
      {activeTab === 'branches' && <BranchManagement branches={global.branches} posMachines={global.posMachines} onAddBranch={global.addBranch} onUpdateBranch={global.updateBranch} onDeleteBranch={global.deleteBranch} onAddPosMachine={global.addPos} onUpdatePosMachine={global.updatePos} onDeletePosMachine={global.deletePos} />}
      {activeTab === 'warehouses' && <WarehouseManagement branches={global.branches} warehouses={warehouses} locations={global.locations} onAddWarehouse={global.addWarehouse} onUpdateWarehouse={global.updateWarehouse} onDeleteWarehouse={global.deleteWarehouse} onAddLocation={global.addLocation} onUpdateLocation={global.updateLocation} onDeleteLocation={global.deleteLocation} />}
      {activeTab === 'users' && <UserManagement users={global.users} onAddUser={global.addUser} onUpdateUser={global.updateUser} onDeleteUser={global.deleteUser} />}
      {activeTab === 'settings' && <Settings settings={settings} onUpdateSettings={global.updateSettings} branches={global.branches} posMachines={global.posMachines} />}
      {activeTab === 'profile' && <UserProfile user={currentUser} shifts={global.shifts} sales={sales} />}
    </Layout>
  );
}

export default App;
