
import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import { X, Banknote, QrCode, CreditCard, FileText, ChevronLeft, CheckCircle } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';
import { PaymentMethodList } from './checkout/PaymentMethodList';
import { PaymentNumpad } from './checkout/PaymentNumpad';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onProcessPayment: (method: 'cash' | 'card' | 'transfer' | 'qr' | 'credit', receivedAmount: number, change: number) => Promise<void>;
  selectedCustomer: Customer | null;
  isProcessing: boolean;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen, onClose, total, onProcessPayment, selectedCustomer, isProcessing
}) => {
  const { formatPrice } = useGlobal();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'qr' | 'credit'>('cash');
  const [receivedAmountStr, setReceivedAmountStr] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<'method' | 'detail'>('method');

  const receivedAmount = parseFloat(receivedAmountStr) || 0;
  const change = Math.max(0, receivedAmount - total);

  const handleProcess = () => {
    let finalReceived = paymentMethod === 'cash' || paymentMethod === 'credit' ? receivedAmount : total;
    let finalChange = paymentMethod === 'cash' ? change : 0;
    if (paymentMethod !== 'cash' && paymentMethod !== 'credit') finalReceived = total;
    onProcessPayment(paymentMethod, finalReceived, finalChange);
  };

  useEffect(() => {
    if (!isOpen) {
        setCheckoutStep('method'); // Reset step on close
        setReceivedAmountStr('');
        return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'F12') {
         e.preventDefault();
         if (isProcessing) return;
         if ((paymentMethod === 'cash' || paymentMethod === 'credit') && receivedAmount < total) return;
         handleProcess();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, paymentMethod, receivedAmount, total, isProcessing]);

  if (!isOpen) return null;

  const selectPaymentMethod = (method: 'cash' | 'card' | 'transfer' | 'qr' | 'credit') => {
    if (method === 'credit' && !selectedCustomer) { alert("Customer required for credit"); return; }
    setPaymentMethod(method);
    setReceivedAmountStr('');
    
    // On desktop, we show side-by-side, so no step change needed visually, but conceptually 'detail' panel updates
    // On mobile, we switch view
    if (window.innerWidth < 640) {
        setCheckoutStep('detail');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-5xl sm:rounded-[2.5rem] shadow-2xl flex flex-col sm:flex-row overflow-hidden border border-white/20">
        
        {/* Left Panel: Payment Methods */}
        <div className={`w-full sm:w-80 lg:w-96 bg-slate-50 border-r border-slate-200 flex-col shrink-0 ${checkoutStep === 'detail' ? 'hidden sm:flex' : 'flex'}`}>
            <PaymentMethodList 
                paymentMethod={paymentMethod}
                onSelect={selectPaymentMethod}
                onClose={onClose}
                total={total}
                selectedCustomer={selectedCustomer}
            />
        </div>

        {/* Right Panel: Details & Numpad */}
        <div className={`flex-1 bg-white flex flex-col ${checkoutStep === 'method' ? 'hidden sm:flex' : 'flex'} h-full sm:h-auto`}>
           <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <button onClick={() => setCheckoutStep('method')} className="sm:hidden flex items-center text-slate-500 font-bold text-sm uppercase tracking-wider hover:text-slate-900">
                 <ChevronLeft className="w-5 h-5 mr-1" /> Back
              </button>
              <h3 className="hidden sm:block text-xs font-black text-slate-400 uppercase tracking-widest">Transaction Details</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                 <X className="w-6 h-6" />
              </button>
           </div>
           
           <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col justify-center">
              <div className="text-center mb-6">
                 <div className="inline-flex p-4 rounded-2xl bg-slate-900 text-white shadow-lg mb-3">
                    {paymentMethod === 'cash' ? <Banknote className="w-8 h-8"/> : paymentMethod === 'qr' ? <QrCode className="w-8 h-8"/> : paymentMethod === 'credit' ? <FileText className="w-8 h-8"/> : <CreditCard className="w-8 h-8"/>}
                 </div>
                 <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                    {paymentMethod === 'cash' ? 'Cash Payment' : paymentMethod === 'qr' ? 'Scan QR Code' : paymentMethod === 'credit' ? 'Store Credit' : 'Card Terminal'}
                 </h2>
              </div>

              {paymentMethod === 'cash' || paymentMethod === 'credit' ? (
                 <PaymentNumpad 
                    receivedAmountStr={receivedAmountStr}
                    setReceivedAmountStr={setReceivedAmountStr}
                    total={total}
                    change={paymentMethod === 'cash' ? change : 0}
                    handleQuickCash={(amt) => setReceivedAmountStr(amt.toString())}
                 />
              ) : paymentMethod === 'qr' ? (
                 <div className="flex flex-col items-center justify-center py-6">
                    <div className="bg-white p-4 rounded-3xl border-4 border-slate-100 shadow-xl mb-6 relative">
                       <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=BuildMaster_${total}`} className="w-56 h-56 grayscale contrast-125" alt="QR" />
                       <div className="absolute inset-0 border-2 border-construction-orange/30 rounded-[22px] animate-pulse"></div>
                    </div>
                    <p className="text-lg font-black text-slate-900 uppercase tracking-tight bg-slate-100 px-4 py-2 rounded-xl">
                       Scan to Pay: {formatPrice(total)}
                    </p>
                 </div>
              ) : (
                 <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                       <CreditCard className="w-10 h-10 text-slate-300" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800">Ready for Card</h4>
                    <p className="text-slate-400 text-sm mt-2">Please insert or tap card on terminal</p>
                 </div>
              )}
           </div>

           <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50">
              <button 
                 onClick={handleProcess}
                 disabled={isProcessing || ((paymentMethod === 'cash' || paymentMethod === 'credit') && receivedAmount < total)}
                 className="w-full py-4 sm:py-5 bg-slate-900 text-white rounded-2xl font-black text-xl uppercase tracking-tight shadow-xl shadow-slate-300 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                 {isProcessing ? 'Processing...' : (
                    <>
                       <CheckCircle className="w-6 h-6 mr-3" /> 
                       Charge {formatPrice(total)}
                    </>
                 )}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
