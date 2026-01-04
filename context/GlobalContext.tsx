
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, Product, Sale, UnitDefinition, CategoryItem, Branch, PosMachine, 
  Warehouse, StorageLocation, StockTransfer, StockCount, StockReservation, 
  StockReceipt, StockAdjustment, SyncLog, Customer, CustomerLevel, Shift, 
  ShiftSchedule, Promotion, SystemSettings, AppNotification, CartItem, 
  DocumentStatus, CashTransaction, Quotation, AuditLog
} from '../types';
import { useSystemStore } from '../store/useSystemStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useSalesStore } from '../store/useSalesStore';
import { useStockStore } from '../store/useStockStore';
import { translations } from '../services/translations';

interface GlobalContextType {
  // State
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  settings: SystemSettings;
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  customerLevels: CustomerLevel[];
  units: UnitDefinition[];
  categories: CategoryItem[];
  branches: Branch[];
  posMachines: PosMachine[];
  warehouses: Warehouse[];
  locations: StorageLocation[];
  shifts: Shift[];
  shiftSchedules: ShiftSchedule[];
  promotions: Promotion[];
  notifications: AppNotification[];
  syncLogs: SyncLog[];
  auditLogs: AuditLog[];
  
  // Stock State
  transfers: StockTransfer[];
  counts: StockCount[];
  reservations: StockReservation[];
  receipts: StockReceipt[];
  adjustments: StockAdjustment[];

  // Actions (Local Only)
  processSale: (items: CartItem[], total: number, customerId?: string, discountAmount?: number, subtotal?: number, paymentMethod?: any, amountReceived?: number, change?: number, pointsRedeemed?: number, source?: 'pos' | 'back-office') => Promise<Sale>;
  processReturn: (originalSale: Sale, returnItems: { itemIndex: number, quantity: number }[]) => Promise<void>;
  settleSaleDebt: (saleId: string, amount: number, method: string) => Promise<void>;
  handleVoidSale: (id: string) => void;
  
  // Product & Inventory
  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  
  // Units & Categories
  addUnit: (u: UnitDefinition) => void;
  updateUnit: (u: UnitDefinition) => void;
  deleteUnit: (id: string) => void;
  addCategory: (c: CategoryItem) => void;
  updateCategory: (c: CategoryItem) => void;
  deleteCategory: (id: string) => void;

  // Customers & Levels
  addCustomer: (c: Customer) => void;
  updateCustomer: (c: Customer) => void;
  deleteCustomer: (id: string) => void;
  addCustomerLevel: (l: CustomerLevel) => void;
  updateCustomerLevel: (l: CustomerLevel) => void;
  deleteCustomerLevel: (id: string) => void;

  // Stock Management
  updateTransfer: (t: StockTransfer) => void;
  deleteTransfer: (id: string) => void;
  updateCount: (c: StockCount) => void;
  deleteCount: (id: string) => void;
  updateReservation: (r: StockReservation) => void;
  deleteReservation: (id: string) => void;
  updateReceipt: (r: StockReceipt) => void;
  deleteReceipt: (id: string) => void;
  updateAdjustment: (a: StockAdjustment) => void;
  deleteAdjustment: (id: string) => void;
  handleStockStatusChange: (type: 'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment', id: string, status: DocumentStatus) => void;

  // Branches & POS
  addBranch: (b: Branch) => void;
  updateBranch: (b: Branch) => void;
  deleteBranch: (id: string) => void;
  addPos: (p: PosMachine) => void;
  updatePos: (p: PosMachine) => void;
  deletePos: (id: string) => void;

  // Warehouses & Locations
  addWarehouse: (w: Warehouse) => void;
  updateWarehouse: (w: Warehouse) => void;
  deleteWarehouse: (id: string) => void;
  addLocation: (l: StorageLocation) => void;
  updateLocation: (l: StorageLocation) => void;
  deleteLocation: (id: string) => void;

  // Users
  addUser: (u: User) => void;
  updateUser: (u: User) => void;
  deleteUser: (id: string) => void;

  // Shifts & Schedules
  startShift: (branchId: string, startCash: number, notes?: string, posId?: string) => void;
  endShift: (shiftId: string, endCash: number, notes?: string) => void;
  addShiftSchedule: (s: ShiftSchedule) => void;
  updateShiftSchedule: (s: ShiftSchedule) => void;
  deleteShiftSchedule: (id: string) => void;
  addCashTransaction: (type: 'in' | 'out', amount: number, reason: string) => void;

