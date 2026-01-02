
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
import { api } from '../services/api';

interface GlobalContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  settings: SystemSettings;
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  warehouses: Warehouse[];
  // Actions
  processSale: (items: CartItem[], total: number, customerId?: string, discountAmount?: number, subtotal?: number, paymentMethod?: any, amountReceived?: number, change?: number, pointsRedeemed?: number, source?: 'pos' | 'back-office') => Promise<Sale>;
  refreshData: () => Promise<void>;
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
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  const refreshData = async () => {
    try {
      const [products, sales, customers] = await Promise.all([
        api.get('/products'),
        api.get('/sales'),
        api.get('/customers')
      ]);
      
      inventoryStore.restoreInventoryData({ products });
      salesStore.restoreSalesData({ sales, customers });
      setIsBackendConnected(true);
    } catch (error) {
      console.warn("Bun backend unreachable. Operating in offline/local mode.");
      setIsBackendConnected(false);
      // Keep existing store data (initial seeds or persisted localstorage)
    }
  };

  useEffect(() => {
    refreshData();
    // Auto-refresh every minute
    const interval = setInterval(refreshData, 60000);
    return () => clearInterval(interval);
  }, []);

  const t = (key: string): string => {
    const lang = systemStore.settings.language || 'en';
    const keys = key.split('.');
    let value: any = (translations as any)[lang];
    for (const k of keys) { value = value?.[k]; }
    return value || key;
  };

  const formatPrice = (amount: number) => {
    const symbol = systemStore.settings.currencySymbol;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: symbol === '₭' ? 'LAK' : symbol === '฿' ? 'THB' : 'USD',
      minimumFractionDigits: symbol === '₭' ? 0 : 2,
    }).format(amount);
  };

  const processSale = async (items: CartItem[], total: number, customerId?: string, discountAmount?: number, subtotal?: number, paymentMethod: any = 'cash', amountReceived?: number, change?: number, pointsRedeemed?: number, source: any = 'pos'): Promise<Sale> => {
    const payload = {
      items, total, subtotal: subtotal || total, discountAmount, paymentMethod, 
      paymentStatus: paymentMethod === 'credit' ? 'unpaid' : 'paid',
      customerId, userId: systemStore.currentUser?.id, userName: systemStore.currentUser?.name
    };

    try {
      const newSale = await api.post('/sales', payload);
      await refreshData(); 
      return newSale;
    } catch (error) {
      // Fallback: local processing if backend fails
      const localSale: Sale = {
        id: `L-${Date.now()}`,
        items, total, date: new Date().toISOString(),
        paymentMethod, paymentStatus: 'paid', status: 'completed',
        syncStatus: 'pending', customerId
      };
      salesStore.addSale(localSale);
      return localSale;
    }
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
      warehouses: stockStore.warehouses,
      processSale,
      refreshData,
      t,
      formatPrice
    }}>
      {children}
      {!isBackendConnected && (
        <div className="fixed bottom-4 left-4 bg-orange-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg z-[100] animate-pulse">
          Offline Mode
        </div>
      )}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('useGlobal must be used within a GlobalProvider');
  return context;
};
