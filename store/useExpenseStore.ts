import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Expense, ExpenseCategory } from '../types';

interface ExpenseState {
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  addExpenseCategory: (category: ExpenseCategory) => void;
  deleteExpenseCategory: (id: string) => void;
}

const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat-1', name: 'Utilities (Water, Electricity)' },
  { id: 'cat-2', name: 'Logistics (Gas, Transport)' },
  { id: 'cat-3', name: 'Office & Store Supplies' },
  { id: 'cat-4', name: 'Maintenance & Repairs' },
  { id: 'cat-5', name: 'Staff Welfare (Meals, etc)' }
];

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set) => ({
      expenses: [],
      expenseCategories: DEFAULT_CATEGORIES,
      addExpense: (expense) => set((state) => ({ expenses: [...state.expenses, expense] })),
      updateExpense: (updated) => set((state) => ({
        expenses: state.expenses.map((e) => (e.id === updated.id ? updated : e))
      })),
      deleteExpense: (id) => set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id)
      })),
      addExpenseCategory: (category) => set((state) => ({
        expenseCategories: [...state.expenseCategories, category]
      })),
      deleteExpenseCategory: (id) => set((state) => ({
        expenseCategories: state.expenseCategories.filter((c) => c.id !== id)
      }))
    }),
    {
      name: 'expense-store'
    }
  )
);
