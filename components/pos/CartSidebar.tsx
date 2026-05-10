
import React from 'react';
import { Customer, SystemSettings } from '../../types';
import { ShoppingCart, PauseCircle, X, Minus, Plus, Trash2, User, Tag, ChevronRight, ChevronDown, Sparkles } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';
import { useCartStore } from '../../store/useCartStore';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomer: Customer | null;
  onRemoveCustomer: () => void;
  onHoldOrder: () => void;
  onCheckout: () => void;
  onDiscountClick: () => void;
  subtotal: number;
  discount: number;
  autoDiscount?: number;
  tax: number;
  total: number;
  roundingDifference?: number; // Added
  settings?: SystemSettings;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  selectedCustomer,
  onRemoveCustomer,
  onHoldOrder,
  onCheckout,
  onDiscountClick,
  subtotal,
  discount,
  autoDiscount = 0,
  tax,
  total,
  roundingDifference = 0, // Added default
  settings
}) => {
  const { formatPrice, t } = useGlobal();
  const { cart, removeFromCart, updateQuantity } = useCartStore();

  const renderVariantDetails = (item: any) => {
    if (!item.selectedVariantId || !item.variants) return null;
    const variant = item.variants.find((v: any) => v.id === item.selectedVariantId);
    if (!variant || !variant.attributes) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.values(variant.attributes).map((val: any, idx: number) => (
          <span key={idx} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded border border-slate-200">
            {val}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white relative w-full">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-slate-100 bg-white flex justify-between items-center z-10 shrink-0 shadow-sm">
        <div>
           <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-lg md:text-xl">{t('pos.currentOrder', 'Order Ticket')}</h3>
              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{cart.reduce((a,c)=>a+c.quantity,0)}</span>
           </div>
           <div className="text-xs text-slate-400 mt-0.5 font-medium">
              {new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
           </div>
        </div>
        <div className="flex space-x-2">
           <button 
              onClick={onHoldOrder} 
              disabled={cart.length === 0} 
              className="p-2.5 bg-slate-50 text-slate-500 rounded-full hover:bg-orange-50 hover:text-orange-600 transition-colors disabled:opacity-30" 
              title="Hold Order"
           >
              <PauseCircle className="w-5 h-5" />
           </button>
           <button onClick={onClose} className="lg:hidden p-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
             <ChevronDown className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Customer Bar */}
      {selectedCustomer && (
         <div className="px-5 py-3 border-b border-slate-100 bg-blue-50/50 flex justify-between items-center shrink-0">
            <div className="flex items-center">
               <div className="w-8 h-8 rounded-full bg-white border border-blue-200 text-blue-700 flex items-center justify-center mr-3 shadow-sm">
                  <User className="w-4 h-4" />
               </div>
               <div>
                  <p className="text-sm font-bold text-slate-800">{selectedCustomer.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Points: {selectedCustomer.loyaltyPoints}</p>
               </div>
            </div>
            <button onClick={onRemoveCustomer} className="text-slate-400 hover:text-red-500 bg-white p-1 rounded-full border border-slate-200"><X className="w-3 h-3" /></button>
         </div>
      )}

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto bg-white p-4 space-y-3 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
               <ShoppingCart className="w-8 h-8 text-slate-200" />
            </div>
            <div className="text-center">
               <p className="font-bold text-slate-400">{t('pos.emptyCart', 'Cart is empty')}</p>
               <p className="text-xs mt-1">{t('pos.emptyCartDesc', 'Scan items to start')}</p>
            </div>
          </div>
        ) : (
          cart.map((item, index) => {
            const minQty = item.minOrderQuantity || 1;
            const isMin = item.quantity <= minQty;

            return (
              <div key={`${item.id}-${index}-${item.selectedVariantId}`} className="flex gap-3 group bg-white rounded-xl border border-slate-100 p-2 hover:border-slate-300 transition-colors shadow-sm">
                {/* Qty Controls */}
                <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg w-10 shrink-0 border border-slate-200">
                   <button 
                     onClick={() => updateQuantity(index, 1)} 
                     className="w-full h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors hover:bg-white rounded-t-lg"
                   >
                      <Plus className="w-3 h-3" />
                   </button>
                   <span className="text-sm font-bold text-slate-900 h-6 flex items-center justify-center bg-white w-full border-y border-slate-200">{item.quantity}</span>
                   <button 
                     onClick={() => updateQuantity(index, -1)} 
                     disabled={isMin}
                     className={`w-full h-8 flex items-center justify-center transition-colors rounded-b-lg ${isMin ? 'text-slate-200' : 'text-slate-500 hover:text-red-500 hover:bg-white'}`}
                   >
                      <Minus className="w-3 h-3" />
                   </button>
                </div>

                <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                   <div className="flex justify-between items-start gap-2">
                      <div>
                         <h4 className="font-bold text-black text-sm line-clamp-2 leading-tight">{item.name}</h4>
                         <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                               {item.sellUnit}
                            </span>
                            {renderVariantDetails(item)}
                         </div>
                      </div>
                      <span className="font-bold text-slate-900 text-sm shrink-0">{formatPrice(item.sellPrice * item.quantity)}</span>
                   </div>
                   
                   <div className="flex justify-between items-end mt-1">
                      <div className="text-xs text-slate-400 font-medium">
                         @ {formatPrice(item.sellPrice)}
                      </div>
                      <button onClick={() => removeFromCart(index)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-20 pb-6 pt-2">
        <div className="px-5 mb-4">
           <button 
              onClick={onDiscountClick} 
              className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:border-slate-300 hover:bg-slate-50 transition-colors flex justify-between items-center px-4"
           >
              <span className="flex items-center"><Tag className="w-3.5 h-3.5 mr-2" /> Add Discount / Coupon</span>
              {discount > 0 && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px]">-{formatPrice(discount)}</span>}
           </button>
        </div>

        <div className="px-6 space-y-2 mb-4">
           <div className="flex justify-between text-sm text-slate-500 font-medium">
              <span>{t('pos.subtotal', 'Subtotal')}</span>
              <span>{formatPrice(subtotal)}</span>
           </div>
           
           {autoDiscount > 0 && (
              <div className="flex justify-between text-sm text-orange-600 font-bold bg-orange-50 px-2 py-1 -mx-2 rounded">
                 <span className="flex items-center"><Sparkles className="w-4 h-4 mr-1.5" /> Auto Promo Applied</span>
                 <span>-{formatPrice(autoDiscount)}</span>
              </div>
           )}

           {discount - autoDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                 <span>Manual / Loyalty Discount</span>
                 <span>-{formatPrice(discount - autoDiscount)}</span>
              </div>
           )}

           {settings?.tax?.enabled && (
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                 <span>{t('pos.tax', 'Tax')} ({settings.tax.rate}%)</span>
                 <span>{formatPrice(tax)}</span>
              </div>
           )}
           
           {/* Rounding Adjustment Display */}
           {roundingDifference !== 0 && (
              <div className="flex justify-between text-xs text-slate-400 italic">
                 <span>Rounding</span>
                 <span className={roundingDifference > 0 ? 'text-green-600' : 'text-red-500'}>
                    {roundingDifference > 0 ? '+' : ''}{formatPrice(roundingDifference)}
                 </span>
              </div>
           )}

           {/* Rounding Adjustment Display */}
           {roundingDifference !== 0 && (
              <div className="flex justify-between text-xs text-slate-400 italic">
                 <span>Rounding</span>
                 <span className={roundingDifference > 0 ? 'text-green-600' : 'text-red-500'}>
                    {roundingDifference > 0 ? '+' : ''}{formatPrice(roundingDifference)}
                 </span>
              </div>
           )}

           <div className="flex justify-between items-end pt-2 border-t border-slate-100">
              <span className="text-base font-bold text-slate-800">{t('common.total', 'Total')}</span>
              <span className="text-4xl font-extrabold text-slate-900 tracking-tighter">{formatPrice(total + roundingDifference)}</span>
           </div>
        </div>

        <div className="px-5">
           <button 
              onClick={onCheckout} 
              disabled={cart.length === 0}
              className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-xl hover:bg-red-700 hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
           >
              <span>Charge {formatPrice(total + roundingDifference)}</span>
              <ChevronRight className="w-5 h-5 ml-2 opacity-60" />
           </button>
        </div>
      </div>
    </div>
  );
};
