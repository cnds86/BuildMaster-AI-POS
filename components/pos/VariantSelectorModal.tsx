
import React, { useState, useEffect } from 'react';
import { Product, ProductVariant } from '../../types';
import { X, Minus, Plus, ShoppingCart, Box, Tag, Check } from 'lucide-react';

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
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    product.variants?.[0]?.id
  );
  const [quantity, setQuantity] = useState(product.minOrderQuantity || 1);

  // Auto-reset when a different product is passed
  useEffect(() => {
    setSelectedVariantId(product.variants?.[0]?.id);
    setQuantity(product.minOrderQuantity || 1);
  }, [product]);

  if (!isOpen) return null;

  const activeVariant = product.variants?.find(v => v.id === selectedVariantId);
  const currentPrice = activeVariant ? activeVariant.price : product.price;
  const currentUnit = product.unit;

  const handleConfirm = () => {
    onConfirm(product, quantity, selectedVariantId);
  };

  const adjustQty = (delta: number) => {
    const min = product.minOrderQuantity || 1;
    setQuantity(prev => Math.max(min, prev + delta));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-xl rounded-t-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0 bg-white">
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                {product.imageUrl ? (
                   <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                   <Box className="w-8 h-8 text-slate-300" />
                )}
             </div>
             <div>
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">{product.name}</h3>
                <p className="text-slate-500 font-medium text-sm mt-1">{product.sku}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
           {/* Variant Selection */}
           {product.variants && product.variants.length > 0 && (
              <div>
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                    <Tag className="w-3.5 h-3.5 mr-1.5" /> Select Option
                 </label>
                 <div className="grid grid-cols-1 gap-3">
                    {product.variants.map((v) => {
                       const isSelected = selectedVariantId === v.id;
                       return (
                          <button
                             key={v.id}
                             onClick={() => setSelectedVariantId(v.id)}
                             className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${
                                isSelected 
                                   ? 'border-slate-900 bg-slate-900 text-white shadow-lg' 
                                   : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-slate-300'
                             }`}
                          >
                             <div className="flex justify-between items-center relative z-10">
                                <div>
                                   <p className="font-bold text-lg">{v.name}</p>
                                   <p className={`text-xs ${isSelected ? 'text-slate-300' : 'text-slate-400'} font-mono mt-0.5`}>{v.code}</p>
                                </div>
                                <div className="text-right">
                                   <p className="font-black text-xl">{formatPrice(v.price)}</p>
                                   <p className={`text-[10px] ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>Stock: {v.stock}</p>
                                </div>
                             </div>
                             {isSelected && (
                                <div className="absolute top-0 right-0 p-1">
                                   <div className="bg-white/20 rounded-bl-xl p-1">
                                      <Check className="w-4 h-4 text-white" />
                                   </div>
                                </div>
                             )}
                          </button>
                       );
                    })}
                 </div>
              </div>
           )}

           {/* Quantity Selection */}
           <div className="flex flex-col items-center">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Set Quantity</label>
              <div className="flex items-center gap-8">
                 <button 
                    onClick={() => adjustQty(-1)}
                    className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-200 text-slate-800 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90"
                 >
                    <Minus className="w-6 h-6" />
                 </button>
                 
                 <div className="text-center">
                    <span className="text-6xl font-black text-slate-900">{quantity}</span>
                    <p className="text-slate-400 font-bold text-sm uppercase mt-1">{currentUnit}</p>
                 </div>

                 <button 
                    onClick={() => adjustQty(1)}
                    className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-200 text-slate-800 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90"
                 >
                    <Plus className="w-6 h-6" />
                 </button>
              </div>
              
              <div className="flex gap-2 mt-6">
                 {[1, 5, 10, 20, 50].map(val => (
                    <button 
                       key={val}
                       onClick={() => setQuantity(val)}
                       className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-900 hover:text-white transition-colors border border-slate-200"
                    >
                       {val}
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white">
           <div className="flex justify-between items-end mb-6 px-2">
              <div>
                 <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total for this item</p>
                 <p className="text-3xl font-extrabold text-slate-900">{formatPrice(currentPrice * quantity)}</p>
              </div>
              <div className="text-right">
                 <p className="text-xs font-bold text-slate-400 uppercase mb-1">Unit Price</p>
                 <p className="text-lg font-bold text-slate-700">{formatPrice(currentPrice)}</p>
              </div>
           </div>

           <button 
              onClick={handleConfirm}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-xl hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all flex items-center justify-center active:scale-[0.98]"
           >
              <ShoppingCart className="w-6 h-6 mr-3" />
              Add to Ticket
           </button>
        </div>
      </div>
    </div>
  );
};
