
'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingCart, Star, CheckCircle, QrCode, Store, Lock, Image as ImageIcon } from 'lucide-react';
import { CartItem, Customer, CustomerDisplaySettings, Promotion } from '../../types';

// Define the data structure received from the POS
interface DisplayData {
  type: 'UPDATE' | 'CHECKOUT' | 'SUCCESS' | 'RESET';
  cart: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  customer?: Customer | null;
  paymentMethod?: string;
  amountReceived?: number;
  change?: number;
  companyName?: string;
  settings?: CustomerDisplaySettings;
  activePromotions?: Promotion[];
}

export default function CustomerDisplayPage() {
  const [data, setData] = useState<DisplayData>({
    type: 'RESET',
    cart: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    companyName: 'MAHAXAY'
  });

  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

  // Simple formatter since we don't have full context access here easily without provider wrapping,
  // but we can infer from locale or just format basic number.
  // Ideally, the POS should send pre-formatted strings, but we'll try to match the style.
  const formatPrice = (amount: number) => {
     return new Intl.NumberFormat('lo-LA', {
        style: 'currency',
        currency: 'LAK', // Default to Kip for this display as requested
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
     }).format(amount);
  };

  useEffect(() => {
    // Connect to the broadcast channel
    const channel = new BroadcastChannel('customer_display_channel');
    
    // Request initial state from POS when mounted
    channel.postMessage({ type: 'REQUEST_INITIAL_STATE' });

    channel.onmessage = (event) => {
      if (event.data && event.data.type !== 'REQUEST_INITIAL_STATE') {
        setData(prev => ({
          ...prev,
          ...event.data,
          // Preserve settings if not provided in update
          settings: event.data.settings || prev.settings,
          activePromotions: event.data.activePromotions || prev.activePromotions
        }));
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  // Carousel Logic
  useEffect(() => {
    if (data.activePromotions && data.activePromotions.length > 1) {
      const interval = setInterval(() => {
        setCurrentPromoIndex(prev => (prev + 1) % data.activePromotions!.length);
      }, (data.settings?.promotionInterval || 5) * 1000);
      return () => clearInterval(interval);
    }
  }, [data.activePromotions, data.settings?.promotionInterval]);

  // Disabled State
  if (data.settings && data.settings.enabled === false) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
        <Lock className="w-16 h-16 mb-4 opacity-50" />
        <h1 className="text-2xl font-bold">Display Closed</h1>
      </div>
    );
  }

  // Idle State (Welcome Screen / Promotions)
  if (data.cart.length === 0 && data.type === 'RESET') {
    const hasPromos = data.activePromotions && data.activePromotions.length > 0;

    return (
      <div className="h-screen bg-slate-900 relative overflow-hidden font-sans">
        {hasPromos ? (
          <div className="absolute inset-0 z-0">
             {data.activePromotions!.map((promo, idx) => (
                <div 
                  key={promo.id}
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${idx === currentPromoIndex ? 'opacity-50' : 'opacity-0'}`}
                  style={{ backgroundImage: `url(${promo.imageUrl})` }}
                />
             ))}
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" /> 
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
             <Store className="w-96 h-96 text-white" />
          </div>
        )}

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white p-12 text-center">
          <div className="w-32 h-32 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center mb-8 shadow-2xl animate-pulse">
            <Store className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-6xl font-bold mb-6 drop-shadow-lg tracking-tight">
            {data.companyName}
          </h1>
          <p className="text-2xl text-slate-200 max-w-2xl leading-relaxed drop-shadow-md">
            {data.settings?.welcomeMessage || "Welcome! We are ready to serve you."}
          </p>
        </div>
      </div>
    );
  }

  // Success State
  if (data.type === 'SUCCESS') {
    return (
      <div className="h-screen bg-green-600 flex flex-col items-center justify-center text-white p-8 text-center font-sans relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
           <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white blur-3xl"></div>
           <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-white blur-3xl"></div>
        </div>
        
        <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl z-10 animate-bounce">
          <CheckCircle className="w-24 h-24 text-green-600" />
        </div>
        <h1 className="text-6xl font-bold mb-4 z-10">Thank You!</h1>
        <p className="text-2xl text-green-100 mb-8 z-10">Payment Successful</p>
        
        <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-10 min-w-[450px] z-10 shadow-xl">
           <div className="flex justify-between text-xl mb-4 text-green-50">
             <span>Total Amount</span>
             <span className="font-bold text-white text-2xl">{formatPrice(data.total)}</span>
           </div>
           <div className="border-t border-white/30 my-4"></div>
           {data.change !== undefined && data.change > 0 && (
             <div className="flex justify-between items-center">
               <span className="text-green-50 text-2xl">Change Due</span>
               <span className="text-5xl font-bold text-white">{formatPrice(data.change)}</span>
             </div>
           )}
        </div>
      </div>
    );
  }

  // Active Transaction State
  return (
    <div className="h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Left: Cart Items */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-200 bg-white">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shadow-md z-10">
          <h2 className="text-2xl font-bold flex items-center">
            <ShoppingCart className="w-7 h-7 mr-3 text-orange-500" />
            Your Order
          </h2>
          <span className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
            {data.cart.reduce((acc, item) => acc + item.quantity, 0)} Items
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {data.cart.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex justify-between items-center p-5 bg-white rounded-2xl border border-slate-100 shadow-sm animate-fade-in transition-all hover:shadow-md">
              <div className="flex items-center flex-1">
                 {item.imageUrl ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-100 mr-4 shrink-0">
                       <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                 ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center mr-4 text-slate-300 shrink-0">
                       <ImageIcon className="w-8 h-8" />
                    </div>
                 )}
                 <div>
                    <h3 className="text-lg font-bold text-slate-800 line-clamp-2">{item.name}</h3>
                    <p className="text-slate-500 font-medium mt-1">
                      {item.quantity} {item.sellUnit} <span className="text-xs text-slate-400">@ {formatPrice(item.sellPrice)}</span>
                    </p>
                 </div>
              </div>
              <div className="text-xl font-bold text-slate-900 pl-4">
                {formatPrice(item.quantity * item.sellPrice)}
              </div>
            </div>
          ))}
        </div>

        {/* Customer Info footer if exists */}
        {data.customer && (
          <div className="p-5 bg-blue-50 border-t border-blue-100 flex items-center justify-between text-blue-900">
             <div className="flex items-center">
                <div className="p-2 bg-white rounded-full shadow-sm mr-3">
                   <Star className="w-5 h-5 text-yellow-500 fill-current" />
                </div>
                <div>
                   <span className="font-bold text-lg block">{data.customer.name}</span>
                   {data.customer.level && (
                     <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                       {data.customer.level.name} Member
                     </span>
                   )}
                </div>
             </div>
             {data.discount > 0 && (
                <div className="text-right">
                   <p className="text-xs text-blue-600 uppercase font-bold">You Saved</p>
                   <p className="text-xl font-bold text-green-600">{formatPrice(data.discount)}</p>
                </div>
             )}
          </div>
        )}
      </div>

      {/* Right: Totals & Checkout Status */}
      <div className="w-full md:w-[480px] bg-white flex flex-col shadow-2xl z-20">
        <div className="flex-1 flex flex-col justify-center p-8 bg-slate-50">
           {data.type === 'CHECKOUT' ? (
             <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-red-500"></div>
                {data.paymentMethod === 'qr' ? (
                   <>
                     <h3 className="text-2xl font-bold text-slate-800 mb-6">Scan to Pay</h3>
                     <div className="bg-white border-2 border-slate-100 p-4 rounded-2xl inline-block mb-6 shadow-sm">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=Payment_OnePay_${data.total}`} 
                          alt="QR Code" 
                          className="w-56 h-56 object-contain rounded-lg"
                        />
                     </div>
                     <p className="text-slate-500 font-medium">Use your banking app to scan</p>
                   </>
                ) : (
                   <>
                     <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600">
                        <ShoppingCart className="w-10 h-10" />
                     </div>
                     <h3 className="text-2xl font-bold text-slate-800 mb-2">Proceeding to Payment</h3>
                     <p className="text-slate-500 mb-8">Please follow instructions on the terminal</p>
                     
                     <div className="bg-slate-100 rounded-xl p-4 mb-4">
                        <div className="text-sm text-slate-500 uppercase tracking-wide font-bold mb-1">Total Due</div>
                        <div className="text-5xl font-bold text-slate-900">{formatPrice(data.total)}</div>
                     </div>
                     
                     <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-200 text-slate-700 font-bold text-sm uppercase">
                        Pay via {data.paymentMethod || 'Cash'}
                     </div>
                   </>
                )}
             </div>
           ) : (
             <div className="text-center space-y-6 opacity-50">
                <div className="w-32 h-32 bg-slate-200 rounded-full flex items-center justify-center mx-auto">
                   <Store className="w-16 h-16 text-slate-400" />
                </div>
                <h3 className="text-2xl font-medium text-slate-400">Total Amount Due</h3>
             </div>
           )}
        </div>

        <div className="bg-white p-8 border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-slate-600 text-lg">
              <span>Subtotal</span>
              <span className="font-medium">{formatPrice(data.subtotal)}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between text-green-600 text-lg font-medium">
                <span>Discount</span>
                <span>-{formatPrice(data.discount)}</span>
              </div>
            )}
            {data.tax > 0 && (
              <div className="flex justify-between text-slate-500 text-lg">
                <span>Tax</span>
                <span>{formatPrice(data.tax)}</span>
              </div>
            )}
          </div>
          <div className="pt-6 border-t-2 border-dashed border-slate-200">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold text-slate-700">Total</span>
              <span className="text-7xl font-bold text-slate-900 tracking-tighter leading-none">{formatPrice(data.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
