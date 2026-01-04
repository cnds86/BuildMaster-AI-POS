
import React from 'react';
import { Customer, SystemSettings } from '../../types';
import { ShoppingCart, PauseCircle, X, Minus, Plus, Trash2, Tag, ChevronRight } from 'lucide-react';
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
    <div className="flex flex-col h-full bg-white relative">
      <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center shrink-0 z-10 shadow-sm">
        <div>
           <h3 className="font-black text-slate-900 text-xl tracking-tighter uppercase italic flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-construction-orange" />
              Current Order
           </h3>
           <div className="flex items-center text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
              <span>{cart.reduce((a,c)=>a+c.quantity,0)} Items</span>
              <span className="mx-2">•</span>
              <span>Ticket #{Date.now().toString().slice(-4)}</span>
           </div>
        </div>
        <div className="flex items-center space-x-2">
           <button onClick={onHoldOrder} disabled={cart.length === 0} className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:text-orange-600 hover:bg-orange-50 border border-slate-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed" title="Hold Order">
              <PauseCircle className="w-5 h-5" />
           </button>
           <button onClick={onClose} className="lg:hidden p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all">
              <X className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar bg-slate-50/30">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
            <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-sm">Cart is Empty</p>
            <p className="text-xs text-slate-400 mt-2 text-center max-w-[200px]">Scan items or select from the grid to build an order.</p>
          </div>
        ) : (
          cart.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex gap-3 items-start bg-white p-3 rounded-xl border border-slate-100 shadow-sm animate-slide-in-right group">
              <div className="flex flex-col items-center justify-between bg-slate-100 rounded-lg w-9 h-full py-1 shrink-0">
                 <button onClick={() => updateQuantity(index, 1)} className="p-1 text-slate-600 hover:text-green-600 active:scale-90"><Plus className="w-4 h-4" /></button>
                 <span className="text-sm font-black text-slate-800 my-1">{item.quantity}</span>
                 <button onClick={() => updateQuantity(index, -1)} disabled={item.quantity <= (item.minOrderQuantity || 1)} className="p-1 text-slate-600 hover:text-red-500 disabled:opacity-30 active:scale-90"><Minus className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 min-w-0 py-1">
                 <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-800 text-sm leading-tight pr-2">{item.name}</h4>
                    <span className="font-black text-slate-900 text-sm whitespace-nowrap">{formatPrice(item.sellPrice * item.quantity)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                       {item.sellUnit} @ {formatPrice(item.sellPrice)}
                    </p>
                    <button onClick={() => removeFromCart(index)} className="text-slate-300 hover:text-red-500 transition-colors p-1 -mr-1">
                       <Trash2 className="w-4 h-4"/>
                    </button>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-white border-t border-slate-200 p-5 space-y-4 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-20 shrink-0 pb-safe">
        <button onClick={onDiscountClick} className="w-full py-2.5 px-4 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 uppercase tracking-widest hover:border-slate-400 hover:text-slate-700 transition-all flex justify-between items-center bg-slate-50/50">
           <span className="flex items-center"><Tag className="w-3.5 h-3.5 mr-2" /> Discount / Coupon</span>
           {discount > 0 && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px]">-{formatPrice(discount)}</span>}
        </button>

        <div className="space-y-1.5">
           <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
           </div>
           {tax > 0 && (
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                 <span>Tax</span>
                 <span>{formatPrice(tax)}</span>
              </div>
           )}
           <div className="flex justify-between items-end pt-2 border-t border-slate-100 mt-2">
              <span className="text-sm font-black text-slate-900 uppercase">Total Due</span>
              <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{formatPrice(total)}</span>
           </div>
        </div>

        <button 
           onClick={onCheckout} 
           disabled={cart.length === 0}
           className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] uppercase tracking-wide"
        >
           <span>Checkout</span>
           <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};
