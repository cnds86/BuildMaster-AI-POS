
import React from 'react';
import { Customer, SystemSettings } from '../../types';
import { ShoppingCart, PauseCircle, X, Minus, Plus, Trash2, User, ChevronRight, Tag } from 'lucide-react';
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
  tax: number;
  total: number;
  settings?: SystemSettings;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen, onClose, selectedCustomer, onRemoveCustomer,
  onHoldOrder, onCheckout, onDiscountClick,
  subtotal, discount, tax, total, settings
}) => {
  const { formatPrice } = useGlobal();
  const { cart, removeFromCart, updateQuantity } = useCartStore();

  return (
    <div className="flex flex-col h-full bg-white relative border-l border-slate-200">
      {/* Header - Order Ticket Style */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
        <div>
           <h3 className="font-extrabold text-slate-900 text-2xl tracking-tight">Order Ticket</h3>
           <div className="flex items-center text-xs text-slate-400 mt-1 font-bold space-x-2 uppercase tracking-wider">
              <span>{cart.reduce((a,c)=>a+c.quantity,0)} Items</span>
              <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
              <span>{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
           </div>
        </div>
        <div className="flex space-x-2">
           <button 
              onClick={onHoldOrder} 
              disabled={cart.length === 0} 
              className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-orange-50 hover:text-orange-600 transition-all disabled:opacity-30 border border-transparent hover:border-orange-100" 
              title="Suspend Order"
           >
              <PauseCircle className="w-6 h-6" />
           </button>
           <button onClick={onClose} className="lg:hidden p-3 text-slate-400 hover:bg-slate-100 rounded-2xl">
             <X className="w-6 h-6" />
           </button>
        </div>
      </div>

      {/* Selected Customer Display */}
      {selectedCustomer && (
         <div className="mx-6 my-4 p-4 rounded-2xl bg-primary-50 border border-primary-100 flex justify-between items-center animate-fade-in">
            <div className="flex items-center">
               <div className="w-10 h-10 rounded-full bg-white text-primary-600 flex items-center justify-center mr-3 shadow-sm border border-primary-200">
                  <User className="w-5 h-5" />
               </div>
               <div>
                  <p className="text-sm font-bold text-primary-900">{selectedCustomer.name}</p>
                  <p className="text-[10px] text-primary-600 font-bold uppercase tracking-wide">Points: {selectedCustomer.loyaltyPoints}</p>
               </div>
            </div>
            <button onClick={onRemoveCustomer} className="text-primary-400 hover:text-red-500 bg-white p-1.5 rounded-xl border border-primary-100 shadow-sm transition-colors">
               <X className="w-4 h-4" />
            </button>
         </div>
      )}

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto px-6 space-y-5 custom-scrollbar py-4">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 opacity-60">
            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-200">
               <ShoppingCart className="w-10 h-10 text-slate-200" />
            </div>
            <div className="text-center">
               <p className="font-bold text-slate-400 text-lg">Empty Cart</p>
               <p className="text-sm">Scan items to begin sale</p>
            </div>
          </div>
        ) : (
          cart.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex gap-4 group animate-slide-in-right" style={{ animationDelay: `${index * 50}ms` }}>
              {/* Vertical Qty Controls */}
              <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl w-10 h-24 shrink-0 border border-slate-100 shadow-sm">
                 <button 
                   onClick={() => updateQuantity(index, 1)} 
                   className="w-full h-1/3 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                 >
                    <Plus className="w-4 h-4" />
                 </button>
                 <span className="text-sm font-black text-slate-900 h-1/3 flex items-center justify-center">{item.quantity}</span>
                 <button 
                   onClick={() => updateQuantity(index, -1)} 
                   disabled={item.quantity <= (item.minOrderQuantity || 1)}
                   className="w-full h-1/3 flex items-center justify-center transition-colors text-slate-400 hover:text-red-500 disabled:opacity-20"
                 >
                    <Minus className="w-4 h-4" />
                 </button>
              </div>

              <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                 <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                       <h4 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug">{item.name}</h4>
                       {item.selectedVariantId && <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md mt-1 inline-block uppercase">Variant</span>}
                    </div>
                    <span className="font-black text-slate-900 text-base shrink-0">{formatPrice(item.sellPrice * item.quantity)}</span>
                 </div>
                 
                 <div className="flex justify-between items-center mt-2">
                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                       {item.sellUnit} @ {formatPrice(item.sellPrice)}
                    </div>
                    <button onClick={() => removeFromCart(index)} className="text-slate-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-xl transition-all">
                       <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer / Totals Section */}
      <div className="bg-white border-t border-slate-100 shadow-[0_-20px_40px_rgba(0,0,0,0.04)] z-20 pb-8 pt-4 px-6">
        <div className="mb-6">
           <button 
              onClick={onDiscountClick} 
              className="w-full py-3.5 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-400 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 transition-all flex justify-between items-center px-4 uppercase tracking-widest"
           >
              <span className="flex items-center"><Tag className="w-4 h-4 mr-2" /> Discount / Promo</span>
              {discount > 0 && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-xl text-xs">-{formatPrice(discount)}</span>}
           </button>
        </div>

        <div className="space-y-3 mb-6">
           <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-slate-600">{formatPrice(subtotal)}</span>
           </div>
           {settings?.tax?.enabled && (
              <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-widest">
                 <span>VAT ({settings.tax.rate}%)</span>
                 <span className="text-slate-600">{formatPrice(tax)}</span>
              </div>
           )}
           <div className="flex justify-between items-end pt-4 border-t border-slate-50">
              <span className="text-lg font-black text-slate-900 uppercase">Total</span>
              <span className="text-5xl font-black text-slate-900 tracking-tighter">{formatPrice(total)}</span>
           </div>
        </div>

        <button 
           onClick={onCheckout} 
           disabled={cart.length === 0}
           className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xl hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-xl shadow-slate-200"
        >
           <span>CHARGE ORDER</span>
           <ChevronRight className="w-6 h-6 ml-2 opacity-50" />
        </button>
      </div>
    </div>
  );
};
