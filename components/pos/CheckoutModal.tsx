
import React, { useState, useEffect } from 'react';
import { Customer, SystemSettings } from '../../types';
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
  settings?: SystemSettings;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  total,
  onProcessPayment,
  selectedCustomer,
  isProcessing,
  settings
}) => {
  const { formatPrice } = useGlobal();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'qr' | 'credit'>('cash');
  const [receivedAmountStr, setReceivedAmountStr] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<'method' | 'detail'>('method');

  // Keyboard support for immediate confirm
  const receivedAmount = parseFloat(receivedAmountStr) || 0;
  const change = Math.max(0, receivedAmount - total);

  const handleProcess = () => {
    let finalReceived = paymentMethod === 'cash' || paymentMethod === 'credit' ? receivedAmount : total;
    let finalChange = paymentMethod === 'cash' ? change : 0;
    
    // Auto-fill exact amount for non-cash methods if not set
    if (paymentMethod !== 'cash' && paymentMethod !== 'credit') {
        finalReceived = total;
    }

    onProcessPayment(paymentMethod, finalReceived, finalChange);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
         e.preventDefault();
         // Check validity before submitting
         if (isProcessing) return;
         if (paymentMethod === 'cash' && receivedAmount < total) return;
         if (paymentMethod === 'credit' && receivedAmount > total) return;
         handleProcess();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, paymentMethod, receivedAmount, total, isProcessing]);

  if (!isOpen) return null;

  const selectPaymentMethod = (method: 'cash' | 'card' | 'transfer' | 'qr' | 'credit') => {
    if (method === 'credit' && !selectedCustomer) {
      alert("Credit payment requires a registered customer.");
      return;
    }
    setPaymentMethod(method);
    setReceivedAmountStr(''); // Reset for clean entry
    setCheckoutStep('detail');
  };

  const handleQuickCash = (amount: number) => {
    setReceivedAmountStr(amount.toString());
  };

  const getConfirmButtonText = () => {
    if (isProcessing) return 'Processing...';
    
    if (paymentMethod === 'cash') {
      if (receivedAmount < total) return `Enter Amount (Due: ${formatPrice(total)})`;
      if (change > 0) return `Confirm Pay & Return ${formatPrice(change)}`;
      return `Confirm Payment ${formatPrice(total)}`;
    }
    
    if (paymentMethod === 'credit') {
       const debt = Math.max(0, total - receivedAmount);
       if (receivedAmount > total) return `Amount exceeds total`;
       if (receivedAmount > 0) return `Pay Deposit ${formatPrice(receivedAmount)} (Debt: ${formatPrice(debt)})`;
       return `Confirm Full Credit (Debt: ${formatPrice(total)})`;
    }
  
    return `Confirm Payment ${formatPrice(total)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full h-[100vh] sm:h-[650px] sm:max-w-5xl rounded-t-xl sm:rounded-2xl shadow-2xl flex flex-col sm:flex-row overflow-hidden">
        
        {/* Method Selection Sidebar (Hidden on Mobile if Detail step active) */}
        <PaymentMethodList 
            paymentMethod={paymentMethod}
            onSelect={selectPaymentMethod}
            onClose={onClose}
            total={total}
            selectedCustomer={selectedCustomer}
            className={`${checkoutStep === 'detail' ? 'hidden sm:flex' : 'flex'} h-full sm:h-auto`}
        />

        {/* Detail / Numpad Area (Hidden on Mobile if Method step active) */}
        <div className={`flex-1 bg-white flex flex-col ${checkoutStep === 'method' ? 'hidden sm:flex' : 'flex'} h-full`}>
           <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <button onClick={() => setCheckoutStep('method')} className="sm:hidden flex items-center text-slate-500 font-bold hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg">
                 <ChevronLeft className="w-5 h-5 mr-1" /> Back
              </button>
              <div className="sm:hidden font-bold text-slate-800">Payment</div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                 <X className="w-6 h-6" />
              </button>
           </div>
           
           <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
              <div className="text-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                    {paymentMethod === 'cash' ? <Banknote className="text-blue-600"/> : paymentMethod === 'qr' ? <QrCode className="text-blue-600"/> : paymentMethod === 'credit' ? <FileText className="text-orange-500"/> : <CreditCard className="text-blue-600"/>}
                    {paymentMethod === 'cash' ? 'Cash Payment' : paymentMethod === 'qr' ? 'Scan to Pay' : paymentMethod === 'credit' ? 'Credit / Debt Sale' : 'Digital Payment'}
                 </h3>
              </div>

              {/* Show Numpad for Cash OR Credit */}
              {paymentMethod === 'cash' || paymentMethod === 'credit' ? (
                 <PaymentNumpad 
                    receivedAmountStr={receivedAmountStr}
                    setReceivedAmountStr={setReceivedAmountStr}
                    total={total}
                    change={paymentMethod === 'cash' ? change : 0} 
                    handleQuickCash={handleQuickCash}
                 />
              ) : paymentMethod === 'qr' ? (
                 <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-lg mb-6">
                       {/* Priority: Uploaded QR -> Generated QR -> Placeholder */}
                       {settings?.receiptQrCodeUrl ? (
                          <img src={settings.receiptQrCodeUrl} className="w-56 h-56 md:w-64 md:h-64 object-contain rounded-lg" alt="Shop QR" />
                       ) : (
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=Payment_Total_${total}`} className="w-56 h-56 md:w-64 md:h-64 object-contain rounded-lg" alt="Generated QR" />
                       )}
                    </div>
                    {settings?.receiptQrCodeUrl ? (
                       <p className="text-lg font-bold text-slate-700">Scan Store QR to Pay</p>
                    ) : (
                       <p className="text-lg font-bold text-slate-700">Scan to pay {formatPrice(total)}</p>
                    )}
                    <p className="text-sm text-slate-400 mt-2">
                        {settings?.receiptQrCodeUrl ? 'Confirm amount on your banking app' : 'Dynamic QR Code'}
                    </p>
                 </div>
              ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                       <CreditCard className="w-16 h-16 text-blue-500" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-800 mb-2">
                       Waiting for Terminal
                    </h4>
                    <p className="text-slate-500">Total amount: <strong>{formatPrice(total)}</strong></p>
                 </div>
              )}
           </div>
           <div className="p-4 border-t border-slate-100 bg-white pb-safe">
              <button 
                 onClick={handleProcess}
                 disabled={isProcessing || (paymentMethod === 'cash' && receivedAmount < total) || (paymentMethod === 'credit' && receivedAmount > total)}
                 className={`w-full py-4 rounded-xl font-bold text-xl text-white shadow-lg flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${paymentMethod === 'credit' ? 'bg-orange-600' : 'bg-slate-900 hover:bg-slate-800'}`}
              >
                 {isProcessing ? 'Processing...' : (
                    <>
                       <CheckCircle className="w-6 h-6 mr-2" /> 
                       {getConfirmButtonText()}
                    </>
                 )}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
