
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, UnitDefinition, CategoryItem } from '../types';
import { INITIAL_PRODUCTS, INITIAL_UNITS, INITIAL_CATEGORIES_TREE } from '../services/data';

interface InventoryState {
  products: Product[];
  units: UnitDefinition[];
  categories: CategoryItem[];

  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  
  // Specific inventory actions
  updateProductStock: (productId: string, quantityDelta: number) => void;

  addUnit: (unit: UnitDefinition) => void;
  updateUnit: (unit: UnitDefinition) => void;
  deleteUnit: (id: string) => void;

  addCategory: (category: CategoryItem) => void;
  updateCategory: (category: CategoryItem) => void;
  deleteCategory: (id: string) => void;

  restoreInventoryData: (data: any) => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      products: INITIAL_PRODUCTS,
      units: INITIAL_UNITS,
      categories: INITIAL_CATEGORIES_TREE,

      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
      updateProduct: (product) => set((state) => ({ products: state.products.map(p => p.id === product.id ? product : p) })),
      deleteProduct: (id) => set((state) => ({ products: state.products.filter(p => p.id !== id) })),

      updateProductStock: (productId, quantityDelta) => set((state) => ({
        products: state.products.map(p => 
          p.id === productId ? { ...p, stock: p.stock + quantityDelta } : p
        )
      })),

      addUnit: (unit) => set((state) => ({ units: [...state.units, unit] })),
      updateUnit: (unit) => set((state) => ({ units: state.units.map(u => u.id === unit.id ? unit : u) })),
      deleteUnit: (id) => set((state) => ({ units: state.units.filter(u => u.id !== id) })),

      addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
      updateCategory: (category) => set((state) => ({ categories: state.categories.map(c => c.id === category.id ? category : c) })),
      deleteCategory: (id) => set((state) => ({ categories: state.categories.filter(c => c.id !== id) })),

      restoreInventoryData: (data) => set((state) => ({
        ...state,
        products: data.products || state.products,
        units: data.units || state.units,
        categories: data.categories || state.categories,
      }))
    }),
    {
      name: 'bm_inventory_store',
    }
  )
);
