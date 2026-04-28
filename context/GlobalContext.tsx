import React, { createContext, useContext, ReactNode } from 'react';
import { 
  User, SystemSettings, Branch, PosMachine, AuditLog, SyncLog, AppNotification, Department, SystemRole,
  Product, UnitDefinition, CategoryItem, VariantAttribute,
  Sale, Customer, CustomerLevel, Shift, ShiftSchedule, Promotion, CashTransaction, Quotation,
  Warehouse, StorageLocation, StockTransfer, StockCount, StockReservation, StockReceipt, StockAdjustment,
  CartItem, DocumentStatus, Expense, ExpenseCategory
} from '../types';
import { useSystemStore } from '../store/useSystemStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useSalesStore } from '../store/useSalesStore';
import { useStockStore } from '../store/useStockStore';
import { useExpenseStore } from '../store/useExpenseStore';
import { translations } from '../services/translations';

interface GlobalContextType {
  // System Store
  currentUser: User | null;
  users: User[];
  departments: Department[];
  systemRoles: SystemRole[];
  settings: SystemSettings;
  branches: Branch[];
  posMachines: PosMachine[];
  auditLogs: AuditLog[];
  syncLogs: SyncLog[];
  notifications: AppNotification[];
  setCurrentUser: (user: User | null) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  addDepartment: (dept: Department) => void;
  updateDepartment: (dept: Department) => void;
  deleteDepartment: (id: string) => void;
  addSystemRole: (role: SystemRole) => void;
  updateSystemRole: (role: SystemRole) => void;
  deleteSystemRole: (id: string) => void;
  updateSettings: (settings: SystemSettings) => void;
  addBranch: (branch: Branch) => void;
  updateBranch: (branch: Branch) => void;
  deleteBranch: (id: string) => void;
  addPos: (pos: PosMachine) => void;
  updatePos: (pos: PosMachine) => void;
  deletePos: (id: string) => void;
  logAction: (log: AuditLog) => void;
  addSyncLog: (log: SyncLog) => void;
  addNotification: (n: AppNotification) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  restoreSystemData: (data: any) => void;

  // Inventory Store
  products: Product[];
  units: UnitDefinition[];
  categories: CategoryItem[];
  attributes: VariantAttribute[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  updateProductStock: (productId: string, quantityDelta: number) => void;
  addUnit: (unit: UnitDefinition) => void;
  updateUnit: (unit: UnitDefinition) => void;
  deleteUnit: (id: string) => void;
  addCategory: (category: CategoryItem) => void;
  updateCategory: (category: CategoryItem) => void;
  deleteCategory: (id: string) => void;
  addAttribute: (attribute: VariantAttribute) => void;
  updateAttribute: (attribute: VariantAttribute) => void;
  deleteAttribute: (id: string) => void;
  restoreInventoryData: (data: any) => void;

  // Sales Store
  sales: Sale[];
  quotations: Quotation[];
  customers: Customer[];
  customerLevels: CustomerLevel[];
  shifts: Shift[];
  shiftSchedules: ShiftSchedule[];
  promotions: Promotion[];
  addSale: (sale: Sale) => void;
  updateSale: (sale: Sale) => void;
  addQuotation: (quotation: Quotation) => void;
  updateQuotation: (quotation: Quotation) => void;
  deleteQuotation: (id: string) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  addCustomerLevel: (level: CustomerLevel) => void;
  updateCustomerLevel: (level: CustomerLevel) => void;
  deleteCustomerLevel: (id: string) => void;
  startShift: (branchId: string, startCash: number, notes?: string, posId?: string) => void;
  endShift: (shiftId: string, endCash: number, notes?: string) => void;
  addCashTransaction: (type: 'in' | 'out', amount: number, reason: string) => void;
  addShiftSchedule: (schedule: ShiftSchedule) => void;
  updateShiftSchedule: (schedule: ShiftSchedule) => void;
  deleteShiftSchedule: (id: string) => void;
  addPromotion: (promo: Promotion) => void;
  updatePromotion: (promo: Promotion) => void;
  deletePromotion: (id: string) => void;
  restoreSalesData: (data: any) => void;

  // Stock Store
  warehouses: Warehouse[];
  locations: StorageLocation[];
  transfers: StockTransfer[];
  counts: StockCount[];
  reservations: StockReservation[];
  receipts: StockReceipt[];
  adjustments: StockAdjustment[];
  addWarehouse: (w: Warehouse) => void;
  updateWarehouse: (w: Warehouse) => void;
  deleteWarehouse: (id: string) => void;
  addLocation: (l: StorageLocation) => void;
  updateLocation: (l: StorageLocation) => void;
  deleteLocation: (id: string) => void;
  updateDocument: (type: 'transfers' | 'counts' | 'reservations' | 'receipts' | 'adjustments', doc: any) => void;
  deleteDocument: (type: 'transfers' | 'counts' | 'reservations' | 'receipts' | 'adjustments', id: string) => void;
  restoreStockData: (data: any) => void;

  // Wrapper Actions (For backward compatibility with component props)
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

  // Complex / Composite Actions
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
    source?: 'pos' | 'back-office',
    roundingDifference?: number
  ) => Promise<Sale>;
  
