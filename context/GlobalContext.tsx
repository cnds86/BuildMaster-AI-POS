import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, Category, Sale, UnitDefinition, CategoryItem, Branch, PosMachine, Warehouse, 
  StorageLocation, StockTransfer, StockCount, StockReservation, StockReceipt, StockAdjustment, 
  User, SystemSettings, SyncLog, Customer, CustomerLevel, Shift, ShiftSchedule, Promotion, 
  CartItem, DocumentStatus 
} from '../types';
import { 
  INITIAL_USERS, INITIAL_CUSTOMER_LEVELS, INITIAL_CUSTOMERS, INITIAL_PROMOTIONS, 
  INITIAL_SETTINGS, INITIAL_UNITS, INITIAL_CATEGORIES_TREE, INITIAL_PRODUCTS, 
  INITIAL_BRANCHES, INITIAL_POS_MACHINES, INITIAL_WAREHOUSES, INITIAL_LOCATIONS, 
  INITIAL_TRANSFERS, INITIAL_COUNTS, INITIAL_RESERVATIONS, INITIAL_RECEIPTS, 
  INITIAL_ADJUSTMENTS, INITIAL_SALES, INITIAL_SYNC_LOGS, INITIAL_SHIFT_SCHEDULES 
} from '../services/data';
import { translations } from '../services/translations';

