
import React, { useState, useEffect } from 'react';
import { Product, ProductVariant } from '../../types';
import { X, Minus, Plus, ShoppingCart, Box, Tag, Check, Package, Layers } from 'lucide-react';

interface VariantSelectorModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (product: Product, quantity: number, variantId?: string) => void;
  formatPrice: (val: number) => string;
}

export const VariantSelectorModal: React.FC<VariantSelectorModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
  formatPrice
}) => {
  // undefined variantId implies the Base Product (Single Unit)
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(product.minOrderQuantity || 1);

  // Reset state when product changes
  useEffect(() => {
    setSelectedVariantId(undefined); // Default to base product
    setQuantity(product.minOrderQuantity || 1);
  }, [product]);

  if (!isOpen) return null;

  // Determine current active selection details
  const activeVariant = selectedVariantId ? product.variants?.find(v => v.id === selectedVariantId) : null;
  
  // Use tier price if available (from parent logic passing), otherwise regular price
  // Note: product.price might already be the tier price if passed from POS
  const currentPrice = activeVariant ? activeVariant.price : product.price;
  const currentUnit = activeVariant ? activeVariant.name : product.unit;
  const currentCode = activeVariant ? activeVariant.code : product.sku;

  const handleConfirm = () => {
    onConfirm(product, quantity, selectedVariantId);
  };

  const adjustQty = (delta: number) => {
    const min = product.minOrderQuantity || 1;
    setQuantity(prev => Math.max(min, prev + delta));
  };

  const renderAttributes = (attributes?: Record<string, string>) => {
    if (!attributes) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(attributes).map(([key, val]) => (
          <span key={key} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 font-medium">
            {val}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-start shrink-0 bg-white">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                {product.imageUrl ? (
                   <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                   <Box className="w-8 h-8 text-slate-300" />
                )}
             </div>
             <div>
                <h3 className="text-lg md:text-xl font-extrabold text-slate-900 leading-tight line-clamp-2">{product.name}</h3>
                <p className="text-slate-500 font-medium text-xs md:text-sm mt-1">{product.sku} • {product.category}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-6 flex flex-col md:flex-row gap-6">
           
           {/* Left: Options List */}
           <div className="flex-1 space-y-4">
              
              {/* SECTION 1: BASE UNIT */}
              <div>
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                    <Box className="w-3.5 h-3.5 mr-1.5" /> Base Unit
                 </label>
                 <button
                    onClick={() => setSelectedVariantId(undefined)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden flex justify-between items-center group ${
                       selectedVariantId === undefined
                          ? 'border-slate-900 bg-slate-50' 
                          : 'border-slate-100 bg-white hover:border-slate-300'
                    }`}
                 >
                    <div>
                       <div className="flex items-center gap-2">
                          <span className={`font-bold ${selectedVariantId === undefined ? 'text-slate-900' : 'text-slate-700'}`}>
                             1 {product.unit} (Single)
                          </span>
                          {selectedVariantId === undefined && <Check className="w-4 h-4 text-green-600" />}
                       </div>
                       <p className="text-xs text-slate-400 mt-0.5 font-mono">{product.sku}</p>
                    </div>
                    <div className="text-right">
                       <p className="font-bold text-slate-900">{formatPrice(product.price)}</p>
                       <p className="text-[10px] text-slate-500">Stock: {product.stock}</p>
                    </div>
                 </button>
              </div>

              {/* SECTION 2: VARIANTS & PACKS */}
              {product.variants && product.variants.length > 0 && (
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center mt-4">
                       <Layers className="w-3.5 h-3.5 mr-1.5" /> Options & Packs
                    </label>
                    <div className="space-y-2">
                       {product.variants.map((v) => {
                          const isSelected = selectedVariantId === v.id;
                          const isPack = v.conversionFactor && v.conversionFactor > 1;
                          
                          return (
                             <button
                                key={v.id}
                                onClick={() => setSelectedVariantId(v.id)}
                                className={`w-full p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden flex justify-between items-center group ${
                                   isSelected 
                                      ? 'border-slate-900 bg-slate-50' 
                                      : 'border-slate-100 bg-white hover:border-slate-300'
                                }`}
                             >
                                <div>
                                   <div className="flex items-center gap-2">
                                      {isPack ? <Package className="w-4 h-4 text-orange-500" /> : <Tag className="w-4 h-4 text-blue-500" />}
                                      <span className={`font-bold ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                                         {v.name}
                                      </span>
                                      {isSelected && <Check className="w-4 h-4 text-green-600" />}
                                   </div>
                                   
                                   {/* Variant Attributes (Color, Size) */}
                                   {renderAttributes(v.attributes)}
                                   
                                   <p className="text-xs text-slate-400 mt-0.5 font-mono">{v.code}</p>
                                </div>
                                <div className="text-right">
                                   <p className="font-bold text-slate-900">{formatPrice(v.price)}</p>
                                   {isPack && (
                                      <p className="text-[10px] text-slate-500 bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded inline-block font-bold mt-1">
                                         Contains {v.conversionFactor} {product.unit}
                                      </p>
                                   )}
                                </div>
                             </button>
                          );
                       })}
                    </div>
                 </div>
              )}
           </div>

           {/* Right: Quantity & Summary */}
           <div className="w-full md:w-64 flex flex-col bg-slate-50 p-5 rounded-2xl h-fit border border-slate-100 shrink-0">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quantity</label>
              
              <div className="flex items-center justify-between mb-6">
                 <button 
                    onClick={() => adjustQty(-1)}
                    className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm"
                 >
                    <Minus className="w-5 h-5" />
                 </button>
                 <div className="text-center">
                    <span className="text-4xl font-black text-slate-900">{quantity}</span>
                    <p className="text-xs font-bold text-slate-500 uppercase mt-1">{currentUnit}</p>
                 </div>
                 <button 
                    onClick={() => adjustQty(1)}
                    className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm"
                 >
                    <Plus className="w-5 h-5" />
                 </button>
              </div>

              <div className="flex gap-2 mb-6">
                 {[5, 10, 20].map(val => (
                    <button 
                       key={val}
                       onClick={() => setQuantity(val)}
                       className="flex-1 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:border-slate-400 transition-all"
                    >
                       {val}
                    </button>
                 ))}
              </div>

              <div className="border-t border-slate-200 pt-4 mt-auto space-y-2">
                 <div className="flex justify-between text-sm text-slate-500">
                    <span>Unit Price</span>
                    <span>{formatPrice(currentPrice)}</span>
                 </div>
                 <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-800">Total</span>
                    <span className="text-2xl font-black text-slate-900 tracking-tight">{formatPrice(currentPrice * quantity)}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white pb-safe">
           <button 
              onClick={handleConfirm}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all flex items-center justify-center active:scale-[0.98]"
           >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add {quantity} {currentUnit} to Cart
           </button>
        </div>
      </div>
    </div>
  );
};