  handleVoidSale: (saleId: string) => void;
  settleSaleDebt: (saleId: string, amount: number, method: string) => Promise<void>;
  processReturn: (sale: Sale, items: { itemIndex: number, quantity: number }[]) => Promise<void>;
  
  handleStockStatusChange: (type: 'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment', id: string, status: DocumentStatus) => void;
  handleSyncOperation: (type: 'Auto' | 'Manual' | 'Push' | 'Pull', targetBranchIds?: string[]) => void;
  restoreSystemDataFull: (data: any) => void;
  
  // Helpers
  t: (key: string, defaultValue?: string) => string;
  formatPrice: (amount: number) => string;

  // Expenses
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  addExpense: (e: Expense) => void;
  updateExpense: (e: Expense) => void;
  deleteExpense: (id: string) => void;
  addExpenseCategory: (c: ExpenseCategory) => void;
  deleteExpenseCategory: (id: string) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemStore = useSystemStore();
  const inventoryStore = useInventoryStore();
  const salesStore = useSalesStore();
  const stockStore = useStockStore();
  const expenseStore = useExpenseStore();

  // Helper: Translation
  const t = (key: string, defaultValue?: string): string => {
    const lang = systemStore.settings.language || 'en';
    const keys = key.split('.');
    
    let value: any = translations[lang as keyof typeof translations];
    for (const k of keys) {
      if (value) value = value[k];
    }
    if (value) return value;
    
    if (lang !== 'en') {
      let enValue: any = translations['en'];
      for (const k of keys) {
        if (enValue) enValue = enValue[k];
      }
      if (enValue) return enValue;
    }
    
    return defaultValue || key;
  };

  // Helper: Format Price
  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: systemStore.settings.currencySymbol === '₭' ? 'LAK' : systemStore.settings.currencySymbol === '฿' ? 'THB' : 'USD',
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // --- Wrapper Functions for Stock Actions ---
  const updateTransfer = (t: StockTransfer) => stockStore.updateDocument('transfers', t);
  const deleteTransfer = (id: string) => stockStore.deleteDocument('transfers', id);
  const updateCount = (c: StockCount) => stockStore.updateDocument('counts', c);
  const deleteCount = (id: string) => stockStore.deleteDocument('counts', id);
  const updateReservation = (r: StockReservation) => stockStore.updateDocument('reservations', r);
  const deleteReservation = (id: string) => stockStore.deleteDocument('reservations', id);
  const updateReceipt = (r: StockReceipt) => stockStore.updateDocument('receipts', r);
  const deleteReceipt = (id: string) => stockStore.deleteDocument('receipts', id);
  const updateAdjustment = (a: StockAdjustment) => stockStore.updateDocument('adjustments', a);
  const deleteAdjustment = (id: string) => stockStore.deleteDocument('adjustments', id);

  // --- Wrapper Functions for Shift Actions ---
  const startShiftAction = (branchId: string, startCash: number, notes?: string, posId?: string) => {
    const newShift: Shift = {
      id: `sh-${Date.now()}`,
      userId: systemStore.currentUser?.id || '',
      userName: systemStore.currentUser?.name,
      branchId,
      posId,
      startTime: new Date().toISOString(),
      startCash,
      notes,
      status: 'Open'
    };
    salesStore.startShift(newShift);
  };

  const endShiftAction = (shiftId: string, endCash: number, notes?: string) => {
    salesStore.endShift(shiftId, {
      endTime: new Date().toISOString(),
      endCash,
      notes,
      status: 'Closed'
    });
  };