interface GlobalContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  users: User[];
  products: Product[];
  sales: Sale[];
  units: UnitDefinition[];
  categories: CategoryItem[];
  branches: Branch[];
  posMachines: PosMachine[];
  warehouses: Warehouse[];
  locations: StorageLocation[];
  transfers: StockTransfer[];
  counts: StockCount[];
  reservations: StockReservation[];
  receipts: StockReceipt[];
  adjustments: StockAdjustment[];
  syncLogs: SyncLog[];
  customers: Customer[];
  customerLevels: CustomerLevel[];
  shifts: Shift[];
  shiftSchedules: ShiftSchedule[];
  promotions: Promotion[];
  settings: SystemSettings;
  
  processSale: (items: CartItem[], total: number, customerId?: string, discountAmount?: number, subtotal?: number, paymentMethod?: any, amountReceived?: number, change?: number) => Promise<Sale>;
  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  
  addUnit: (u: UnitDefinition) => void;
  updateUnit: (u: UnitDefinition) => void;
  deleteUnit: (id: string) => void;
  
  addCategory: (c: CategoryItem) => void;
  updateCategory: (c: CategoryItem) => void;
  deleteCategory: (id: string) => void;
  
  addBranch: (b: Branch) => void;
  updateBranch: (b: Branch) => void;
  deleteBranch: (id: string) => void;
  
  addPos: (p: PosMachine) => void;
  updatePos: (p: PosMachine) => void;
  deletePos: (id: string) => void;
  
  addWarehouse: (w: Warehouse) => void;
  updateWarehouse: (w: Warehouse) => void;
  deleteWarehouse: (id: string) => void;
  
  addLocation: (l: StorageLocation) => void;
  updateLocation: (l: StorageLocation) => void;
  deleteLocation: (id: string) => void;
  
  addUser: (u: User) => void;
  updateUser: (u: User) => void;
  deleteUser: (id: string) => void;
  
  addCustomer: (c: Customer) => void;
  updateCustomer: (c: Customer) => void;
  deleteCustomer: (id: string) => void;
  addCustomerLevel: (l: CustomerLevel) => void;
  updateCustomerLevel: (l: CustomerLevel) => void;
  deleteCustomerLevel: (id: string) => void;
  
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
  handleSyncOperation: (type: 'Auto' | 'Manual' | 'Push' | 'Pull') => void;
  
  startShift: (branchId: string, startCash: number, notes?: string) => void;
  endShift: (shiftId: string, endCash: number, notes?: string) => void;
  addShiftSchedule: (s: ShiftSchedule) => void;
  deleteShiftSchedule: (id: string) => void;
  
  addPromotion: (p: Promotion) => void;
  updatePromotion: (p: Promotion) => void;
  deletePromotion: (id: string) => void;
  
  updateSettings: (s: SystemSettings) => void;
  
  settleSaleDebt: (saleId: string, amount: number, method: string) => Promise<void>;
  handleVoidSale: (saleId: string) => void;
  
  t: (key: string) => string;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Data State
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [units, setUnits] = useState<UnitDefinition[]>(INITIAL_UNITS);
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES_TREE);
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [posMachines, setPosMachines] = useState<PosMachine[]>(INITIAL_POS_MACHINES);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES);
  const [locations, setLocations] = useState<StorageLocation[]>(INITIAL_LOCATIONS);
  
  // Stock Docs
  const [transfers, setTransfers] = useState<StockTransfer[]>(INITIAL_TRANSFERS);
  const [counts, setCounts] = useState<StockCount[]>(INITIAL_COUNTS);
  const [reservations, setReservations] = useState<StockReservation[]>(INITIAL_RESERVATIONS);
  const [receipts, setReceipts] = useState<StockReceipt[]>(INITIAL_RECEIPTS);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(INITIAL_ADJUSTMENTS);
  
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(INITIAL_SYNC_LOGS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [customerLevels, setCustomerLevels] = useState<CustomerLevel[]>(INITIAL_CUSTOMER_LEVELS);
  
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftSchedules, setShiftSchedules] = useState<ShiftSchedule[]>(INITIAL_SHIFT_SCHEDULES);
  const [promotions, setPromotions] = useState<Promotion[]>(INITIAL_PROMOTIONS);
  const [settings, setSettingsState] = useState<SystemSettings>(INITIAL_SETTINGS);

  const t = (key: string): string => {
    const keys = key.split('.');
    let current: any = translations[settings.language] || translations['en'];
    
    for (const k of keys) {
      if (current[k] === undefined) return key;
      current = current[k];
    }
    return typeof current === 'string' ? current : key;
  };

  const processSale = async (
    items: CartItem[], 
    total: number, 
    customerId?: string, 
    discountAmount?: number, 
    subtotal?: number, 
    paymentMethod: any = 'cash',
    amountReceived?: number,
    change?: number
  ): Promise<Sale> => {
    const sale: Sale = {
      id: `S-${Date.now()}`,
      items,
      total,
      subtotal,
      discountAmount,
      date: new Date().toISOString(),
      paymentMethod,
      amountReceived,
      change,
      customerId,
      customerName: customerId ? customers.find(c => c.id === customerId)?.name : undefined,
      status: 'completed',
      paymentStatus: paymentMethod === 'credit' ? 'unpaid' : 'paid',
      remainingAmount: paymentMethod === 'credit' ? Math.max(0, total - (amountReceived || 0)) : 0,
      syncStatus: 'pending'
    };

    setSales(prev => [sale, ...prev]);

    // Update Inventory
    setProducts(prevProducts => {
      return prevProducts.map(product => {
        const cartItem = items.find(item => item.id === product.id);
        if (cartItem) {
          // Simplistic deduction from total stock
          // In real app, deduct from specific warehouse based on session context
          return {
            ...product,
            stock: product.stock - cartItem.quantity
          };
        }
        return product;
      });
    });

    // Update Customer Loyalty
    if (customerId) {
       setCustomers(prev => prev.map(c => {
          if (c.id === customerId) {
             const pointsEarned = Math.floor(total / 10); // 1 point per $10
             return { ...c, loyaltyPoints: c.loyaltyPoints + pointsEarned };
          }
          return c;
       }));
    }

    return sale;
  };

  const handleVoidSale = (saleId: string) => {
     setSales(prev => prev.map(s => {
        if (s.id === saleId) {
           return { ...s, status: 'voided' };
        }
        return s;
     }));
     
     // Restore Inventory
     const sale = sales.find(s => s.id === saleId);
     if (sale && sale.status !== 'voided') {
        setProducts(prevProducts => {
           return prevProducts.map(product => {
              const cartItem = sale.items.find(item => item.id === product.id);
              if (cartItem) {
                 return { ...product, stock: product.stock + cartItem.quantity };
              }
              return product;
           });
        });
     }
  };

  const settleSaleDebt = async (saleId: string, amount: number, method: string) => {
     setSales(prev => prev.map(s => {
        if (s.id === saleId) {
           return {
              ...s,
              paymentStatus: 'paid',
              remainingAmount: 0,
              amountReceived: (s.amountReceived || 0) + amount
           };
        }
        return s;
     }));
  };

  // CRUD Helpers
  const addProduct = (p: Product) => setProducts(prev => [...prev, p]);
  const updateProduct = (p: Product) => setProducts(prev => prev.map(item => item.id === p.id ? p : item));
  const deleteProduct = (id: string) => setProducts(prev => prev.filter(item => item.id !== id));

  const addUnit = (u: UnitDefinition) => setUnits(prev => [...prev, u]);
  const updateUnit = (u: UnitDefinition) => setUnits(prev => prev.map(item => item.id === u.id ? u : item));
  const deleteUnit = (id: string) => setUnits(prev => prev.filter(item => item.id !== id));

  const addCategory = (c: CategoryItem) => setCategories(prev => [...prev, c]);
  const updateCategory = (c: CategoryItem) => setCategories(prev => prev.map(item => item.id === c.id ? c : item));
  const deleteCategory = (id: string) => setCategories(prev => prev.filter(item => item.id !== id));

  const addBranch = (b: Branch) => setBranches(prev => [...prev, b]);
  const updateBranch = (b: Branch) => setBranches(prev => prev.map(item => item.id === b.id ? b : item));
  const deleteBranch = (id: string) => setBranches(prev => prev.filter(item => item.id !== id));

  const addPos = (p: PosMachine) => setPosMachines(prev => [...prev, p]);
  const updatePos = (p: PosMachine) => setPosMachines(prev => prev.map(item => item.id === p.id ? p : item));
  const deletePos = (id: string) => setPosMachines(prev => prev.filter(item => item.id !== id));

  const addWarehouse = (w: Warehouse) => setWarehouses(prev => [...prev, w]);
  const updateWarehouse = (w: Warehouse) => setWarehouses(prev => prev.map(item => item.id === w.id ? w : item));
  const deleteWarehouse = (id: string) => setWarehouses(prev => prev.filter(item => item.id !== id));

  const addLocation = (l: StorageLocation) => setLocations(prev => [...prev, l]);
  const updateLocation = (l: StorageLocation) => setLocations(prev => prev.map(item => item.id === l.id ? l : item));
  const deleteLocation = (id: string) => setLocations(prev => prev.filter(item => item.id !== id));

  const addUser = (u: User) => setUsers(prev => [...prev, u]);
  const updateUser = (u: User) => setUsers(prev => prev.map(item => item.id === u.id ? u : item));
  const deleteUser = (id: string) => setUsers(prev => prev.filter(item => item.id !== id));

  const addCustomer = (c: Customer) => setCustomers(prev => [...prev, c]);
  const updateCustomer = (c: Customer) => setCustomers(prev => prev.map(item => item.id === c.id ? c : item));
  const deleteCustomer = (id: string) => setCustomers(prev => prev.filter(item => item.id !== id));
  
  const addCustomerLevel = (l: CustomerLevel) => setCustomerLevels(prev => [...prev, l]);
  const updateCustomerLevel = (l: CustomerLevel) => setCustomerLevels(prev => prev.map(item => item.id === l.id ? l : item));
  const deleteCustomerLevel = (id: string) => setCustomerLevels(prev => prev.filter(item => item.id !== id));

  const updateTransfer = (t: StockTransfer) => {
     const exists = transfers.find(item => item.id === t.id);
     if (exists) setTransfers(prev => prev.map(item => item.id === t.id ? t : item));
     else setTransfers(prev => [t, ...prev]);
  };
  const deleteTransfer = (id: string) => setTransfers(prev => prev.filter(item => item.id !== id));

  const updateCount = (c: StockCount) => {
     const exists = counts.find(item => item.id === c.id);
     if (exists) setCounts(prev => prev.map(item => item.id === c.id ? c : item));
     else setCounts(prev => [c, ...prev]);
  };
  const deleteCount = (id: string) => setCounts(prev => prev.filter(item => item.id !== id));

  const updateReservation = (r: StockReservation) => {
     const exists = reservations.find(item => item.id === r.id);
     if (exists) setReservations(prev => prev.map(item => item.id === r.id ? r : item));
     else setReservations(prev => [r, ...prev]);
  };
  const deleteReservation = (id: string) => setReservations(prev => prev.filter(item => item.id !== id));

  const updateReceipt = (r: StockReceipt) => {
     const exists = receipts.find(item => item.id === r.id);
     if (exists) setReceipts(prev => prev.map(item => item.id === r.id ? r : item));
     else setReceipts(prev => [r, ...prev]);
  };
  const deleteReceipt = (id: string) => setReceipts(prev => prev.filter(item => item.id !== id));

  const updateAdjustment = (a: StockAdjustment) => {
     const exists = adjustments.find(item => item.id === a.id);
     if (exists) setAdjustments(prev => prev.map(item => item.id === a.id ? a : item));
     else setAdjustments(prev => [a, ...prev]);
  };
  const deleteAdjustment = (id: string) => setAdjustments(prev => prev.filter(item => item.id !== id));

  const updateSettings = (s: SystemSettings) => setSettingsState(s);

  // Status Change Logic
  const handleStockStatusChange = (type: 'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment', id: string, status: DocumentStatus) => {
    const updateStateList = (setList: React.Dispatch<React.SetStateAction<any[]>>) => {
      setList(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    };

    switch (type) {
      case 'transfer': updateStateList(setTransfers); break;
      case 'count': updateStateList(setCounts); break;
      case 'reservation': updateStateList(setReservations); break;
      case 'receipt': updateStateList(setReceipts); break;
      case 'adjustment': updateStateList(setAdjustments); break;
    }

    if ((status === 'Completed' || status === 'Approved') && type !== 'reservation') {
       let doc: any = null;
       if (type === 'transfer') doc = transfers.find(t => t.id === id);
       else if (type === 'count') doc = counts.find(c => c.id === id);
       else if (type === 'receipt') doc = receipts.find(r => r.id === id);
       else if (type === 'adjustment') doc = adjustments.find(a => a.id === id);
       
       if (doc) {
        doc.items.forEach((item: any) => {
          setProducts(prev => prev.map(p => {
            if (p.id === item.productId) {
              let change = 0;
              let newWarehouseInventory = p.warehouseInventory ? [...p.warehouseInventory] : [];

              if (type === 'transfer') {
                 // Decrement Source
                 const sourceInvIndex = newWarehouseInventory.findIndex(inv => inv.warehouseId === doc.sourceWarehouseId);
                 if (sourceInvIndex > -1) {
                    newWarehouseInventory[sourceInvIndex] = {
                       ...newWarehouseInventory[sourceInvIndex],
                       quantity: Math.max(0, newWarehouseInventory[sourceInvIndex].quantity - item.quantity)
                    };
                 }
                 
                 // Increment Target
                 const targetInvIndex = newWarehouseInventory.findIndex(inv => inv.warehouseId === doc.targetWarehouseId);
                 if (targetInvIndex > -1) {
                    newWarehouseInventory[targetInvIndex] = {
                       ...newWarehouseInventory[targetInvIndex],
                       quantity: newWarehouseInventory[targetInvIndex].quantity + item.quantity
                    };
                 } else {
                    newWarehouseInventory.push({ warehouseId: doc.targetWarehouseId, quantity: item.quantity });
                 }
                 
                 return { ...p, warehouseInventory: newWarehouseInventory };

              } else if (type === 'count') {
                 if (item.diff !== undefined) {
                    change = item.diff; 
                 } else if (item.countedQuantity !== undefined) {
                    return { ...p, stock: item.countedQuantity };
                 }
              } else if (type === 'receipt') {
                 change = item.quantity;
                 if (doc.warehouseId) {
                    const targetInvIndex = newWarehouseInventory.findIndex(inv => inv.warehouseId === doc.warehouseId);
                    if (targetInvIndex > -1) {
                        newWarehouseInventory[targetInvIndex].quantity += item.quantity;
                    } else {
                        newWarehouseInventory.push({ warehouseId: doc.warehouseId, quantity: item.quantity });
                    }
                    return { ...p, stock: p.stock + change, warehouseInventory: newWarehouseInventory };
                 }
              } else if (type === 'adjustment') {
                 change = item.quantity;
              }
              
              if (change !== 0) {
                 return { ...p, stock: p.stock + change };
              }
            }
            return p;
          }));
        });
      }
    }
  };

  const handleSyncOperation = (type: 'Auto' | 'Manual' | 'Push' | 'Pull') => {
     const newLog: SyncLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type,
        status: 'Success',
        details: type === 'Push' ? 'Uploaded 2 pending items' : type === 'Pull' ? 'Downloaded updates' : 'Synced successfully',
        durationMs: Math.floor(Math.random() * 1000) + 200
     };
     setSyncLogs(prev => [newLog, ...prev]);
  };

  const startShift = (branchId: string, startCash: number, notes?: string) => {
     if (!currentUser) return;
     const newShift: Shift = {
        id: `shift-${Date.now()}`,
        userId: currentUser.id,
        branchId,
        startTime: new Date().toISOString(),
        startCash,
        notes,
        status: 'Open'
     };
     setShifts(prev => [newShift, ...prev]);
  };

  const endShift = (shiftId: string, endCash: number, notes?: string) => {
     setShifts(prev => prev.map(s => {
        if (s.id === shiftId) {
           return {
              ...s,
              endTime: new Date().toISOString(),
              endCash,
              status: 'Closed',
              notes: notes || s.notes
           };
        }
        return s;
     }));
  };

  const addShiftSchedule = (s: ShiftSchedule) => setShiftSchedules(prev => [...prev, s]);
  const deleteShiftSchedule = (id: string) => setShiftSchedules(prev => prev.filter(s => s.id !== id));

  const addPromotion = (p: Promotion) => setPromotions(prev => [...prev, p]);
  const updatePromotion = (p: Promotion) => setPromotions(prev => prev.map(item => item.id === p.id ? p : item));
  const deletePromotion = (id: string) => setPromotions(prev => prev.filter(item => item.id !== id));

  return (
    <GlobalContext.Provider value={{
      currentUser, setCurrentUser,
      users, products, sales, units, categories, branches, posMachines, warehouses, locations,
      transfers, counts, reservations, receipts, adjustments, syncLogs, customers, customerLevels,
      shifts, shiftSchedules, promotions, settings,
      processSale, addProduct, updateProduct, deleteProduct,
      addUnit, updateUnit, deleteUnit, addCategory, updateCategory, deleteCategory,
      addBranch, updateBranch, deleteBranch, addPos, updatePos, deletePos,
      addWarehouse, updateWarehouse, deleteWarehouse, addLocation, updateLocation, deleteLocation,
      addUser, updateUser, deleteUser, addCustomer, updateCustomer, deleteCustomer,
      addCustomerLevel, updateCustomerLevel, deleteCustomerLevel,
      updateTransfer, deleteTransfer, updateCount, deleteCount, updateReservation, deleteReservation,
      updateReceipt, deleteReceipt, updateAdjustment, deleteAdjustment,
      handleStockStatusChange, handleSyncOperation,
      startShift, endShift, addShiftSchedule, deleteShiftSchedule,
      addPromotion, updatePromotion, deletePromotion,
      updateSettings, settleSaleDebt, handleVoidSale, t
    }}>
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
