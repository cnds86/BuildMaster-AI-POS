
import { create } from 'zustand';
import { Sale, Customer, CustomerLevel, Shift, ShiftSchedule, Promotion, CashTransaction, Quotation } from '../types';
import { INITIAL_CUSTOMERS, INITIAL_CUSTOMER_LEVELS, INITIAL_PROMOTIONS, INITIAL_SHIFT_SCHEDULES } from '../services/data';

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
  
  addQuotation: (q: Quotation) => void;
  updateQuotation: (q: Quotation) => void;
  deleteQuotation: (id: string) => void;

  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;

  addCustomerLevel: (level: CustomerLevel) => void;
  updateCustomerLevel: (level: CustomerLevel) => void;
  deleteCustomerLevel: (id: string) => void;

  addPromotion: (promo: Promotion) => void;
  updatePromotion: (promo: Promotion) => void;
  deletePromotion: (id: string) => void;

  addShift: (shift: Shift) => void;
  updateShift: (shift: Shift) => void;
  
  addShiftSchedule: (schedule: ShiftSchedule) => void;
  updateShiftSchedule: (schedule: ShiftSchedule) => void;
  deleteShiftSchedule: (id: string) => void;

  // Fix: Handle cash transactions within a shift
  addCashTransaction: (shiftId: string, transaction: CashTransaction) => void;

  restoreSalesData: (data: any) => void;
}

export const useSalesStore = create<SalesState>((set) => ({
  sales: [], // Hydrated by INITIAL_SALES in data.ts via restore if needed, or left empty for fresh start
  quotations: [],
  customers: INITIAL_CUSTOMERS,
  customerLevels: INITIAL_CUSTOMER_LEVELS,
  shifts: [],
  shiftSchedules: INITIAL_SHIFT_SCHEDULES,
  promotions: INITIAL_PROMOTIONS,

  addSale: (sale) => set((state) => ({ sales: [sale, ...state.sales] })),
  updateSale: (sale) => set((state) => ({ sales: state.sales.map(s => s.id === sale.id ? sale : s) })),

  addQuotation: (q) => set((state) => ({ quotations: [q, ...state.quotations] })),
  updateQuotation: (q) => set((state) => ({ quotations: state.quotations.map(x => x.id === q.id ? q : x) })),
  deleteQuotation: (id) => set((state) => ({ quotations: state.quotations.filter(x => x.id !== id) })),

  addCustomer: (customer) => set((state) => ({ customers: [...state.customers, customer] })),
  updateCustomer: (customer) => set((state) => ({ customers: state.customers.map(c => c.id === customer.id ? customer : c) })),

  addCustomerLevel: (level) => set((state) => ({ customerLevels: [...state.customerLevels, level] })),
  updateCustomerLevel: (level) => set((state) => ({ customerLevels: state.customerLevels.map(l => l.id === level.id ? level : l) })),
  deleteCustomerLevel: (id) => set((state) => ({ customerLevels: state.customerLevels.filter(l => l.id !== id) })),

  addPromotion: (promo) => set((state) => ({ promotions: [...state.promotions, promo] })),
  updatePromotion: (promo) => set((state) => ({ promotions: state.promotions.map(p => p.id === promo.id ? promo : p) })),
  deletePromotion: (id) => set((state) => ({ promotions: state.promotions.filter(p => p.id !== id) })),

  addShift: (shift) => set((state) => ({ shifts: [shift, ...state.shifts] })),
  updateShift: (shift) => set((state) => ({ shifts: state.shifts.map(s => s.id === shift.id ? shift : s) })),

  addShiftSchedule: (schedule) => set((state) => ({ shiftSchedules: [...state.shiftSchedules, schedule] })),
  updateShiftSchedule: (schedule) => set((state) => ({ shiftSchedules: state.shiftSchedules.map(s => s.id === schedule.id ? schedule : s) })),
  deleteShiftSchedule: (id) => set((state) => ({ shiftSchedules: state.shiftSchedules.filter(s => s.id !== id) })),

  // Fix: implementation for adding cash transaction to a shift's internal list
  addCashTransaction: (shiftId, transaction) => set((state) => ({
    shifts: state.shifts.map(s => 
      s.id === shiftId 
        ? { ...s, cashTransactions: [...(s.cashTransactions || []), transaction] } 
        : s
    )
  })),

  restoreSalesData: (data) => set((state) => ({
    ...state,
    sales: data.sales || state.sales,
    customers: data.customers || state.customers,
    customerLevels: data.customerLevels || state.customerLevels,
    quotations: data.quotations || state.quotations,
    shifts: data.shifts || state.shifts,
    shiftSchedules: data.shiftSchedules || state.shiftSchedules,
    promotions: data.promotions || state.promotions,
  }))
}));