  const addCashTransactionAction = (type: 'in' | 'out', amount: number, reason: string) => {
    // Find active shift for current user
    const activeShift = salesStore.shifts.find(s => s.userId === systemStore.currentUser?.id && s.status === 'Open');
    if (!activeShift) return;

    const transaction: CashTransaction = {
      id: `txn-${Date.now()}`,
      shiftId: activeShift.id,
      userId: systemStore.currentUser?.id || '',
      type,
      amount,
      reason,
      timestamp: new Date().toISOString()
    };
    
    salesStore.addCashTransaction(transaction);
  };

  // --- Complex Logic Actions ---

  // Process Sale
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
    source: 'pos' | 'back-office' = 'pos',
    roundingDifference: number = 0
  ): Promise<Sale> => {
    
    // Client-side Inventory Check for Back Office Sales
    if (source === 'back-office') {
      for (const item of items) {
        const product = inventoryStore.products.find(p => p.id === item.id);
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
      roundingDifference: roundingDifference, 
      taxAmount: 0,
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
      inventoryStore.updateProductStock(item.id, -item.quantity);
    });

    // Update Customer Loyalty/Stats if applicable
    if (customerId) {
       const customer = salesStore.customers.find(c => c.id === customerId);
       if (customer) {
          // Add points
          const earnRate = systemStore.settings.loyaltyProgram?.earnRate || 10000;
          const pointsEarned = Math.floor(total / earnRate);
          const currentPoints = customer.loyaltyPoints || 0;
          const newPoints = currentPoints - (pointsRedeemed || 0) + pointsEarned;
          
          salesStore.updateCustomer({
             ...customer,
             loyaltyPoints: newPoints
          });
       }
    }

    return newSale;
  };

  // Void Sale
  const handleVoidSale = (saleId: string) => {
    const sale = salesStore.sales.find(s => s.id === saleId);
    if (!sale) return;
    if (sale.status === 'voided') return;

    // Update Status
    salesStore.updateSale({ ...sale, status: 'voided' });

    // Return Stock
    sale.items.forEach(item => {
      inventoryStore.updateProductStock(item.id, item.quantity);
    });

    // Log
    systemStore.logAction({
      id: `audit-${Date.now()}`,
      action: 'SALE_VOID',
      userId: systemStore.currentUser?.id || 'system',
      userName: systemStore.currentUser?.name || 'System',
      details: `Voided Sale #${saleId}`,
      timestamp: new Date().toISOString(),
      severity: 'high',
      resourceId: saleId
    });
  };

  // Settle Debt
  const settleSaleDebt = async (saleId: string, amount: number, method: string) => {
    const sale = salesStore.sales.find(s => s.id === saleId);
    if (!sale) return;

    const newReceived = (sale.amountReceived || 0) + amount;
    const newRemaining = Math.max(0, (sale.remainingAmount || sale.total) - amount);
    
    salesStore.updateSale({
      ...sale,
      amountReceived: newReceived,
      remainingAmount: newRemaining,
      paymentStatus: newRemaining <= 0.01 ? 'paid' : 'partial' // Tolerance for float
    });
  };

  // Process Return
  const processReturn = async (sale: Sale, itemsToReturn: { itemIndex: number, quantity: number }[]) => {
     let refundTotal = 0;
     
     // Calculate refund total
     itemsToReturn.forEach(({ itemIndex, quantity }) => {
        const item = sale.items[itemIndex];
        if (item) {
           refundTotal += item.sellPrice * quantity;
           // Restore Stock
           inventoryStore.updateProductStock(item.id, quantity);
        }
     });

     // Create a Return Sale Record (Negative Sale)
     const returnSale: Sale = {
        id: `RET-${Date.now()}`,
        items: itemsToReturn.map(({itemIndex, quantity}) => ({
           ...sale.items[itemIndex],
           quantity: quantity
        })),
        total: -refundTotal,
        date: new Date().toISOString(),
        paymentMethod: 'cash', 
        paymentStatus: 'paid',
        status: 'completed',
        type: 'return',
        originalSaleId: sale.id,
        customerId: sale.customerId,
        customerName: sale.customerName,
        userId: systemStore.currentUser?.id,
        userName: systemStore.currentUser?.name,
     };
     
     salesStore.addSale(returnSale);
     
     // Log
     systemStore.logAction({
       id: `audit-${Date.now()}`,
       action: 'SALE_RETURN',
       userId: systemStore.currentUser?.id || 'system',
       userName: systemStore.currentUser?.name || 'System',
       details: `Processed return for Sale #${sale.id}. Refund: ${formatPrice(refundTotal)}`,
       timestamp: new Date().toISOString(),
       severity: 'medium',
       resourceId: sale.id
     });
  };

  // Stock Status Change
  const handleStockStatusChange = (
    type: 'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment', 
    id: string, 
    status: DocumentStatus
  ) => {
    // 1. Update Document Status
    const docStoreKey = type === 'transfer' ? 'transfers' : 
                        type === 'count' ? 'counts' :
                        type === 'reservation' ? 'reservations' :
                        type === 'receipt' ? 'receipts' : 'adjustments';
    
    const list = stockStore[docStoreKey] as any[];
    const doc = list.find(d => d.id === id);
    if (!doc) return;

    const updatedDoc = { ...doc, status };
    
    // Update the store
    stockStore.updateDocument(docStoreKey, updatedDoc);

    // 2. Execute Inventory Changes if Approved/Completed
    if (status === 'Completed' || status === 'Approved') {
        if (type === 'transfer') {
           updatedDoc.items.forEach((item: any) => {
              inventoryStore.updateProductStock(item.productId, -item.quantity); 
              // Note: Target warehouse logic simplified for client-side demo
           });
        } 
        else if (type === 'receipt') {
           updatedDoc.items.forEach((item: any) => {
              inventoryStore.updateProductStock(item.productId, item.quantity);
           });
        }
        else if (type === 'adjustment') {
           updatedDoc.items.forEach((item: any) => {
              inventoryStore.updateProductStock(item.productId, item.quantity);
           });
        }
        else if (type === 'count') {
           updatedDoc.items.forEach((item: any) => {
              if (item.diff) {
                 inventoryStore.updateProductStock(item.productId, item.diff);
              }
           });
        }
    }

    // Log
    systemStore.logAction({
       id: `audit-${Date.now()}`,
       action: status === 'Approved' ? 'STOCK_APPROVE' : 'STOCK_REJECT',
       userId: systemStore.currentUser?.id || 'system',
       userName: systemStore.currentUser?.name || 'System',
       details: `${type} #${updatedDoc.referenceNo} marked as ${status}`,
       timestamp: new Date().toISOString(),
       severity: 'low',
       resourceId: id
    });
  };

  // Sync Operation
  const handleSyncOperation = (type: 'Auto' | 'Manual' | 'Push' | 'Pull', targetBranchIds?: string[]) => {
     console.log(`Syncing (${type})...`, targetBranchIds);
     setTimeout(() => {
        systemStore.addSyncLog({
           id: `sync-${Date.now()}`,
           timestamp: new Date().toISOString(),
           type,
           status: 'Success',
           details: `Synced successfully with ${targetBranchIds?.length || 1} endpoints.`,
           durationMs: Math.floor(Math.random() * 1000) + 200
        });
     }, 1000);
  };

  // Restore All Data
  const restoreSystemDataFull = (data: any) => {
     if (data.settings) systemStore.restoreSystemData(data);
     if (data.products) inventoryStore.restoreInventoryData(data);
     if (data.sales) salesStore.restoreSalesData(data);
     if (data.warehouses) stockStore.restoreStockData(data);
  };

  const value: GlobalContextType = {
    // System
    currentUser: systemStore.currentUser,
    users: systemStore.users,
    departments: systemStore.departments,
    systemRoles: systemStore.systemRoles,
    settings: systemStore.settings,
    branches: systemStore.branches,
    posMachines: systemStore.posMachines,
    auditLogs: systemStore.auditLogs,
    syncLogs: systemStore.syncLogs,
    notifications: systemStore.notifications,
    setCurrentUser: systemStore.setCurrentUser,
    addUser: systemStore.addUser,
    updateUser: systemStore.updateUser,
    deleteUser: systemStore.deleteUser,
    addDepartment: systemStore.addDepartment,
    updateDepartment: systemStore.updateDepartment,
    deleteDepartment: systemStore.deleteDepartment,
    addSystemRole: systemStore.addSystemRole,
    updateSystemRole: systemStore.updateSystemRole,
    deleteSystemRole: systemStore.deleteSystemRole,
    updateSettings: systemStore.updateSettings,
    addBranch: systemStore.addBranch,
    updateBranch: systemStore.updateBranch,
    deleteBranch: systemStore.deleteBranch,
    addPos: systemStore.addPos,
    updatePos: systemStore.updatePos,
    deletePos: systemStore.deletePos,
    logAction: systemStore.logAction,
    addSyncLog: systemStore.addSyncLog,
    addNotification: systemStore.addNotification,
    markNotificationRead: systemStore.markNotificationRead,
    clearAllNotifications: systemStore.clearAllNotifications,
    restoreSystemData: systemStore.restoreSystemData,

    // Inventory
    products: inventoryStore.products,
    units: inventoryStore.units,
    categories: inventoryStore.categories,
    attributes: inventoryStore.attributes,
    addProduct: inventoryStore.addProduct,
    updateProduct: inventoryStore.updateProduct,
    deleteProduct: inventoryStore.deleteProduct,
    updateProductStock: inventoryStore.updateProductStock,
    addUnit: inventoryStore.addUnit,
    updateUnit: inventoryStore.updateUnit,
    deleteUnit: inventoryStore.deleteUnit,
    addCategory: inventoryStore.addCategory,
    updateCategory: inventoryStore.updateCategory,
    deleteCategory: inventoryStore.deleteCategory,
    addAttribute: inventoryStore.addAttribute,
    updateAttribute: inventoryStore.updateAttribute,
    deleteAttribute: inventoryStore.deleteAttribute,
    restoreInventoryData: inventoryStore.restoreInventoryData,

    // Sales
    sales: salesStore.sales,
    quotations: salesStore.quotations,
    customers: salesStore.customers,
    customerLevels: salesStore.customerLevels,
    shifts: salesStore.shifts,
    shiftSchedules: salesStore.shiftSchedules,
    promotions: salesStore.promotions,
    addSale: salesStore.addSale,
    updateSale: salesStore.updateSale,
    addQuotation: salesStore.addQuotation,
    updateQuotation: salesStore.updateQuotation,
    deleteQuotation: salesStore.deleteQuotation,
    addCustomer: salesStore.addCustomer,
    updateCustomer: salesStore.updateCustomer,
    deleteCustomer: salesStore.deleteCustomer,
    addCustomerLevel: salesStore.addCustomerLevel,
    updateCustomerLevel: salesStore.updateCustomerLevel,
    deleteCustomerLevel: salesStore.deleteCustomerLevel,
    startShift: startShiftAction,
    endShift: endShiftAction,
    addCashTransaction: addCashTransactionAction,
    addShiftSchedule: salesStore.addShiftSchedule,
    updateShiftSchedule: salesStore.updateShiftSchedule,
    deleteShiftSchedule: salesStore.deleteShiftSchedule,
    addPromotion: salesStore.addPromotion,
    updatePromotion: salesStore.updatePromotion,
    deletePromotion: salesStore.deletePromotion,
    restoreSalesData: salesStore.restoreSalesData,

    // Stock
    warehouses: stockStore.warehouses,
    locations: stockStore.locations,
    transfers: stockStore.transfers,
    counts: stockStore.counts,
    reservations: stockStore.reservations,
    receipts: stockStore.receipts,
    adjustments: stockStore.adjustments,
    addWarehouse: stockStore.addWarehouse,
    updateWarehouse: stockStore.updateWarehouse,
    deleteWarehouse: stockStore.deleteWarehouse,
    addLocation: stockStore.addLocation,
    updateLocation: stockStore.updateLocation,
    deleteLocation: stockStore.deleteLocation,
    updateDocument: stockStore.updateDocument,
    deleteDocument: stockStore.deleteDocument,
    restoreStockData: stockStore.restoreStockData,
    updateTransfer, deleteTransfer, updateCount, deleteCount, updateReservation, deleteReservation,
    updateReceipt, deleteReceipt, updateAdjustment, deleteAdjustment,
    handleStockStatusChange,
    
    // Composite
    processSale,
    handleVoidSale,
    settleSaleDebt,
    processReturn,
    handleSyncOperation,
    restoreSystemDataFull,
    
    // Helpers
    t,
    formatPrice,

    // Expenses
    expenses: expenseStore.expenses,
    expenseCategories: expenseStore.expenseCategories,
    addExpense: expenseStore.addExpense,
    updateExpense: expenseStore.updateExpense,
    deleteExpense: expenseStore.deleteExpense,
    addExpenseCategory: expenseStore.addExpenseCategory,
    deleteExpenseCategory: expenseStore.deleteExpenseCategory
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};