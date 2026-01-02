
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, HeldOrder, Customer } from '../types';

interface CartState {
  cart: CartItem[];
  heldOrders: HeldOrder[];
  addToCart: (product: Product, qty?: number, variantId?: string) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, delta: number) => void;
  setQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  
  // Hold & Recall
  holdCurrentOrder: (customer?: Customer | null, note?: string) => void;
  recallOrder: (orderId: string) => HeldOrder | undefined;
  discardHeldOrder: (orderId: string) => void;
  
  total: number;
}

// Helper to calculate total
const calcTotal = (items: CartItem[]) => items.reduce((sum, item) => sum + item.sellPrice * item.quantity, 0);

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      heldOrders: [], 
      total: 0,

      addToCart: (product, qty, variantId) => {
        set((state) => {
          // Logic to find price/unit based on variant
          let sellPrice = product.price;
          let sellUnit = product.unit;
          let variantNameSuffix = '';
          
          if (variantId && product.variants) {
            const variant = product.variants.find((v) => v.id === variantId);
            if (variant) {
              sellPrice = variant.price;
              variantNameSuffix = ` (${variant.name})`;
            }
          }

          // Enforce MOQ on first add
          const minQty = product.minOrderQuantity || 1;
          const quantityToAdd = qty !== undefined ? qty : minQty;

          const existingIndex = state.cart.findIndex(
            (item) => item.id === product.id && item.selectedVariantId === variantId
          );

          let newCart;
          if (existingIndex > -1) {
            newCart = [...state.cart];
            newCart[existingIndex].quantity += quantityToAdd;
          } else {
            // Ensure even if qty passed is small (e.g. from generic scanner), we respect MOQ if it's a new line item
            const finalQty = Math.max(quantityToAdd, minQty);
            
            const newItem: CartItem = {
              ...product,
              name: product.name + variantNameSuffix, // Visually append variant name for simplicity in some views
              quantity: finalQty,
              selectedVariantId: variantId,
              sellPrice,
              sellUnit,
              sellConversionFactor: 1, // Simplified for now
            };
            newCart = [...state.cart, newItem];
          }

          return { cart: newCart, total: calcTotal(newCart) };
        });
      },

      removeFromCart: (index) => {
        set((state) => {
          const newCart = state.cart.filter((_, i) => i !== index);
          return { cart: newCart, total: calcTotal(newCart) };
        });
      },

      updateQuantity: (index, delta) => {
        set((state) => {
          const newCart = state.cart.map((item, i) => {
            if (i === index) {
              const minQty = item.minOrderQuantity || 1;
              const newQty = item.quantity + delta;
              
              // If new quantity is below MOQ, don't update (user must delete item instead)
              if (newQty < minQty) return item; 
              
              return { ...item, quantity: newQty };
            }
            return item;
          });
          return { cart: newCart, total: calcTotal(newCart) };
        });
      },

      setQuantity: (index, quantity) => {
        set((state) => {
          const newCart = state.cart.map((item, i) => {
            if (i === index) {
              const minQty = item.minOrderQuantity || 1;
              return { ...item, quantity: Math.max(minQty, quantity) };
            }
            return item;
          });
          return { cart: newCart, total: calcTotal(newCart) };
        });
      },

      clearCart: () => set({ cart: [], total: 0 }),

      holdCurrentOrder: (customer, note) => {
        set((state) => {
          if (state.cart.length === 0) return state;

          const newHeldOrder: HeldOrder = {
            id: `hold-${Date.now()}`,
            items: [...state.cart],
            customer: customer,
            timestamp: new Date().toISOString(),
            note: note,
            total: state.total
          };

          return {
            heldOrders: [newHeldOrder, ...state.heldOrders],
            cart: [],
            total: 0
          };
        });
      },

      recallOrder: (orderId) => {
        const state = get();
        const orderToRecall = state.heldOrders.find(o => o.id === orderId);
        
        if (orderToRecall) {
          set({
            // Restore cart
            cart: orderToRecall.items,
            total: orderToRecall.total,
            // Remove from held
            heldOrders: state.heldOrders.filter(o => o.id !== orderId)
          });
          return orderToRecall;
        }
        return undefined;
      },

      discardHeldOrder: (orderId) => {
        set((state) => ({
          heldOrders: state.heldOrders.filter(o => o.id !== orderId)
        }));
      }
    }),
    {
      name: 'bm_cart_store',
    }
  )
);
