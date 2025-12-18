
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, Product, Sale, UnitDefinition, CategoryItem, Branch, PosMachine, 
  Warehouse, StorageLocation, StockTransfer, StockCount, StockReservation, 
  StockReceipt, StockAdjustment, SyncLog, Customer, CustomerLevel, Shift, 
  ShiftSchedule, Promotion, SystemSettings, AppNotification, CartItem, 
  DocumentStatus, CashTransaction
} from '../types';
import { useSystemStore } from '../store/useSystemStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useSalesStore } from '../store/useSalesStore';
import { useStockStore } from '../store/useStockStore';
import { translations } from '../services/translations';

interface GlobalContextType {
  // System
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  settings: SystemSettings;
  updateSettings: (settings: SystemSettings) => void;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  auditLogs: any[];
  syncLogs: SyncLog[];
  
  // Inventory
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  units: UnitDefinition[];
  addUnit: (unit: UnitDefinition) => void;
  updateUnit: (unit: UnitDefinition) => void;
  deleteUnit: (id: string) => void;
  categories: CategoryItem[];
  addCategory: (category: CategoryItem) => void;
  updateCategory: (category: CategoryItem) => void;
  deleteCategory: (id: string) => void;

  // Sales
  sales: Sale[];
  processSale: (
    items: CartItem[], 
    total: number, 
    customerId?: string, 
    discountAmount?: number, 
    subtotal?: number,
    paymentMethod?: 'cash' | 'card' | 'transfer' | 'qr' | 'credit',
    amountReceived?: number,
    change?: number,
    pointsRedeemed?: number,
    source?: 'pos' | 'back-office'
  ) => Promise<Sale>;
  handleVoidSale: (id: string) => void;
  settleSaleDebt: (id: string, amount: number, method: string) => Promise<void>;
  processReturn: (originalSale: Sale, itemsToReturn: { itemIndex: number, quantity: number }[], refundMethod: string) => Promise<void>;
  customers: Customer[];
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  customerLevels: CustomerLevel[];
  addCustomerLevel: (level: CustomerLevel) => void;
  updateCustomerLevel: (level: CustomerLevel) => void;
  deleteCustomerLevel: (id: string) => void;
  promotions: Promotion[];
  addPromotion: (promo: Promotion) => void;
  updatePromotion: (promo: Promotion) => void;
  deletePromotion: (id: string) => void;

  // Shifts
  shifts: Shift[];
  startShift: (branchId: string, startCash: number, notes?: string, posId?: string) => void;
  endShift: (shiftId: string, endCash: number, notes?: string) => void;
  addCashTransaction: (type: 'in' | 'out', amount: number, reason: string) => void;
  shiftSchedules: ShiftSchedule[];
  addShiftSchedule: (schedule: ShiftSchedule) => void;
  updateShiftSchedule: (schedule: ShiftSchedule) => void;
  deleteShiftSchedule: (id: string) => void;

  // Locations & Stock
  branches: Branch[];
  addBranch: (branch: Branch) => void;
  updateBranch: (branch: Branch) => void;
  deleteBranch: (id: string) => void;
  posMachines: PosMachine[];
  addPos: (pos: PosMachine) => void;
  updatePos: (pos: PosMachine) => void;
  deletePos: (id: string) => void;
  warehouses: Warehouse[];
  addWarehouse: (w: Warehouse) => void;
  updateWarehouse: (w: Warehouse) => void;
  deleteWarehouse: (id: string) => void;
  locations: StorageLocation[];
  addLocation: (l: StorageLocation) => void;
  updateLocation: (l: StorageLocation) => void;
  deleteLocation: (id: string) => void;
  
  transfers: StockTransfer[];
  updateTransfer: (t: StockTransfer) => void;
  deleteTransfer: (id: string) => void;
  counts: StockCount[];
  updateCount: (c: StockCount) => void;
  deleteCount: (id: string) => void;
  reservations: StockReservation[];
  updateReservation: (r: StockReservation) => void;
  deleteReservation: (id: string) => void;
  receipts: StockReceipt[];
  updateReceipt: (r: StockReceipt) => void;
  deleteReceipt: (id: string) => void;
  adjustments: StockAdjustment[];
  updateAdjustment: (a: StockAdjustment) => void;
  deleteAdjustment: (id: string) => void;
  
  handleStockStatusChange: (type: 'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment', id: string, status: DocumentStatus) => void;
  handleSyncOperation: (type: 'Auto' | 'Manual' | 'Push' | 'Pull') => void;
  restoreSystemData: (data: any) => void;

  // Utilities
  t: (key: string) => string;
  formatPrice: (amount: number) => string;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemStore = useSystemStore();
  const inventoryStore = useInventoryStore();
  const salesStore = useSalesStore();
  const stockStore = useStockStore();