  // Promotions
  addPromotion: (p: Promotion) => void;
  updatePromotion: (p: Promotion) => void;
  deletePromotion: (id: string) => void;

  // System
  updateSettings: (s: SystemSettings) => void;
  handleSyncOperation: (type: 'Auto' | 'Manual' | 'Push' | 'Pull') => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  refreshData: () => Promise<void>;
  restoreSystemData: (data: any) => void;
  
  // Helpers
  t: (key: string) => string;
  formatPrice: (amount: number) => string;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemStore = useSystemStore();
  const inventoryStore = useInventoryStore();
  const salesStore = useSalesStore();
  const stockStore = useStockStore();

  // Helper for Translation
  const t = (key: string): string => {
    const lang = systemStore.settings.language || 'en';
    const keys = key.split('.');
    let value: any = (translations as any)[lang];
    for (const k of keys) { value = value?.[k]; }
    return value || key;
  };

  // Helper for Pricing
  const formatPrice = (amount: number) => {
    const symbol = systemStore.settings.currencySymbol;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: symbol === '₭' ? 'LAK' : symbol === '฿' ? 'THB' : 'USD',
      minimumFractionDigits: symbol === '₭' ? 0 : 2,
    }).format(amount).replace('LAK', '₭').replace('THB', '฿');
  };

  // Local Data Refresh (Pure state, no API)
  const refreshData = async () => {
    console.debug("[Local Mode] Data refresh requested");
  };

  // Process Sale Locally
  const processSale = async (
    items: CartItem[], 
    total: number, 
    customerId?: string, 
    discountAmount?: number, 
    subtotal?: number, 
    paymentMethod: any = 'cash', 
    amountReceived?: number, 
    change?: number, 
    pointsRedeemed?: number
  ): Promise<Sale> => {
    const saleId = `S-${Date.now()}`;
    const customer = salesStore.customers.find(c => c.id === customerId);
    
    const newSale: Sale = {
      id: saleId,
      items,
      total,
      subtotal: subtotal || total,
      discountAmount: discountAmount || 0,
      date: new Date().toISOString(),
      paymentMethod,
      paymentStatus: paymentMethod === 'credit' ? 'unpaid' : 'paid',
      amountReceived,
      change,
      remainingAmount: paymentMethod === 'credit' ? total : 0,
      status: 'completed',
      syncStatus: 'synced',
      customerId,
      customerName: customer?.name,
      userId: systemStore.currentUser?.id,
      userName: systemStore.currentUser?.name
    };

    // 1. Add to sales history
    salesStore.addSale(newSale);

    // 2. Update Inventory (Deduct stock)
    items.forEach(item => {
       inventoryStore.updateProductStock(item.id, -item.quantity, 'wh1');
    });

    // 3. Update Customer Points
    if (customerId && systemStore.settings.loyaltyProgram.enabled) {
       const earned = Math.floor(total / systemStore.settings.loyaltyProgram.earnRate);
       const updatedCustomer = { ...customer!, loyaltyPoints: (customer?.loyaltyPoints || 0) + earned - (pointsRedeemed || 0) };
       salesStore.updateCustomer(updatedCustomer as Customer);
    }

    return newSale;
  };

  // Process Debt Settle
  const settleSaleDebt = async (saleId: string, amount: number, method: string) => {
    const sale = salesStore.sales.find(s => s.id === saleId);
    if (!sale) return;

    const newAmountReceived = (sale.amountReceived || 0) + amount;
    const newRemaining = Math.max(0, (sale.remainingAmount || sale.total) - amount);
    
    salesStore.updateSale({
      ...sale,
      amountReceived: newAmountReceived,
      remainingAmount: newRemaining,
      paymentStatus: newRemaining <= 0.01 ? 'paid' : 'partial'
    });

    // Log the transaction
    systemStore.logAction({
       id: `aud-${Date.now()}`,
       action: 'CASH_IN',
       userId: systemStore.currentUser?.id || 'sys',
       userName: systemStore.currentUser?.name || 'System',
       details: `Settled debt for Sale ${saleId}: ${amount}`,
       timestamp: new Date().toISOString(),
       severity: 'low',
       resourceId: saleId
    });
  };

  // Process Return/Refund
  const processReturn = async (originalSale: Sale, returnItems: { itemIndex: number, quantity: number }[]) => {
    const returnSaleId = `RET-${Date.now()}`;
    const items: CartItem[] = [];
    let returnTotal = 0;

    returnItems.forEach(ret => {
       const originalItem = originalSale.items[ret.itemIndex];
       const returnQty = ret.quantity;
       const lineTotal = originalItem.sellPrice * returnQty;
       
       returnTotal += lineTotal;
       items.push({ ...originalItem, quantity: returnQty });

       // Restore stock
       inventoryStore.updateProductStock(originalItem.id, returnQty, 'wh1');
    });

    const returnSale: Sale = {
      id: returnSaleId,
      items,
      total: -returnTotal,
      date: new Date().toISOString(),
      paymentMethod: originalSale.paymentMethod,
      paymentStatus: 'paid',
      status: 'completed',
      type: 'return',
      originalSaleId: originalSale.id,
      customerId: originalSale.customerId,
      customerName: originalSale.customerName,
      userId: systemStore.currentUser?.id,
      userName: systemStore.currentUser?.name
    };

    salesStore.addSale(returnSale);
    
    systemStore.logAction({
       id: `aud-${Date.now()}`,
       action: 'SALE_RETURN',
       userId: systemStore.currentUser?.id || 'sys',
       userName: systemStore.currentUser?.name || 'System',
       details: `Processed return for Sale ${originalSale.id}`,
       timestamp: new Date().toISOString(),
       severity: 'medium',
       resourceId: originalSale.id
    });
  };

  const handleVoidSale = (id: string) => {
    const sale = salesStore.sales.find(s => s.id === id);
    if (!sale || sale.status === 'voided') return;

    // 1. Mark as voided
    salesStore.updateSale({ ...sale, status: 'voided' });

    // 2. Return items to stock
    sale.items.forEach(item => {
       inventoryStore.updateProductStock(item.id, item.quantity, 'wh1');
    });

    // 3. Log
    systemStore.logAction({
       id: `aud-${Date.now()}`,
       action: 'SALE_VOID',
       userId: systemStore.currentUser?.id || 'sys',
       userName: systemStore.currentUser?.name || 'System',
       details: `Voided Sale ${id}`,
       timestamp: new Date().toISOString(),
       severity: 'high',
       resourceId: id
    });
  };

  // Stock Actions
  const handleStockStatusChange = (type: string, id: string, status: DocumentStatus) => {
    const docMap: any = {
      transfer: 'transfers',
      count: 'counts',
      reservation: 'reservations',
      receipt: 'receipts',
      adjustment: 'adjustments'
    };
    const listName = docMap[type];
    const list = (stockStore as any)[listName] as any[];
    const doc = list.find(x => x.id === id);
    if (doc) {
      stockStore.updateDocument(listName, { ...doc, status });
      
      // If completed, update actual inventory
      if (status === 'Completed' || status === 'Approved') {
         doc.items.forEach((item: any) => {
            const delta = type === 'adjustment' ? item.quantity : type === 'receipt' ? item.quantity : type === 'count' ? (item.countedQuantity - (item.systemQuantity || 0)) : 0;
            if (type === 'transfer') {
               inventoryStore.updateProductStock(item.productId, -item.quantity, doc.sourceWarehouseId);
               inventoryStore.updateProductStock(item.productId, item.quantity, doc.targetWarehouseId);
            } else if (delta !== 0) {
               inventoryStore.updateProductStock(item.productId, delta, doc.warehouseId);
            }
         });
      }
    }
  };

  // Shift Actions
  const startShift = (branchId: string, startCash: number, notes?: string, posId?: string) => {
    const newShift: Shift = {
      id: `SHT-${Date.now()}`,
      userId: systemStore.currentUser?.id || 'anon',
      branchId,
      posId,
      startTime: new Date().toISOString(),
      startCash,
      status: 'Open',
      userName: systemStore.currentUser?.name,
      cashTransactions: []
    };
    salesStore.addShift(newShift);
  };

  const endShift = (shiftId: string, endCash: number, notes?: string) => {
    const shift = salesStore.shifts.find(s => s.id === shiftId);
    if (shift) {
      salesStore.updateShift({
        ...shift,
        endCash,
        notes: notes || shift.notes,
        endTime: new Date().toISOString(),
        status: 'Closed'
      });
    }
  };

  const addCashTransaction = (type: 'in' | 'out', amount: number, reason: string) => {
     const activeShift = salesStore.shifts.find(s => s.userId === systemStore.currentUser?.id && s.status === 'Open');
     if (activeShift) {
        const txn: CashTransaction = {
           id: `TXN-${Date.now()}`,
           shiftId: activeShift.id,
           userId: activeShift.userId,
           type,
           amount,
           reason,
           timestamp: new Date().toISOString()
        };
        salesStore.addCashTransaction(activeShift.id, txn);
     }
  };

  const handleSyncOperation = (type: 'Auto' | 'Manual' | 'Push' | 'Pull') => {
     const log: SyncLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type,
        status: 'Success',
        details: 'Local synchronization simulation completed.',
        durationMs: Math.floor(Math.random() * 500) + 100
     };
     systemStore.addSyncLog(log);
  };

  return (
    <GlobalContext.Provider value={{
      currentUser: systemStore.currentUser,
      setCurrentUser: systemStore.setCurrentUser,
      users: systemStore.users,
      settings: systemStore.settings,
      products: inventoryStore.products,
      sales: salesStore.sales,
      customers: salesStore.customers,
      customerLevels: salesStore.customerLevels,
      units: inventoryStore.units,
      categories: inventoryStore.categories,
      branches: systemStore.branches,
      posMachines: systemStore.posMachines,
      warehouses: stockStore.warehouses,
      locations: stockStore.locations,
      shifts: salesStore.shifts,
      shiftSchedules: salesStore.shiftSchedules,
      promotions: salesStore.promotions,
      notifications: systemStore.notifications,
      syncLogs: systemStore.syncLogs,
      auditLogs: systemStore.auditLogs || [],
      
      // Stock State
      transfers: stockStore.transfers,
      counts: stockStore.counts,
      reservations: stockStore.reservations,
      receipts: stockStore.receipts,
      adjustments: stockStore.adjustments,

      processSale,
      processReturn,
      settleSaleDebt,
      handleVoidSale,
      
      addProduct: inventoryStore.addProduct,
      updateProduct: inventoryStore.updateProduct,
      deleteProduct: inventoryStore.deleteProduct,
      
      addUnit: inventoryStore.addUnit,
      updateUnit: inventoryStore.updateUnit,
      deleteUnit: inventoryStore.deleteUnit,
      addCategory: inventoryStore.addCategory,
      updateCategory: inventoryStore.updateCategory,
      deleteCategory: inventoryStore.deleteCategory,

      addCustomer: salesStore.addCustomer,
      updateCustomer: salesStore.updateCustomer,
      deleteCustomer: (id) => {}, 
      addCustomerLevel: salesStore.addCustomerLevel,
      updateCustomerLevel: salesStore.updateCustomerLevel,
      deleteCustomerLevel: salesStore.deleteCustomerLevel,

      updateTransfer: (t) => stockStore.updateDocument('transfers', t),
      deleteTransfer: (id) => stockStore.deleteDocument('transfers', id),
      updateCount: (c) => stockStore.updateDocument('counts', c),
      deleteCount: (id) => stockStore.deleteDocument('counts', id),
      updateReservation: (r) => stockStore.updateDocument('reservations', r),
      deleteReservation: (id) => stockStore.deleteDocument('reservations', id),
      updateReceipt: (r) => stockStore.updateDocument('receipts', r),
      deleteReceipt: (id) => stockStore.deleteDocument('receipts', id),
      updateAdjustment: (a) => stockStore.updateDocument('adjustments', a),
      deleteAdjustment: (id) => stockStore.deleteDocument('adjustments', id),
      handleStockStatusChange,

      addBranch: systemStore.addBranch,
      updateBranch: systemStore.updateBranch,
      deleteBranch: systemStore.deleteBranch,
      addPos: systemStore.addPos,
      updatePos: systemStore.updatePos,
      deletePos: systemStore.deletePos,

      addWarehouse: stockStore.addWarehouse,
      updateWarehouse: stockStore.updateWarehouse,
      deleteWarehouse: stockStore.deleteWarehouse,
      addLocation: stockStore.addLocation,
      updateLocation: stockStore.updateLocation,
      deleteLocation: stockStore.deleteLocation,

      addUser: systemStore.addUser,
      updateUser: systemStore.updateUser,
      deleteUser: systemStore.deleteUser,

      startShift,
      endShift,
      addShiftSchedule: salesStore.addShiftSchedule,
      updateShiftSchedule: salesStore.updateShiftSchedule,
      deleteShiftSchedule: salesStore.deleteShiftSchedule,
      addCashTransaction,

      addPromotion: salesStore.addPromotion,
      updatePromotion: salesStore.updatePromotion,
      deletePromotion: salesStore.deletePromotion,

      updateSettings: systemStore.updateSettings,
      handleSyncOperation,
      markNotificationRead: systemStore.markNotificationRead,
      clearAllNotifications: systemStore.clearAllNotifications,
      refreshData,
      restoreSystemData: systemStore.restoreSystemData,
      t,
      formatPrice
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('useGlobal must be used within a GlobalProvider');
  return context;
};
