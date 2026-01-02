
import { create } from 'zustand';
import { Sale, Customer, CustomerLevel, Shift, ShiftSchedule, Promotion, CashTransaction, Quotation } from '../types';

interface SalesState {
  sales: Sale[];
  quotations: Quotation[];
  customers: Customer[];
  customerLevels: CustomerLevel[];
  shifts: Shift[];
  shiftSchedules: ShiftSchedule[];
  promotions: Promotion[];

  addSale: (sale: Sale) => void;
  updateSale: (sale: Sale) => void; 
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  restoreSalesData: (data: any) => void;
  // ... (Other methods as needed)
}

export const useSalesStore = create<SalesState>((set) => ({
  sales: [],
  quotations: [],
  customers: [],
  customerLevels: [],
  shifts: [],
  shiftSchedules: [],
  promotions: [],

  addSale: (sale) => set((state) => ({ sales: [sale, ...state.sales] })),
  updateSale: (sale) => set((state) => ({ sales: state.sales.map(s => s.id === sale.id ? sale : s) })),
  addCustomer: (customer) => set((state) => ({ customers: [...state.customers, customer] })),
  updateCustomer: (customer) => set((state) => ({ customers: state.customers.map(c => c.id === customer.id ? customer : c) })),

  restoreSalesData: (data) => set((state) => ({
    ...state,
    sales: data.sales || state.sales,
    customers: data.customers || state.customers,
    customerLevels: data.customerLevels || state.customerLevels,
  }))
}));