  // Translation helper
  const t = (key: string): string => {
    const lang = systemStore.settings.language || 'en';
    const keys = key.split('.');
    let value: any = (translations as any)[lang];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const formatPrice = (amount: number) => {
    const lang = systemStore.settings.language;
    let locale = 'en-US';
    if (lang === 'th') locale = 'th-TH';
    else if (lang === 'lo') locale = 'lo-LA';

    let currencyCode = 'USD';
    if (systemStore.settings.currencySymbol === '฿') currencyCode = 'THB';
    else if (systemStore.settings.currencySymbol === '₭') currencyCode = 'LAK';
    else if (systemStore.settings.currencySymbol === '$') currencyCode = 'USD';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'symbol',
      minimumFractionDigits: currencyCode === 'LAK' ? 0 : 2,
      maximumFractionDigits: currencyCode === 'LAK' ? 0 : 2,
    }).format(amount);
  };

  // Complex Actions
  const processSale = async (
    items: CartItem[], 
    total: number, 
    customerId?: string, 
    discountAmount?: number, 
    subtotal?: number,
    paymentMethod: 'cash' | 'card' | 'transfer' | 'qr' | 'credit' = 'cash',
    amountReceived?: number,
    change?: number,
    pointsRedeemed?: number,
    source: 'pos' | 'back-office' = 'pos'
  ): Promise<Sale> => {
    
    // Client-side Inventory Check for Back Office Sales
    if (source === 'back-office') {
      for (const item of items) {
        const product = inventoryStore.products.find(p => p.id === item.id);
        // Simple stock check. 
        if (!product || product.stock < item.quantity) {
          throw new Error(`Insufficient stock for "${item.name}". Back-office sales cannot result in negative inventory.`);
        }
      }
    }

    // Create Sale Object
    const newSale: Sale = {
      id: `S-${Date.now()}`,
      items: items,
      total: total,
      subtotal: subtotal || total,
      discountAmount: discountAmount || 0,
      date: new Date().toISOString(),
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'credit' ? 'unpaid' : 'paid',
      remainingAmount: paymentMethod === 'credit' ? total - (amountReceived || 0) : 0,
      amountReceived: amountReceived,
      change: change,
      status: 'completed',
      syncStatus: 'pending',
      customerId: customerId,
      customerName: customerId ? salesStore.customers.find(c => c.id === customerId)?.name : undefined,
      userId: systemStore.currentUser?.id,
      userName: systemStore.currentUser?.name,
      pointsRedeemed: pointsRedeemed
    };

    salesStore.addSale(newSale);

    // Update Inventory
    items.forEach(item => {
      // Logic for variant deduction could be complex if tracking separately.
      // Assuming variants share base stock in this simplified model or simple deduction
      inventoryStore.updateProductStock(item.id, -item.quantity);
    });

    // Update Customer Loyalty/Stats if applicable
    if (customerId) {
       const customer = salesStore.customers.find(c => c.id === customerId);
       if (customer) {
          // Add points (e.g., 1 point per 10000 Kip based on config)
          const earnRate = systemStore.settings.loyaltyProgram?.earnRate || 10000;
          const pointsEarned = Math.floor(total / earnRate);
          const newPoints = (customer.loyaltyPoints || 0) - (pointsRedeemed || 0) + pointsEarned;
          
          salesStore.updateCustomer({
             ...customer,
             loyaltyPoints: newPoints
          });
       }
    }

    return newSale;
  };

  const handleVoidSale = (id: string) => {
    const sale = salesStore.sales.find(s => s.id === id);
    if (sale && sale.status !== 'voided') {
      salesStore.updateSale({ ...sale, status: 'voided' });
      
      // Restore Inventory
      sale.items.forEach(item => {
        inventoryStore.updateProductStock(item.id, item.quantity);
      });

      // Log Audit
      if (systemStore.currentUser) {
         systemStore.logAction({
            id: `aud-${Date.now()}`,
            action: 'SALE_VOID',
            userId: systemStore.currentUser.id,
            userName: systemStore.currentUser.name,
            details: `Voided Sale #${id}`,
            timestamp: new Date().toISOString(),
            severity: 'high',
            resourceId: id
         });
      }
    }
  };

  const settleSaleDebt = async (id: string, amount: number, method: string) => {
     const sale = salesStore.sales.find(s => s.id === id);
     if (sale) {
        const newPaid = (sale.amountReceived || 0) + amount;
        const newRemaining = Math.max(0, (sale.remainingAmount || sale.total) - amount);
        
        salesStore.updateSale({
           ...sale,
           amountReceived: newPaid,
           remainingAmount: newRemaining,
           paymentStatus: newRemaining <= 0.01 ? 'paid' : 'partial'
        });

        // Add cash transaction if settled via cash (Debt payments ARE Cash In events not tracked by sales creation)
        if (method === 'cash') {
           const shift = salesStore.shifts.find(s => s.userId === systemStore.currentUser?.id && s.status === 'Open');
           if (shift) {
              salesStore.addCashTransaction({
                 id: `ctx-${Date.now()}`,
                 shiftId: shift.id,
                 userId: shift.userId,
                 type: 'in',
                 amount: amount,
                 reason: `Debt Settle #${sale.id.slice(-6)}`,
                 timestamp: new Date().toISOString()
              });
           }
        }
     }
  };

  const processReturn = async (originalSale: Sale, itemsToReturn: { itemIndex: number, quantity: number }[], refundMethod: string) => {
     // Create a return record (negative sale)
     const returnItems: CartItem[] = [];
     let refundTotal = 0;

     itemsToReturn.forEach(({ itemIndex, quantity }) => {
        const originalItem = originalSale.items[itemIndex];
        if (originalItem) {
           returnItems.push({
              ...originalItem,
              quantity: quantity
           });
           refundTotal += originalItem.sellPrice * quantity;
           
           // Restore Stock
           inventoryStore.updateProductStock(originalItem.id, quantity);
        }
     });

     const returnSale: Sale = {
        id: `R-${Date.now()}`,
        type: 'return',
        originalSaleId: originalSale.id,
        items: returnItems,
        total: -refundTotal,
        date: new Date().toISOString(),
        paymentMethod: refundMethod as any,
        paymentStatus: 'paid', // Refunded immediately
        status: 'completed',
        syncStatus: 'pending',
        customerId: originalSale.customerId,
        customerName: originalSale.customerName,
        userId: systemStore.currentUser?.id,
        userName: systemStore.currentUser?.name,
     };

     salesStore.addSale(returnSale);
  };

  const handleStockStatusChange = (type: 'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment', id: string, status: DocumentStatus) => {
    // 1. Update Document Status
    const docList = stockStore[type === 'transfer' ? 'transfers' : type === 'count' ? 'counts' : type === 'reservation' ? 'reservations' : type === 'receipt' ? 'receipts' : 'adjustments'];
    const doc = docList.find((d: any) => d.id === id);
    if (!doc) return;

    stockStore.updateDocument(type === 'transfer' ? 'transfers' : type === 'count' ? 'counts' : type === 'reservation' ? 'reservations' : type === 'receipt' ? 'receipts' : 'adjustments', { ...doc, status });

    // 2. Effectuate Stock Changes if approved/completed
    if (status === 'Completed' || status === 'Approved') {
       if (type === 'transfer') {
          const t = doc as StockTransfer;
       }
       else if (type === 'receipt') {
          const r = doc as StockReceipt;
          r.items.forEach(item => {
             inventoryStore.updateProductStock(item.productId, item.quantity);
          });
       }
       else if (type === 'adjustment') {
          const a = doc as StockAdjustment;
          a.items.forEach(item => {
             inventoryStore.updateProductStock(item.productId, item.quantity); // Quantity can be negative
          });
       }
       else if (type === 'count') {
          const c = doc as StockCount;
          c.items.forEach(item => {
             // For count, we usually replace stock or adjust by diff.
             // item.diff = counted - system. 
             if (item.diff) {
                inventoryStore.updateProductStock(item.productId, item.diff);
             }
          });
       }
    }
  };

  const startShift = (branchId: string, startCash: number, notes?: string, posId?: string) => {
    if (!systemStore.currentUser) return;
    salesStore.startShift({
      id: `sh-${Date.now()}`,
      userId: systemStore.currentUser.id,
      branchId,
      posId,
      startTime: new Date().toISOString(),
      startCash,
      notes,
      status: 'Open',
      cashTransactions: []
    });
  };

  const endShift = (shiftId: string, endCash: number, notes?: string) => {
    salesStore.endShift(shiftId, {
      endTime: new Date().toISOString(),
      endCash,
      notes,
      status: 'Closed'
    });
  };

  const addCashTransaction = (type: 'in' | 'out', amount: number, reason: string) => {
     const shift = salesStore.shifts.find(s => s.userId === systemStore.currentUser?.id && s.status === 'Open');
     if (shift) {
        salesStore.addCashTransaction({
           id: `ctx-${Date.now()}`,
           shiftId: shift.id,
           userId: shift.userId,
           type,
           amount,
           reason,
           timestamp: new Date().toISOString()
        });
     }
  };

  const handleSyncOperation = (type: 'Auto' | 'Manual' | 'Push' | 'Pull') => {
     // Mock Sync Logic
     console.log(`Syncing (${type})...`);
     const start = Date.now();
     
     // Simulate network
     setTimeout(() => {
        const duration = Date.now() - start;
        systemStore.addSyncLog({
           id: `log-${Date.now()}`,
           timestamp: new Date().toISOString(),
           type,
           status: 'Success',
           details: `Synced successfully (${salesStore.sales.length} records checked)`,
           durationMs: duration
        });
        
        // Update sync status on sales
        salesStore.sales.forEach(s => {
           if (s.syncStatus === 'pending') {
              salesStore.updateSale({ ...s, syncStatus: 'synced' });
           }
        });
     }, 1000);
  };

  const restoreSystemData = (data: any) => {
     systemStore.restoreSystemData(data);
     inventoryStore.restoreInventoryData(data);
     salesStore.restoreSalesData(data);
     stockStore.restoreStockData(data);
  };

  return (
    <GlobalContext.Provider value={{
      // System
      currentUser: systemStore.currentUser,
      setCurrentUser: systemStore.setCurrentUser,
      users: systemStore.users,
      addUser: systemStore.addUser,
      updateUser: systemStore.updateUser,
      deleteUser: systemStore.deleteUser,
      settings: systemStore.settings,
      updateSettings: systemStore.updateSettings,
      notifications: systemStore.notifications,
      markNotificationRead: systemStore.markNotificationRead,
      clearAllNotifications: systemStore.clearAllNotifications,
      auditLogs: systemStore.auditLogs,
      syncLogs: systemStore.syncLogs,

      // Inventory
      products: inventoryStore.products,
      addProduct: inventoryStore.addProduct,
      updateProduct: inventoryStore.updateProduct,
      deleteProduct: inventoryStore.deleteProduct,
      units: inventoryStore.units,
      addUnit: inventoryStore.addUnit,
      updateUnit: inventoryStore.updateUnit,
      deleteUnit: inventoryStore.deleteUnit,
      categories: inventoryStore.categories,
      addCategory: inventoryStore.addCategory,
      updateCategory: inventoryStore.updateCategory,
      deleteCategory: inventoryStore.deleteCategory,

      // Sales
      sales: salesStore.sales,
      processSale,
      handleVoidSale,
      settleSaleDebt,
      processReturn,
      customers: salesStore.customers,
      addCustomer: salesStore.addCustomer,
      updateCustomer: salesStore.updateCustomer,
      deleteCustomer: salesStore.deleteCustomer,
      customerLevels: salesStore.customerLevels,
      addCustomerLevel: salesStore.addCustomerLevel,
      updateCustomerLevel: salesStore.updateCustomerLevel,
      deleteCustomerLevel: salesStore.deleteCustomerLevel,
      promotions: salesStore.promotions,
      addPromotion: salesStore.addPromotion,
      updatePromotion: salesStore.updatePromotion,
      deletePromotion: salesStore.deletePromotion,

      // Shifts
      shifts: salesStore.shifts,
      startShift,
      endShift,
      addCashTransaction,
      shiftSchedules: salesStore.shiftSchedules,
      addShiftSchedule: salesStore.addShiftSchedule,
      updateShiftSchedule: salesStore.updateShiftSchedule,
      deleteShiftSchedule: salesStore.deleteShiftSchedule,

      // Locations & Stock
      branches: systemStore.branches,
      addBranch: systemStore.addBranch,
      updateBranch: systemStore.updateBranch,
      deleteBranch: systemStore.deleteBranch,
      posMachines: systemStore.posMachines,
      addPos: systemStore.addPos,
      updatePos: systemStore.updatePos,
      deletePos: systemStore.deletePos,
      warehouses: stockStore.warehouses,
      addWarehouse: stockStore.addWarehouse,
      updateWarehouse: stockStore.updateWarehouse,
      deleteWarehouse: stockStore.deleteWarehouse,
      locations: stockStore.locations,
      addLocation: stockStore.addLocation,
      updateLocation: stockStore.updateLocation,
      deleteLocation: stockStore.deleteLocation,
      
      transfers: stockStore.transfers,
      updateTransfer: (t) => stockStore.updateDocument('transfers', t),
      deleteTransfer: (id) => stockStore.deleteDocument('transfers', id),
      counts: stockStore.counts,
      updateCount: (c) => stockStore.updateDocument('counts', c),
      deleteCount: (id) => stockStore.deleteDocument('counts', id),
      reservations: stockStore.reservations,
      updateReservation: (r) => stockStore.updateDocument('reservations', r),
      deleteReservation: (id) => stockStore.deleteDocument('reservations', id),
      receipts: stockStore.receipts,
      updateReceipt: (r) => stockStore.updateDocument('receipts', r),
      deleteReceipt: (id) => stockStore.deleteDocument('receipts', id),
      adjustments: stockStore.adjustments,
      updateAdjustment: (a) => stockStore.updateDocument('adjustments', a),
      deleteAdjustment: (id) => stockStore.deleteDocument('adjustments', id),
      
      handleStockStatusChange,
      handleSyncOperation,
      restoreSystemData,

      t,
      formatPrice
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};
