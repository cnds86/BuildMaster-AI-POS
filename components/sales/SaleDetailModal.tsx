
import React, { useState } from 'react';
import { Sale, SystemSettings } from '../../types';
import { XCircle, RotateCcw, Wallet, DollarSign, Reply, Ban, Printer, CheckCircle, CreditCard, Banknote, QrCode, Truck } from 'lucide-react';
import { PrintableReceipt } from '../shared/PrintableReceipt';
import { DeliveryFormModal } from '../delivery/DeliveryFormModal';
import { useDeliveryStore } from '../../store/useDeliveryStore';
import { usePrint } from '../../lib/usePrint';
import { IframePrintWarning } from '../shared/IframePrintWarning';

interface SaleDetailModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  onVoid: () => void;
  onSettleDebt: (amount: number, method: string) => Promise<void>;
  onReturn: (items: { itemIndex: number, quantity: number }[]) => Promise<void>;
  settings?: SystemSettings;
  formatPrice: (amount: number) => string;
  isAdminOrManager: boolean;
}

export const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ 
  sale, isOpen, onClose, onVoid, onSettleDebt, onReturn, settings, formatPrice, isAdminOrManager 
}) => {
  const [isReturnMode, setIsReturnMode] = useState(false);
  const [isSettleMode, setIsSettleMode] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});
  
  const { addDelivery } = useDeliveryStore();
  const { showIframeWarning, setShowIframeWarning, handlePrint } = usePrint();

  // Settle Debt State
  const [settleAmountStr, setSettleAmountStr] = useState('');
  const [settleMethod, setSettleMethod] = useState<'cash' | 'transfer' | 'qr'>('cash');

  if (!isOpen || !sale) return null;

  const handleReturnQtyChange = (index: number, qty: number) => {
    const max = sale.items[index].quantity || 0;
    const val = Math.min(Math.max(0, qty), max);
    setReturnQuantities(prev => ({ ...prev, [index]: val }));
  };

  const calculateReturnTotal = () => {
    return sale.items.reduce((acc, item, index) => {
      const qty = returnQuantities[index] || 0;
      return acc + (item.sellPrice * qty);
    }, 0);
  };

  const handleSubmitReturn = async () => {
    const itemsToReturn = Object.entries(returnQuantities)
      .filter(([_, qty]) => (qty as number) > 0)
      .map(([index, quantity]) => ({ itemIndex: parseInt(index), quantity: quantity as number }));

    if (itemsToReturn.length === 0) {
      alert("Please select at least one item to return.");
      return;
    }

    if (confirm(`Confirm refund of ${formatPrice(calculateReturnTotal())}? This will restore stock.`)) {
      await onReturn(itemsToReturn);
      setIsReturnMode(false);
      setReturnQuantities({});
      onClose();
    }
  };

  const toggleReturnMode = () => {
    setIsReturnMode(!isReturnMode);
    setReturnQuantities({});
    setIsSettleMode(false);
  };

  const toggleSettleMode = () => {
    setIsSettleMode(!isSettleMode);
    setSettleAmountStr((sale.remainingAmount || sale.total).toString());
    setIsReturnMode(false);
  };

  const handleSettleSubmit = async () => {
     const amount = parseFloat(settleAmountStr);
     const debt = sale.remainingAmount || sale.total;
     
     if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
     }
     
     if (amount > debt) {
        alert("Amount cannot exceed total debt.");
        return;
     }

     await onSettleDebt(amount, settleMethod);
     setIsSettleMode(false);
     onClose();
  };

  // Format Date for UI (e.g. 14/12/2025, 23:24:50)
  const formattedDate = new Date(sale.date).toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:static print:block backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start bg-white print:hidden shrink-0">
          <div>
             <h3 className="text-xl font-bold text-slate-900">
                {isReturnMode ? 'Select Items to Return' : isSettleMode ? 'Settle Debt' : 'Invoice Details'}
             </h3>
             <p className="text-sm text-slate-500 font-medium mt-1">#{sale.id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        
        <IframePrintWarning show={showIframeWarning} onDismiss={() => setShowIframeWarning(false)} />

        {/* Screen View */}
        <div className="p-6 overflow-y-auto flex-1 bg-white print:hidden">
           
           {/* Normal View Header Info */}
           {!isReturnMode && !isSettleMode && (
              <div className="grid grid-cols-2 gap-y-4 text-sm mb-8">
                 <div>
                    <span className="text-slate-500 block mb-1">Date:</span>
                    <span className="font-medium text-slate-700">{formattedDate}</span>
                 </div>
                 <div className="text-right">
                    <span className="text-slate-500 block mb-1">Method:</span>
                    <span className="font-medium text-slate-700 capitalize">{sale.paymentMethod}</span>
                 </div>
                 <div>
                    <span className="text-slate-500 block mb-1">Customer:</span>
                    <span className="font-medium text-slate-700">{sale.customerName || 'Walk-in'}</span>
                 </div>
                 <div className="text-right">
                    <span className="text-slate-500 block mb-1">Status:</span>
                    <span className={`font-bold capitalize ${sale.paymentStatus === 'paid' ? 'text-green-600' : sale.status === 'voided' ? 'text-red-600' : 'text-orange-600'}`}>
                       {sale.status === 'voided' ? 'Voided' : sale.paymentStatus || 'Paid'}
                    </span>
                 </div>
                 
                 {/* Delivery Info */}
                 {useDeliveryStore.getState().deliveries.find(d => d.saleId === sale.id) && (
                   <div className="col-span-2 mt-2 p-3 bg-indigo-50 rounded-lg flex justify-between items-center border border-indigo-100">
                     <div className="flex items-center text-indigo-800">
                       <Truck className="w-4 h-4 mr-2" />
                       <span className="font-medium text-sm">Delivery Scheduled</span>
                     </div>
                     <span className="text-xs font-bold px-2 py-1 bg-white text-indigo-700 rounded border border-indigo-200">
                       {useDeliveryStore.getState().deliveries.find(d => d.saleId === sale.id)?.status}
                     </span>
                   </div>
                 )}
              </div>
           )}

           {/* SETTLE DEBT MODE */}
           {isSettleMode && (
              <div className="space-y-6">
                 <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-center">
                    <p className="text-sm text-orange-600 font-bold uppercase tracking-wider mb-1">Total Outstanding</p>
                    <p className="text-3xl font-bold text-orange-800">{formatPrice(sale.remainingAmount || sale.total)}</p>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Payment Amount</label>
                    <div className="relative">
                       <DollarSign className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                       <input 
                          type="number"
                          value={settleAmountStr}
                          onChange={(e) => setSettleAmountStr(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 text-lg font-bold"
                          placeholder="0.00"
                          autoFocus
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                    <div className="grid grid-cols-3 gap-3">
                       <button 
                          onClick={() => setSettleMethod('cash')}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${settleMethod === 'cash' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                       >
                          <Banknote className="w-6 h-6 mb-1" />
                          <span className="text-xs font-bold">Cash</span>
                       </button>
                       <button 
                          onClick={() => setSettleMethod('transfer')}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${settleMethod === 'transfer' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                       >
                          <CreditCard className="w-6 h-6 mb-1" />
                          <span className="text-xs font-bold">Transfer</span>
                       </button>
                       <button 
                          onClick={() => setSettleMethod('qr')}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${settleMethod === 'qr' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                       >
                          <QrCode className="w-6 h-6 mb-1" />
                          <span className="text-xs font-bold">QR / App</span>
                       </button>
                    </div>
                 </div>
              </div>
           )}

           {/* ITEM LIST (Default or Return Mode) */}
           {!isSettleMode && (
              <div className="mb-6">
                 <table className="w-full text-sm">
                    <thead>
                       <tr className="text-slate-800 border-b border-slate-100">
                          {isReturnMode && <th className="font-bold py-3 w-16 text-left">Ret.</th>}
                          <th className="font-bold text-left py-3">Item</th>
                          <th className="font-bold text-center py-3 w-16">Qty</th>
                          <th className="font-bold text-right py-3 w-24">Price</th>
                          <th className="font-bold text-right py-3 w-24">Total</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {sale.items.map((item, idx) => (
                          <tr key={idx} className={returnQuantities[idx] > 0 ? 'bg-red-50' : ''}>
                             {isReturnMode && (
                                <td className="py-3 pr-2">
                                   <input 
                                      type="number" 
                                      min="0" 
                                      max={item.quantity}
                                      value={returnQuantities[idx] || 0}
                                      onChange={(e) => handleReturnQtyChange(idx, parseInt(e.target.value) || 0)}
                                      className="w-14 border border-slate-300 rounded p-1 text-center font-bold"
                                   />
                                </td>
                             )}
                             <td className="py-3 pr-2 align-top">
                                <div className="font-medium text-slate-800">{item.name}</div>
                                {item.selectedVariantId && (
                                   <div className="text-xs text-slate-400 mt-0.5">Variant</div>
                                )}
                                {item.sellUnit && item.sellUnit !== 'unit' && (
                                   <div className="text-xs text-slate-400 mt-0.5">{item.sellUnit}</div>
                                )}
                             </td>
                             <td className="py-3 text-center align-top text-slate-600">{item.quantity}</td>
                             <td className="py-3 text-right align-top text-slate-600">{formatPrice(item.sellPrice)}</td>
                             <td className="py-3 text-right align-top font-bold text-slate-800">{formatPrice(item.sellPrice * item.quantity)}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           )}

           {/* TOTALS (Default View) */}
           {!isReturnMode && !isSettleMode && (
               <div className="space-y-3 border-t border-slate-100 pt-4 mb-8">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                     <span>Subtotal</span>
                     <span className="text-slate-800">{formatPrice(sale.subtotal || sale.total)}</span>
                  </div>
                  {(sale.discountAmount || 0) > 0 && (
                    <div className="flex justify-between items-center text-sm font-medium text-green-600">
                       <span>Discount</span>
                       <span>-{formatPrice(sale.discountAmount || 0)}</span>
                    </div>
                  )}
                  {sale.taxAmount && sale.taxAmount > 0 && (
                    <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                       <span>Tax</span>
                       <span>{formatPrice(sale.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xl font-bold text-slate-900 pt-2">
                     <span>Grand Total</span>
                     <span>{formatPrice(Math.abs(sale.total))}</span>
                  </div>
               </div>
           )}

           {/* RETURN MODE TOTAL */}
           {isReturnMode && (
              <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-xl flex justify-between items-center border border-red-100">
                 <span className="font-bold">Refund Total</span>
                 <span className="text-xl font-bold">{formatPrice(calculateReturnTotal())}</span>
              </div>
           )}

           {/* ACTIONS - Main Buttons Row */}
           {!isReturnMode && !isSettleMode && (
              <>
                 {(sale.paymentStatus === 'unpaid' || sale.paymentStatus === 'partial') && sale.status !== 'voided' && (
                    <button
                       onClick={toggleSettleMode}
                       className="w-full mb-4 py-3 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 shadow-sm flex items-center justify-center transition-colors"
                    >
                       <DollarSign className="w-4 h-4 mr-1" />
                       Settle Outstanding Debt
                    </button>
                 )}

                 {sale.status !== 'voided' && sale.type !== 'return' && isAdminOrManager && (
                    <div className="grid grid-cols-3 gap-4 mb-2">
                       <button 
                          onClick={toggleReturnMode}
                          className="py-3 px-4 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50 flex items-center justify-center transition-colors"
                       >
                          <Reply className="w-4 h-4 mr-2" /> RETURN
                       </button>
                       <button 
                          onClick={() => setIsDeliveryModalOpen(true)}
                          className="py-3 px-4 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-100 flex items-center justify-center transition-colors"
                       >
                          <Truck className="w-4 h-4 mr-2" /> DELIVERY
                       </button>
                       <button 
                          onClick={onVoid}
                          className="py-3 px-4 bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-700 flex items-center justify-center transition-colors shadow-sm"
                       >
                          <Ban className="w-4 h-4 mr-2" /> VOID
                       </button>
                    </div>
                 )}
              </>
           )}
        </div>

        {/* --- PRINTABLE RECEIPT SECTION (Visible only in Print) --- */}
        <div className="hidden print:block">
           <PrintableReceipt sale={sale} settings={settings} isReprint={true} />
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex justify-end space-x-3 bg-white print:hidden shrink-0">
           {isReturnMode ? (
              <>
                 <button 
                    onClick={toggleReturnMode}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50"
                 >
                    Cancel Return
                 </button>
                 <button 
                    onClick={handleSubmitReturn}
                    className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-sm"
                 >
                    Confirm Refund
                 </button>
              </>
           ) : isSettleMode ? (
              <>
                 <button 
                    onClick={toggleSettleMode}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50"
                 >
                    Cancel
                 </button>
                 <button 
                    onClick={handleSettleSubmit}
                    className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-sm flex items-center"
                 >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Payment
                 </button>
              </>
           ) : (
              <>
                 <button 
                    onClick={handlePrint}
                    className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 flex items-center transition-colors shadow-sm"
                 >
                    <Printer className="w-4 h-4 mr-2" />
                    Reprint Bill
                 </button>
                 <button 
                    onClick={onClose}
                    className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                 >
                    Close
                 </button>
              </>
           )}
        </div>
      </div>

      <DeliveryFormModal 
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        sale={sale}
        onSubmit={(delivery) => {
          addDelivery(delivery);
          alert('Delivery scheduled successfully!');
        }}
      />
    </div>
  );
};
