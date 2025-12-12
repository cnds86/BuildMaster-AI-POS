
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
import { ApprovalManagement } from './components/ApprovalManagement';
import { UserManagement } from './components/UserManagement';
import { Settings } from './components/Settings';
import { SyncManagement } from './components/SyncManagement';
import { CustomerManagement } from './components/CustomerManagement';
import { ShiftManagement } from './components/ShiftManagement';
import { PromotionsManagement } from './components/PromotionsManagement';
import LoginPage from './app/page';
import { useGlobal } from './context/GlobalContext';

function App() {
  const {
    currentUser, setCurrentUser,
    users,
    products, sales, units, categories, branches, posMachines, warehouses, locations,
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
    settings, updateSettings,
    t
  } = useGlobal();

  const [activeTab, setActiveTab] = useState('dashboard');

  // Effect to redirect/set active tab based on role upon login
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'Cashier') {
        setActiveTab('pos');
      } else if (currentUser.role === 'Staff') {
        setActiveTab('inventory');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // --- Render Login via app/page ---
  if (!currentUser) {
    return <LoginPage />;
  }

  // --- Main Render ---
  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {activeTab === 'dashboard' && <Dashboard sales={sales} products={products} />}
      
      {activeTab === 'pos' && (
        <PosTerminal 
          products={products} 
          onProcessSale={processSale} 
          settings={settings}
        />
      )}

      {activeTab === 'shifts' && (
        <ShiftManagement 
          shifts={shifts}
          branches={branches}
          users={users}
          currentUser={currentUser}
          onStartShift={startShift}
          onEndShift={endShift}
        />
      )}
      
      {activeTab === 'inventory' && (
        <Inventory 
          products={products} 
          units={units} 
          categories={categories}
          warehouses={warehouses}
          sales={sales}
          onAddProduct={addProduct}
          onUpdateProduct={updateProduct}
          onDeleteProduct={deleteProduct}
        />
      )}
      
      {activeTab === 'stock' && (
        <StockManagement 
          warehouses={warehouses}
          products={products}
          transfers={transfers}
          counts={counts}
          reservations={reservations}
          receipts={receipts}
          adjustments={adjustments}
          defaultItemsPerPage={settings.defaultItemsPerPage}
          onUpdateTransfer={updateTransfer}
          onUpdateCount={updateCount}
          onUpdateReservation={updateReservation}
          onUpdateReceipt={updateReceipt}
          onUpdateAdjustment={updateAdjustment}
          onDeleteTransfer={deleteTransfer}
          onDeleteCount={deleteCount}
          onDeleteReservation={deleteReservation}
          onDeleteReceipt={deleteReceipt}
          onDeleteAdjustment={deleteAdjustment}
          onStatusChange={handleStockStatusChange}
        />
      )}

      {activeTab === 'approvals' && (
        <ApprovalManagement 
          transfers={transfers}
          counts={counts}
          reservations={reservations}
          receipts={receipts}
          adjustments={adjustments}
          warehouses={warehouses}
          onStatusChange={handleStockStatusChange}
        />
      )}

      {activeTab === 'promotions' && (
        <PromotionsManagement 
          promotions={promotions}
          onAddPromotion={addPromotion}
          onUpdatePromotion={updatePromotion}
          onDeletePromotion={deletePromotion}
        />
      )}

      {activeTab === 'customers' && (
        <CustomerManagement
          customers={customers}
          onAddCustomer={addCustomer}
          onUpdateCustomer={updateCustomer}
          onDeleteCustomer={deleteCustomer}
        />
      )}

      {activeTab === 'sync' && (
        <SyncManagement 
          settings={settings}
          logs={syncLogs}
          sales={sales}
          onSync={handleSyncOperation}
        />
      )}
      
      {activeTab === 'units' && (
        <UnitManagement 
          units={units} 
          onAddUnit={addUnit}
          onUpdateUnit={updateUnit} 
          onDeleteUnit={deleteUnit} 
        />
      )}

      {activeTab === 'categories' && (
        <CategoryManagement 
          categories={categories}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
        />
      )}

      {activeTab === 'branches' && (
        <BranchManagement
          branches={branches}
          posMachines={posMachines}
          onAddBranch={addBranch}
          onUpdateBranch={updateBranch}
          onDeleteBranch={deleteBranch}
          onAddPosMachine={addPos}
          onUpdatePosMachine={updatePos}
          onDeletePosMachine={deletePos}
        />
      )}

      {activeTab === 'warehouses' && (
        <WarehouseManagement
           branches={branches}
           warehouses={warehouses}
           locations={locations}
           onAddWarehouse={addWarehouse}
           onUpdateWarehouse={updateWarehouse}
           onDeleteWarehouse={deleteWarehouse}
           onAddLocation={addLocation}
           onUpdateLocation={updateLocation}
           onDeleteLocation={deleteLocation}
        />
      )}

      {activeTab === 'users' && (
        <UserManagement
          users={users}
          onAddUser={addUser}
          onUpdateUser={updateUser}
          onDeleteUser={deleteUser}
        />
      )}

      {activeTab === 'settings' && (
        <Settings 
          settings={settings} 
          onUpdateSettings={updateSettings} 
          branches={branches}
          posMachines={posMachines}
        />
      )}
    </Layout>
  );
}

export default App;
