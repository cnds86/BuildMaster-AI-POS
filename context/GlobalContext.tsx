
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, Sale, CartItem, UnitDefinition, CategoryItem, Branch, PosMachine, 
  Warehouse, StorageLocation, StockTransfer, StockCount, StockReservation, 
  StockReceipt, StockAdjustment, DocumentStatus, User, SystemSettings, SyncLog, Customer, Shift, CustomerLevel, ShiftSchedule, Promotion
} from '../types';
import { 
  INITIAL_SETTINGS, INITIAL_USERS, INITIAL_PRODUCTS, INITIAL_CATEGORIES_TREE, 
  INITIAL_UNITS, INITIAL_BRANCHES, INITIAL_POS_MACHINES, INITIAL_WAREHOUSES, 
  INITIAL_LOCATIONS, INITIAL_CUSTOMERS, INITIAL_CUSTOMER_LEVELS, INITIAL_SHIFT_SCHEDULES, INITIAL_SALES, INITIAL_SYNC_LOGS, INITIAL_TRANSFERS, INITIAL_COUNTS, INITIAL_PROMOTIONS
} from '../services/data';
import { translations } from '../services/translations';

interface GlobalContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  settings: SystemSettings;
  updateSettings: (s: SystemSettings) => void;
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
  
  // Translation Helper
  t: (key: string) => string;

  // Handlers
  processSale: (
    cartItems: CartItem[], 
    total: number, 
    customerId?: string, 
    discountAmount?: number, 
    subtotal?: number,
    paymentMethod?: 'cash' | 'card' | 'transfer' | 'qr' | 'credit',
    amountReceived?: number,
    change?: number
  ) => Promise<Sale>;
  
  settleSaleDebt: (saleId: string, amount: number, method: 'cash' | 'card' | 'transfer') => Promise<void>;
  handleVoidSale: (id: string) => Promise<void>;

  addProduct: (p: Product) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  addUnit: (u: UnitDefinition) => Promise<void>;
  updateUnit: (u: UnitDefinition) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
  
  addCategory: (c: CategoryItem) => Promise<void>;
  updateCategory: (c: CategoryItem) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  addBranch: (b: Branch) => Promise<void>;
  updateBranch: (b: Branch) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  
  addPos: (p: PosMachine) => Promise<void>;
  updatePos: (p: PosMachine) => Promise<void>;
  deletePos: (id: string) => Promise<void>;
  
  addWarehouse: (w: Warehouse) => Promise<void>;
  updateWarehouse: (w: Warehouse) => Promise<void>;
  deleteWarehouse: (id: string) => Promise<void>;
  
  addLocation: (l: StorageLocation) => Promise<void>;
  updateLocation: (l: StorageLocation) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  
  addUser: (u: User) => Promise<void>;
  updateUser: (u: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  addCustomer: (c: Customer) => Promise<void>;
  updateCustomer: (c: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  addCustomerLevel: (l: CustomerLevel) => Promise<void>;
  updateCustomerLevel: (l: CustomerLevel) => Promise<void>;
  deleteCustomerLevel: (id: string) => Promise<void>;

  updateTransfer: (t: StockTransfer) => Promise<void>;
  deleteTransfer: (id: string) => Promise<void>;
  updateCount: (c: StockCount) => Promise<void>;
  deleteCount: (id: string) => Promise<void>;
  updateReservation: (r: StockReservation) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  updateReceipt: (r: StockReceipt) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
  updateAdjustment: (a: StockAdjustment) => Promise<void>;
  deleteAdjustment: (id: string) => Promise<void>;
  handleStockStatusChange: (type: string, id: string, status: DocumentStatus) => Promise<void>;
  
  handleSyncOperation: (type: 'Auto' | 'Manual' | 'Push' | 'Pull') => void;

  startShift: (branchId: string, startCash: number, notes?: string) => Promise<void>;
  endShift: (shiftId: string, endCash: number, notes?: string) => Promise<void>;
  addShiftSchedule: (schedule: ShiftSchedule) => Promise<void>;
  deleteShiftSchedule: (id: string) => Promise<void>;

  addPromotion: (p: Promotion) => Promise<void>;
  updatePromotion: (p: Promotion) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with Static Data for Client-Side Mode
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [units, setUnits] = useState<UnitDefinition[]>(INITIAL_UNITS);
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES_TREE);
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [posMachines, setPosMachines] = useState<PosMachine[]>(INITIAL_POS_MACHINES);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES);
  const [locations, setLocations] = useState<StorageLocation[]>(INITIAL_LOCATIONS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [customerLevels, setCustomerLevels] = useState<CustomerLevel[]>(INITIAL_CUSTOMER_LEVELS);
  
  const [transfers, setTransfers] = useState<StockTransfer[]>(INITIAL_TRANSFERS);
  const [counts, setCounts] = useState<StockCount[]>(INITIAL_COUNTS);
  const [reservations, setReservations] = useState<StockReservation[]>([]);
  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(INITIAL_SYNC_LOGS);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftSchedules, setShiftSchedules] = useState<ShiftSchedule[]>(INITIAL_SHIFT_SCHEDULES);
  const [promotions, setPromotions] = useState<Promotion[]>(INITIAL_PROMOTIONS);

  // Load User from LocalStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('buildmaster_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('buildmaster_user');
      }
    }
  }, []);

  // Update LocalStorage when user changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('buildmaster_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('buildmaster_user');
    }
  }, [currentUser]);

  // Mock API Call simulation
  const mockApiCall = async <T,>(data: T): Promise<T> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), 300); // Simulate 300ms latency
    });
  };

  const t = (key: string): string => {
    const lang = settings.language || 'en';
    const keys = key.split('.');
    let value: any = translations[lang as keyof typeof translations];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation missing
      }
    }
    return value as string;
  };

  const processSale = async (
    cartItems: CartItem[], 
    total: number, 
    customerId?: string, 
    discountAmount?: number, 
    subtotal?: number,
    paymentMethod: 'cash' | 'card' | 'transfer' | 'qr' | 'credit' = 'cash',
    amountReceived?: number,
    change?: number
  ): Promise<Sale> => {
    
    let finalPaymentStatus: 'paid' | 'unpaid' | 'partial' = 'paid';
    let finalRemaining = 0;
    
    if (paymentMethod === 'credit') {
        const received = amountReceived || 0;
        finalRemaining = Math.max(0, total - received);
        
        if (finalRemaining <= 0.01) {
             finalPaymentStatus = 'paid';
             finalRemaining = 0;
        } else if (received > 0) {
             finalPaymentStatus = 'partial';
        } else {
             finalPaymentStatus = 'unpaid';
        }
    }

    const newSale: Sale = {
      id: `S-${Date.now()}`,
      items: cartItems,
      total,
      subtotal,
      discountAmount,
      paymentMethod,
      paymentStatus: finalPaymentStatus,
      amountReceived: amountReceived || 0,
      remainingAmount: finalRemaining,
      change: change || 0,
      date: new Date().toISOString(),
      status: 'completed',
      syncStatus: 'pending',
      customerId,
      customerName: customerId ? customers.find(c => c.id === customerId)?.name : undefined
    };

    // Optimistically update Sales
    setSales(prev => [newSale, ...prev]);

    // Optimistically update Product Stock
    setProducts(prevProducts => {
      const updatedProducts = [...prevProducts];
      
      cartItems.forEach(item => {
        const productIndex = updatedProducts.findIndex(p => p.id === item.id);
        if (productIndex > -1) {
          const product = { ...updatedProducts[productIndex] };
          
          // Calculate deduction logic
          let deduction = item.quantity;
          
          product.stock = Math.max(0, product.stock - deduction);
          
          // Update warehouse specific inventory if available (simplified to first warehouse)
          if (product.warehouseInventory && product.warehouseInventory.length > 0) {
             product.warehouseInventory[0].quantity = Math.max(0, product.warehouseInventory[0].quantity - deduction);
          }
          
          updatedProducts[productIndex] = product;
        }
      });
      return updatedProducts;
    });

    await mockApiCall(null);
    return newSale;
  };

  const settleSaleDebt = async (saleId: string, amount: number, method: 'cash' | 'card' | 'transfer') => {
    setSales(prev => prev.map(s => {
      if (s.id === saleId) {
        const currentRemaining = s.remainingAmount || s.total;
        const newRemaining = Math.max(0, currentRemaining - amount);
        const newStatus = newRemaining <= 0.01 ? 'paid' : 'partial';
        const newAmountReceived = (s.amountReceived || 0) + amount;

        // In a real system, we would log a separate "PaymentTransaction" record here
        return {
          ...s,
          paymentStatus: newStatus,
          remainingAmount: newRemaining,
          amountReceived: newAmountReceived
        };
      }
      return s;
    }));
    await mockApiCall(null);
  };

  const handleVoidSale = async (id: string) => {
    // 1. Find the sale
    const saleToVoid = sales.find(s => s.id === id);
    if (!saleToVoid) return;
    if (saleToVoid.status === 'voided') return; // Prevent double voiding

    // 2. Update Sale Status
    setSales(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: 'voided', paymentStatus: 'paid', remainingAmount: 0 }; // Void implies no debt left to collect
      }
      return s;
    }));

    // 3. RESTORE Stock (Logic added)
    setProducts(prevProducts => {
      const updatedProducts = [...prevProducts];
      
      saleToVoid.items.forEach(item => {
        const productIndex = updatedProducts.findIndex(p => p.id === item.id);
        if (productIndex > -1) {
          const product = { ...updatedProducts[productIndex] };
          
          // Add quantity back to stock
          const qtyToRestore = item.quantity;
          product.stock += qtyToRestore;
          
          // Add back to default warehouse inventory
          if (product.warehouseInventory && product.warehouseInventory.length > 0) {
             product.warehouseInventory[0].quantity += qtyToRestore;
          }
          
          updatedProducts[productIndex] = product;
        }
      });
      
      return updatedProducts;
    });

    await mockApiCall(null);
  };

  const addProduct = async (p: Product) => {
    const newProduct = { ...p, id: `P-${Date.now()}` };
    setProducts(prev => [...prev, newProduct]);
    await mockApiCall(null);
  };
  const updateProduct = async (p: Product) => {
    setProducts(prev => prev.map(item => item.id === p.id ? p : item));
    await mockApiCall(null);
  };
  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(item => item.id !== id));
    await mockApiCall(null);
  };

  const addUnit = async (u: UnitDefinition) => {
    setUnits(prev => [...prev, { ...u, id: `u-${Date.now()}` }]);
    await mockApiCall(null);
  };
  const updateUnit = async (u: UnitDefinition) => {
    setUnits(prev => prev.map(item => item.id === u.id ? u : item));
    await mockApiCall(null);
  };
  const deleteUnit = async (id: string) => {
    setUnits(prev => prev.filter(item => item.id !== id));
    await mockApiCall(null);
  };

  const addCategory = async (c: CategoryItem) => {
    setCategories(prev => [...prev, { ...c, id: `c-${Date.now()}` }]);
    await mockApiCall(null);
  };
  const updateCategory = async (c: CategoryItem) => {
    setCategories(prev => prev.map(item => item.id === c.id ? c : item));
    await mockApiCall(null);
  };
  const deleteCategory = async (id: string) => {
    setCategories(prev => prev.filter(item => item.id !== id));
    await mockApiCall(null);
  };

  const updateSettings = async (s: SystemSettings) => {
    setSettings(s);
    await mockApiCall(null);
  };

  const addBranch = async (b: Branch) => {
    setBranches(prev => [...prev, { ...b, id: `b-${Date.now()}` }]);
    await mockApiCall(null);
  };
  const updateBranch = async (b: Branch) => {
    setBranches(prev => prev.map(item => item.id === b.id ? b : item));
    await mockApiCall(null);
  };
  const deleteBranch = async (id: string) => {
    setBranches(prev => prev.filter(item => item.id !== id));
    await mockApiCall(null);
  };
  
  const addPos = async (p: PosMachine) => {
    setPosMachines(prev => [...prev, p]);
    await mockApiCall(null);
  };
  const updatePos = async (p: PosMachine) => {
    setPosMachines(prev => prev.map(item => item.id === p.id ? p : item));
    await mockApiCall(null);
  }; 
  const deletePos = async (id: string) => {
    setPosMachines(prev => prev.filter(item => item.id !== id));
    await mockApiCall(null);
  };

  const addWarehouse = async (w: Warehouse) => {
    setWarehouses(prev => [...prev, { ...w, id: `wh-${Date.now()}` }]);
    await mockApiCall(null);
  };
  const updateWarehouse = async (w: Warehouse) => {
    setWarehouses(prev => prev.map(item => item.id === w.id ? w : item));
    await mockApiCall(null);
  };
  const deleteWarehouse = async (id: string) => {
    setWarehouses(prev => prev.filter(item => item.id !== id));
    await mockApiCall(null);
  };
  
  const addLocation = async (l: StorageLocation) => {
    setLocations(prev => [...prev, { ...l, id: `loc-${Date.now()}` }]);
    await mockApiCall(null);
  };
  const updateLocation = async (l: StorageLocation) => {
    setLocations(prev => prev.map(item => item.id === l.id ? l : item));
    await mockApiCall(null);
  };
  const deleteLocation = async (id: string) => {
    setLocations(prev => prev.filter(item => item.id !== id));
    await mockApiCall(null);
  };

  const addUser = async (u: User) => {
    setUsers(prev => [...prev, { ...u, id: `u-${Date.now()}` }]);
    await mockApiCall(null);
  };
  const updateUser = async (u: User) => {
    setUsers(prev => prev.map(item => item.id === u.id ? u : item));
    await mockApiCall(null);
  };
  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(item => item.id !== id));
    await mockApiCall(null);
  };

  const addCustomer = async (c: Customer) => {
    setCustomers(prev => [...prev, { ...c, id: `cust-${Date.now()}` }]);
    await mockApiCall(null);
  };
  const updateCustomer = async (c: Customer) => {
    setCustomers(prev => prev.map(item => item.id === c.id ? c : item));
    await mockApiCall(null);
  };
  const deleteCustomer = async (id: string) => {
    setCustomers(prev => prev.filter(item => item.id !== id));
    await mockApiCall(null);
  };

  const addCustomerLevel = async (l: CustomerLevel) => {
    setCustomerLevels(prev => [...prev, { ...l, id: `lvl-${Date.now()}` }]);
    await mockApiCall(null);
  };
  const updateCustomerLevel = async (l: CustomerLevel) => {
    setCustomerLevels(prev => prev.map(item => item.id === l.id ? l : item));
    await mockApiCall(null);
  };
  const deleteCustomerLevel = async (id: string) => {
    setCustomerLevels(prev => prev.filter(item => item.id !== id));
    await mockApiCall(null);
  };

  // Stock Documents Mock Logic
  const upsertDoc = (list: any[], setList: any, item: any) => {
    setList((prev: any[]) => {
      const idx = prev.findIndex(i => i.id === item.id);
      if (idx > -1) {
        const newArr = [...prev];
        newArr[idx] = item;
        return newArr;
      }
      return [item, ...prev];
    });
  };

  const deleteDoc = (setList: any, id: string) => {
    setList((prev: any[]) => prev.filter(i => i.id !== id));
  };

  const updateTransfer = async (t: StockTransfer) => { upsertDoc(transfers, setTransfers, t); await mockApiCall(null); };
  const deleteTransfer = async (id: string) => { deleteDoc(setTransfers, id); await mockApiCall(null); };

  const updateCount = async (c: StockCount) => { upsertDoc(counts, setCounts, c); await mockApiCall(null); };
  const deleteCount = async (id: string) => { deleteDoc(setCounts, id); await mockApiCall(null); };

  const updateReservation = async (r: StockReservation) => { upsertDoc(reservations, setReservations, r); await mockApiCall(null); };
  const deleteReservation = async (id: string) => { deleteDoc(setReservations, id); await mockApiCall(null); };

  const updateReceipt = async (r: StockReceipt) => { upsertDoc(receipts, setReceipts, r); await mockApiCall(null); };
  const deleteReceipt = async (id: string) => { deleteDoc(setReceipts, id); await mockApiCall(null); };

  const updateAdjustment = async (a: StockAdjustment) => { upsertDoc(adjustments, setAdjustments, a); await mockApiCall(null); };
  const deleteAdjustment = async (id: string) => { deleteDoc(setAdjustments, id); await mockApiCall(null); };

  const handleStockStatusChange = async (type: string, id: string, status: DocumentStatus) => {
    // 1. Update Document Status
    switch (type) {
      case 'transfer':
        setTransfers(prev => prev.map(d => d.id === id ? { ...d, status } : d));
        // Logic to move stock if Approved/Completed
        if (status === 'Approved') {
           const doc = transfers.find(d => d.id === id);
           if (doc) {
             console.log("Mock Stock Movement: ", doc);
           }
        }
        break;
      case 'count':
        setCounts(prev => prev.map(d => d.id === id ? { ...d, status } : d));
        break;
      case 'reservation':
        setReservations(prev => prev.map(d => d.id === id ? { ...d, status } : d));
        break;
      case 'receipt':
        setReceipts(prev => prev.map(d => d.id === id ? { ...d, status } : d));
        break;
      case 'adjustment':
        setAdjustments(prev => prev.map(d => d.id === id ? { ...d, status } : d));
        break;
    }
    await mockApiCall(null);
  };

  const handleSyncOperation = async (type: 'Auto' | 'Manual' | 'Push' | 'Pull') => {
    const log: SyncLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      status: 'Success',
      details: 'Mock Data Sync Completed (Simulated)',
      durationMs: 750
    };
    setSyncLogs(prev => [log, ...prev]);
    await mockApiCall(null);
  };

  const startShift = async (branchId: string, startCash: number, notes?: string) => {
    if (!currentUser) return;
    const newShift: Shift = {
      id: `sh-${Date.now()}`,
      userId: currentUser.id,
      branchId,
      startTime: new Date().toISOString(),
      startCash,
      notes,
      status: 'Open'
    };
    setShifts(prev => [newShift, ...prev]);
    await mockApiCall(null);
  };

  const endShift = async (shiftId: string, endCash: number, notes?: string) => {
    setShifts(prev => prev.map(s => {
      if (s.id === shiftId) {
        return {
          ...s,
          endTime: new Date().toISOString(),
          endCash,
          notes,
          status: 'Closed'
        };
      }
      return s;
    }));
    await mockApiCall(null);
  };

  const addShiftSchedule = async (schedule: ShiftSchedule) => {
    setShiftSchedules(prev => [...prev, schedule]);
    await mockApiCall(null);
  };

  const deleteShiftSchedule = async (id: string) => {
    setShiftSchedules(prev => prev.filter(s => s.id !== id));
    await mockApiCall(null);
  };

  const addPromotion = async (p: Promotion) => {
    setPromotions(prev => [...prev, { ...p, id: `promo-${Date.now()}` }]);
    await mockApiCall(null);
  };
  const updatePromotion = async (p: Promotion) => {
    setPromotions(prev => prev.map(item => item.id === p.id ? p : item));
    await mockApiCall(null);
  };
  const deletePromotion = async (id: string) => {
    setPromotions(prev => prev.filter(item => item.id !== id));
    await mockApiCall(null);
  };

  return (
    <GlobalContext.Provider value={{
      currentUser, setCurrentUser,
      users, settings, updateSettings,
      products, sales, units, categories, branches, posMachines, warehouses, locations, customers, customerLevels,
      transfers, counts, reservations, receipts, adjustments, syncLogs, shifts, shiftSchedules, promotions,
      
      t, 

      processSale, handleVoidSale, settleSaleDebt,
      addProduct, updateProduct, deleteProduct,
      addUnit, updateUnit, deleteUnit,
      addCategory, updateCategory, deleteCategory,
      addBranch, updateBranch, deleteBranch,
      addPos, updatePos, deletePos,
      addWarehouse, updateWarehouse, deleteWarehouse,
      addLocation, updateLocation, deleteLocation,
      addUser, updateUser, deleteUser,
      addCustomer, updateCustomer, deleteCustomer,
      addCustomerLevel, updateCustomerLevel, deleteCustomerLevel,

      updateTransfer, deleteTransfer,
      updateCount, deleteCount,
      updateReservation, deleteReservation,
      updateReceipt, deleteReceipt,
      updateAdjustment, deleteAdjustment,
      handleStockStatusChange,
      
      handleSyncOperation,
      startShift, endShift,
      addShiftSchedule, deleteShiftSchedule,

      addPromotion, updatePromotion, deletePromotion
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
