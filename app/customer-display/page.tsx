
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
    companyName: 'BuildMaster'
  });

  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

  useEffect(() => {
    // Connect to the broadcast channel
    const channel = new BroadcastChannel('customer_display_channel');
    
    channel.onmessage = (event) => {
      if (event.data) {
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
      <div className="h-screen bg-slate-900 relative overflow-hidden">
        {hasPromos ? (
          <div className="absolute inset-0 z-0">
             {data.activePromotions!.map((promo, idx) => (
                <div 
                  key={promo.id}
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${idx === currentPromoIndex ? 'opacity-50' : 'opacity-0'}`}
                  style={{ backgroundImage: `url(${promo.imageUrl})` }}
                />
             ))}
             <div className="absolute inset-0 bg-black/40" /> {/* Overlay */}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
             <Store className="w-96 h-96 text-white" />
          </div>
        )}

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white p-12 text-center">
          <div className="w-32 h-32 bg-orange-500 rounded-full flex items-center justify-center mb-8 shadow-2xl animate-bounce-slow">
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
      <div className="h-screen bg-green-600 flex flex-col items-center justify-center text-white p-8 text-center">
        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl">
          <CheckCircle className="w-20 h-20 text-green-600" />
        </div>
        <h1 className="text-6xl font-bold mb-4">Thank You!</h1>
        <p className="text-2xl text-green-100 mb-8">Payment Successful</p>
        
        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 min-w-[400px]">
           <div className="flex justify-between text-xl mb-2">
             <span>Total Paid</span>
             <span className="font-bold">${data.total.toFixed(2)}</span>
           </div>
           {data.change !== undefined && data.change > 0 && (
             <div className="flex justify-between text-3xl font-bold mt-4 pt-4 border-t border-white/30">
               <span>Change Due</span>
               <span>${data.change.toFixed(2)}</span>
             </div>
           )}
        </div>
      </div>
    );
  }

  // Active Transaction State
  return (
    <div className="h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      {/* Left: Cart Items */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-200 bg-white">
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center shadow-md">
          <h2 className="text-2xl font-bold flex items-center">
            <ShoppingCart className="w-6 h-6 mr-3" />
            Your Order
          </h2>
          <span className="bg-orange-500 px-3 py-1 rounded-full text-sm font-bold">
            {data.cart.reduce((acc, item) => acc + item.quantity, 0)} Items
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {data.cart.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm animate-fade-in">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-800">{item.name}</h3>
                <p className="text-slate-500">
                  {item.quantity} {item.sellUnit} x ${item.sellPrice.toFixed(2)}
                </p>
              </div>
              <div className="text-xl font-bold text-slate-900">
                ${(item.quantity * item.sellPrice).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Customer Info footer if exists */}
        {data.customer && (
          <div className="p-4 bg-blue-50 border-t border-blue-100 flex items-center justify-between text-blue-900">
             <div className="flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500 fill-current" />
                <span className="font-bold text-lg">{data.customer.name}</span>
             </div>
             {data.customer.level && (
               <span className="bg-blue-200 px-2 py-1 rounded text-xs font-bold text-blue-800">
                 {data.customer.level.name} Member
               </span>
             )}
          </div>
        )}
      </div>

      {/* Right: Totals & Checkout Status */}
      <div className="w-full md:w-[450px] bg-slate-100 flex flex-col p-6 shadow-xl z-10">
        <div className="flex-1 flex flex-col justify-center space-y-6">
           {data.type === 'CHECKOUT' ? (
             <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-orange-100 text-center animate-fade-in">
                {data.paymentMethod === 'qr' ? (
                   <>
                     <h3 className="text-2xl font-bold text-slate-800 mb-4">Scan to Pay</h3>
                     <div className="bg-slate-900 p-4 rounded-xl inline-block mb-4">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=Payment_OnePay_${data.total}`} 
                          alt="QR Code" 
                          className="w-48 h-48 object-contain rounded-lg bg-white"
                        />
                     </div>
                     <p className="text-slate-500">OnePay / Banking App</p>
                   </>
                ) : (
                   <>
                     <h3 className="text-2xl font-bold text-slate-800 mb-2">Payment Processing</h3>
                     <p className="text-slate-500 mb-6">Please follow the instructions on the terminal</p>
                     <div className="text-5xl font-bold text-slate-900 mb-2">${data.total.toFixed(2)}</div>
                     <div className="text-lg font-medium text-orange-600 uppercase tracking-wide">
                        Paying via {data.paymentMethod || 'Cash'}
                     </div>
                   </>
                )}
             </div>
           ) : (
             <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                   <Store className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-xl font-medium text-slate-400">Total Amount Due</h3>
             </div>
           )}
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200">
          <div className="space-y-3 mb-6 text-lg">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>${data.subtotal.toFixed(2)}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Discount</span>
                <span>-${data.discount.toFixed(2)}</span>
              </div>
            )}
            {data.tax > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Tax</span>
                <span>${data.tax.toFixed(2)}</span>
              </div>
            )}
          </div>
          <div className="pt-6 border-t-2 border-dashed border-slate-200">
            <div className="flex justify-between items-end">
              <span className="text-xl font-bold text-slate-700">Total</span>
              <span className="text-6xl font-bold text-slate-900 tracking-tight">${data.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
