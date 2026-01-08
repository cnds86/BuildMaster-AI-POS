
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Sale, Customer, CustomerLevel, Shift, ShiftSchedule, Promotion, CashTransaction, Quotation } from '../types';
import { INITIAL_SALES, INITIAL_CUSTOMERS, INITIAL_CUSTOMER_LEVELS, INITIAL_PROMOTIONS, INITIAL_SHIFT_SCHEDULES } from '../services/data';

interface SalesState {
  sales: Sale[];
  quotations: Quotation[]; // Added
  customers: Customer[];
  customerLevels: CustomerLevel[];
  shifts: Shift[];
  shiftSchedules: ShiftSchedule[];
  promotions: Promotion[];

  addSale: (sale: Sale) => void;
  updateSale: (sale: Sale) => void; 
  
  addQuotation: (quotation: Quotation) => void; // Added
  updateQuotation: (quotation: Quotation) => void; // Added
  deleteQuotation: (id: string) => void; // Added

  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  
  addCustomerLevel: (level: CustomerLevel) => void;
  updateCustomerLevel: (level: CustomerLevel) => void;
  deleteCustomerLevel: (id: string) => void;

  startShift: (shift: Shift) => void;
  endShift: (id: string, endData: Partial<Shift>) => void;
  // New action for cash drawer
  addCashTransaction: (transaction: CashTransaction) => void;

  addShiftSchedule: (schedule: ShiftSchedule) => void;
  updateShiftSchedule: (schedule: ShiftSchedule) => void;
  deleteShiftSchedule: (id: string) => void;

  addPromotion: (promo: Promotion) => void;
  updatePromotion: (promo: Promotion) => void;
  deletePromotion: (id: string) => void;

  restoreSalesData: (data: any) => void;
}

export const useSalesStore = create<SalesState>()(
  persist(
    (set) => ({
      sales: INITIAL_SALES,
      quotations: [],
      customers: INITIAL_CUSTOMERS,
      customerLevels: INITIAL_CUSTOMER_LEVELS,
      shifts: [],
      shiftSchedules: INITIAL_SHIFT_SCHEDULES,
      promotions: INITIAL_PROMOTIONS,

      addSale: (sale) => set((state) => ({ sales: [sale, ...state.sales] })),
      updateSale: (sale) => set((state) => ({ sales: state.sales.map(s => s.id === sale.id ? sale : s) })),

      addQuotation: (quotation) => set((state) => ({ quotations: [quotation, ...state.quotations] })),
      updateQuotation: (quotation) => set((state) => ({ quotations: state.quotations.map(q => q.id === quotation.id ? quotation : q) })),
      deleteQuotation: (id) => set((state) => ({ quotations: state.quotations.filter(q => q.id !== id) })),

      addCustomer: (customer) => set((state) => ({ customers: [...state.customers, customer] })),
      updateCustomer: (customer) => set((state) => ({ customers: state.customers.map(c => c.id === customer.id ? customer : c) })),
      deleteCustomer: (id) => set((state) => ({ customers: state.customers.filter(c => c.id !== id) })),

      addCustomerLevel: (level) => set((state) => ({ customerLevels: [...state.customerLevels, level] })),
      updateCustomerLevel: (level) => set((state) => ({ customerLevels: state.customerLevels.map(l => l.id === level.id ? level : l) })),
      deleteCustomerLevel: (id) => set((state) => ({ customerLevels: state.customerLevels.filter(l => l.id !== id) })),

      startShift: (shift) => set((state) => ({ shifts: [shift, ...state.shifts] })),
      endShift: (id, endData) => set((state) => ({ 
        shifts: state.shifts.map(s => s.id === id ? { ...s, ...endData } : s) 
      })),
      
      addCashTransaction: (txn) => set((state) => ({
        shifts: state.shifts.map(s => {
          if (s.id === txn.shiftId) {
            return {
              ...s,
              cashTransactions: [...(s.cashTransactions || []), txn]
            };
          }
          return s;
        })
      })),

      addShiftSchedule: (schedule) => set((state) => ({ shiftSchedules: [...state.shiftSchedules, schedule] })),
      updateShiftSchedule: (schedule) => set((state) => ({ shiftSchedules: state.shiftSchedules.map(s => s.id === schedule.id ? schedule : s) })),
      deleteShiftSchedule: (id) => set((state) => ({ shiftSchedules: state.shiftSchedules.filter(s => s.id !== id) })),

      addPromotion: (promo) => set((state) => ({ promotions: [...state.promotions, promo] })),
      updatePromotion: (promo) => set((state) => ({ promotions: state.promotions.map(p => p.id === promo.id ? promo : p) })),
      deletePromotion: (id) => set((state) => ({ promotions: state.promotions.filter(p => p.id !== id) })),

      restoreSalesData: (data) => set((state) => ({
        ...state,
        sales: data.sales || state.sales,
        quotations: data.quotations || state.quotations || [],
        customers: data.customers || state.customers,
        customerLevels: data.customerLevels || state.customerLevels,
        shifts: data.shifts || state.shifts,
        promotions: data.promotions || state.promotions
      }))
    }),
    {
      name: 'bm_sales_store',
    }
  )
);
