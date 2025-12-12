
import { create } from 'zustand';
import { CartItem, Product } from '../types';

interface CartState {
  cart: CartItem[];
  addToCart: (product: Product, qty?: number, variantId?: string) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, delta: number) => void;
  clearCart: () => void;
  total: number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  total: 0,

  addToCart: (product, qty = 1, variantId) => {
    set((state) => {
      // Logic to find price/unit based on variant
      let sellPrice = product.price;
      let sellUnit = product.unit;
      let conversion = 1;

      if (variantId && product.variants) {
        const variant = product.variants.find((v) => v.id === variantId);
        if (variant) {
          sellPrice = variant.price;
          sellUnit = variant.name;
          conversion = variant.conversionFactor;
        }
      }

      const existingIndex = state.cart.findIndex(
        (item) => item.id === product.id && item.selectedVariantId === variantId
      );

      let newCart;
      if (existingIndex > -1) {
        newCart = [...state.cart];
        newCart[existingIndex].quantity += qty;
      } else {
        const newItem: CartItem = {
          ...product,
          quantity: qty,
          selectedVariantId: variantId,
          sellPrice,
          sellUnit,
          sellConversionFactor: conversion,
        };
        newCart = [...state.cart, newItem];
      }

      // Recalculate total
      const newTotal = newCart.reduce((sum, item) => sum + item.sellPrice * item.quantity, 0);
      return { cart: newCart, total: newTotal };
    });
  },

  removeFromCart: (index) => {
    set((state) => {
      const newCart = state.cart.filter((_, i) => i !== index);
      const newTotal = newCart.reduce((sum, item) => sum + item.sellPrice * item.quantity, 0);
      return { cart: newCart, total: newTotal };
    });
  },

  updateQuantity: (index, delta) => {
    set((state) => {
      const newCart = state.cart.map((item, i) => {
        if (i === index) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      });
      const newTotal = newCart.reduce((sum, item) => sum + item.sellPrice * item.quantity, 0);
      return { cart: newCart, total: newTotal };
    });
  },

  clearCart: () => set({ cart: [], total: 0 }),
}));
