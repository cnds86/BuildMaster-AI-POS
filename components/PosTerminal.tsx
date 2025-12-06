
import React, { useState, useMemo } from 'react';
import { Product, CartItem, Category, EstimateResultItem } from '../types';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Sparkles, Box, ArrowLeft, ScanBarcode, Layers } from 'lucide-react';
import { AiAssistant } from './AiAssistant';

interface PosTerminalProps {
  products: Product[];
  onProcessSale: (items: CartItem[], total: number) => void;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({ products, onProcessSale }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Filter products based on broad search
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const searchLower = searchTerm.toLowerCase();
      // Check Main Unit
      const matchesMain = 
        p.name.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower) ||
        p.barcode?.includes(searchLower);
      
      // Check Variants
      const matchesVariant = p.variants && p.variants.some(v => 
        v.code.toLowerCase().includes(searchLower) ||
        v.barcode.includes(searchLower)
      );
      
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return (matchesMain || matchesVariant) && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Handle direct barcode scan or exact search
  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) return;

    // 1. Find exact match for Main Barcode/SKU
    const mainMatch = products.find(p => p.barcode === searchTerm || p.sku === searchTerm);
    if (mainMatch) {
      addToCart(mainMatch, 1, undefined);
      setSearchTerm(''); 
      return;
    }

    // 2. Find exact match for Variant Barcode/Code
    for (const p of products) {
      if (p.variants) {
        const variantMatch = p.variants.find(v => v.barcode === searchTerm || v.code === searchTerm);
        if (variantMatch) {
          addToCart(p, 1, variantMatch.id);
          setSearchTerm('');
          return;
        }
      }
    }
  };

  const addToCart = (product: Product, qty: number = 1, variantId?: string) => {
    setCart(prev => {
      // Create a unique key based on Product ID AND Variant ID (if any)
      const existingItemIndex = prev.findIndex(item => item.id === product.id && item.selectedVariantId === variantId);

      if (existingItemIndex > -1) {
        // Update existing item
        const newCart = [...prev];
        newCart[existingItemIndex].quantity += qty;
        return newCart;
      } else {
        // Determine Price and Unit based on selection
        let sellPrice = product.price;
        let sellUnit = product.unit;
        let conversion = 1;

        if (variantId && product.variants) {
          const variant = product.variants.find(v => v.id === variantId);
          if (variant) {
            sellPrice = variant.price;
            sellUnit = variant.name;
            conversion = variant.conversionFactor;
          }
        }

        const newItem: CartItem = {
          ...product,
          quantity: qty,
          selectedVariantId: variantId,
          sellPrice: sellPrice,
          sellUnit: sellUnit,
          sellConversionFactor: conversion
        };
        return [...prev, newItem];
      }
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleAiItemsAdded = (items: EstimateResultItem[]) => {
    items.forEach(est => {
      if (est.matchedProductId) {
        const product = products.find(p => p.id === est.matchedProductId);
        if (product) {
          // Default to main unit for AI estimates unless logic improved
          addToCart(product, Math.ceil(est.estimatedQuantity), undefined);
        }
      }
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
  const tax = subtotal * 0.07;
  const total = subtotal + tax;
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 relative">
      {/* Left Side: Product Catalog */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">New Order</h2>
          <button 
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm md:text-base"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            <span className="hidden md:inline">AI Smart Estimate</span>
            <span className="md:hidden">AI Est.</span>
          </button>
        </div>

        {/* Search & Categories */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 space-y-4">
          <form onSubmit={handleBarcodeScan} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Scan Barcode / Search Name / SKU..."
              className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700 bg-slate-50 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-slate-200 rounded text-slate-600 hover:bg-slate-300">
               <ScanBarcode className="w-4 h-4" />
            </button>
          </form>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                selectedCategory === 'all' 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Items
            </button>
            {Object.values(Category).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  selectedCategory === cat 
                    ? 'bg-construction-orange text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-24 lg:pb-4 pr-2 flex-1">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full group transition-all duration-200 hover:shadow-md"
            >
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                     <Box className="w-5 h-5" />
                   </div>
                   <div className="text-right">
                     <span className="block text-[10px] md:text-xs font-bold text-slate-400 font-mono">
                       {product.sku}
                     </span>
                   </div>
                </div>
                <h3 className="font-semibold text-slate-800 line-clamp-2 mb-1 text-sm md:text-base">{product.name}</h3>
                <p className="text-xs text-slate-500 mb-2">{product.category}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 mt-2">
                {/* Main Unit Button */}
                <button 
                  onClick={() => addToCart(product, 1, undefined)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-primary-50 hover:text-primary-700 border border-slate-100 hover:border-primary-200 transition-all active:scale-95"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-bold uppercase text-slate-500">{product.unit}</span>
                    <span className="font-bold">${product.price}</span>
                  </div>
                  <Plus className="w-4 h-4" />
                </button>

                {/* Variant Buttons */}
                {product.variants?.map(variant => (
                  <button 
                    key={variant.id}
                    onClick={() => addToCart(product, 1, variant.id)}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-construction-orange/10 hover:text-construction-orange border border-slate-100 hover:border-construction-orange/30 transition-all active:scale-95"
                  >
                     <div className="flex flex-col items-start min-w-0">
                      <div className="flex items-center w-full">
                         <Layers className="w-3 h-3 mr-1 opacity-50 flex-shrink-0" />
                         <span className="text-xs font-bold uppercase text-slate-500 truncate" title={variant.name}>{variant.name}</span>
                      </div>
                      <span className="font-bold">${variant.price}</span>
                    </div>
                    <Plus className="w-4 h-4 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
              <Box className="w-12 h-12 mb-4 opacity-50" />
              <p>No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Cart Overlay Backdrop */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Right Side: Cart */}
      <div className={`
        fixed inset-y-0 right-0 z-40 w-[90%] max-w-sm bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-in-out
        lg:static lg:z-auto lg:w-96 lg:translate-x-0 lg:shadow-xl lg:rounded-xl lg:border lg:border-slate-200 lg:h-full lg:sticky lg:top-4
        ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 lg:rounded-t-xl">
          <div className="flex items-center">
            <button 
              onClick={() => setIsCartOpen(false)}
              className="mr-3 lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-200 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <ShoppingCart className="w-5 h-5 mr-2 text-slate-600" />
            <h3 className="font-bold text-slate-800">Current Cart</h3>
          </div>
          <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-bold">
            {cartItemCount} Items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <ShoppingCart className="w-12 h-12 opacity-20" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs text-center px-8">Scan a barcode or select items from the catalog.</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={`${item.id}-${item.selectedVariantId || 'main'}`} className="flex flex-col p-3 border border-slate-100 rounded-lg hover:border-slate-300 transition-colors bg-white">
                <div className="flex justify-between mb-2">
                  <div className="flex-1">
                     <span className="font-medium text-slate-800 line-clamp-1">{item.name}</span>
                     <div className="flex items-center text-xs mt-1">
                       <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${!item.selectedVariantId ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                         {item.sellUnit}
                       </span>
                       {item.selectedVariantId && (
                         <span className="ml-2 text-slate-400">
                           (From {item.unit})
                         </span>
                       )}
                     </div>
                  </div>
                  <button onClick={() => removeFromCart(index)} className="text-slate-400 hover:text-red-500 ml-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => updateQuantity(index, -1)}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(index, 1)}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">${(item.sellPrice * item.quantity).toFixed(2)}</div>
                    <div className="text-xs text-slate-500">${item.sellPrice} / {item.sellUnit}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 lg:rounded-b-xl">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Tax (7%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button 
              disabled={cart.length === 0}
              className="flex items-center justify-center py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm md:text-base"
            >
              <Banknote className="w-4 h-4 mr-2" />
              Cash
            </button>
            <button 
              disabled={cart.length === 0}
              onClick={() => onProcessSale(cart, total)}
              className="flex items-center justify-center py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm md:text-base"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay Now
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Floating Bottom Bar */}
      {!isCartOpen && (
        <div 
          className="lg:hidden fixed bottom-4 left-4 right-4 bg-slate-900 text-white p-4 rounded-xl shadow-2xl z-20 flex items-center justify-between cursor-pointer active:scale-95 transition-transform" 
          onClick={() => setIsCartOpen(true)}
        >
           <div className="flex flex-col">
              <span className="text-xs text-slate-400">{cartItemCount} Items</span>
              <span className="font-bold text-lg">${total.toFixed(2)}</span>
           </div>
           <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors shadow-lg">
              <ShoppingCart className="w-4 h-4 mr-2" />
              View Cart
           </button>
        </div>
      )}

      <AiAssistant 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        inventory={products}
        onAddItemsToCart={handleAiItemsAdded}
      />
    </div>
  );
};
