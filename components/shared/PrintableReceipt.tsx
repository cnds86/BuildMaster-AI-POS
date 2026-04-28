
import React from 'react';
import { Sale, SystemSettings } from '../../types';
import { MhxIcon } from './MhxLogo';
import { useGlobal } from '../../context/GlobalContext';

interface PrintableReceiptProps {
  sale: Sale;
  settings?: SystemSettings;
  isReprint?: boolean;
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ sale, settings, isReprint }) => {
  const { branches, posMachines } = useGlobal();
  const receiptWidthClass = settings?.receiptPaperSize === '58mm' ? 'print-w-58mm' : settings?.receiptPaperSize === 'A4' ? 'print-w-A4' : 'print-w-80mm';

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings?.currencySymbol === '₭' ? 'LAK' : settings?.currencySymbol === '฿' ? 'THB' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const showTax = settings?.tax?.displayOnReceipt !== false; // Default true if undefined
  const showRounding = settings?.rounding?.displayOnReceipt !== false; 

  const getBranchName = (id?: string) => branches.find(b => b.id === id)?.name || 'Main Branch';
  const getPosName = (id?: string) => posMachines.find(p => p.id === id)?.machineNumber || 'POS-01';

  return (
    <div id="printable-receipt" className={`bg-white p-4 text-xs font-mono text-black flex flex-col items-center mx-auto ${receiptWidthClass} print:shadow-none print:border-none`}>
       {/* Logo */}
       {settings?.receiptLogoUrl ? (
          <img src={settings.receiptLogoUrl} alt="Logo" className="h-12 w-auto mb-2 object-contain" />
       ) : (
          <div className="mb-2 text-slate-800">
             <MhxIcon className="w-12 h-12" />
          </div>
       )}

       <h2 className="font-bold text-center text-lg mb-1">{settings?.companyName || 'MAHAXAY'}</h2>
       <p className="text-center text-[10px] leading-tight mb-1">{settings?.address}</p>
       <p className="text-center text-[10px] leading-tight mb-1">Tel: {settings?.phone}</p>
       {settings?.receiptShowTaxId && settings.taxId && <p className="text-center text-[10px] mt-1">Tax ID: {settings.taxId}</p>}
       
       <div className="w-full border-b border-dashed border-black my-2"></div>
       
       <div className="flex justify-between w-full text-[10px]">
          <span>{new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
          <span>Inv: #{sale.id.slice(-6)}</span>
       </div>
       <div className="flex justify-between w-full text-[10px] mt-1">
          <span>Br: {getBranchName(settings?.currentBranchId)}</span>
          <span>POS: {getPosName(settings?.currentPosId)}</span>
       </div>
       {settings?.receiptShowCashier && (
          <div className="w-full text-left text-[10px] mt-1">Cashier: {sale.userName || 'Admin'}</div>
       )}
       {sale.customerName && <div className="text-left w-full mt-1 text-[10px]">Cust: {sale.customerName}</div>}
       {sale.status === 'voided' && <div className="font-bold w-full text-center mt-1">[ VOIDED ]</div>}

       <div className="w-full border-b border-dashed border-black my-2"></div>
       
       {settings?.receiptHeader && <p className="text-center italic mb-2 font-medium">{settings.receiptHeader}</p>}
      
       <div className="w-full space-y-1 mb-2">
        {sale.items.map((item, i) => (
          <div key={i} className="flex justify-between">
            <span className="truncate w-32">{item.name}</span>
            <span className="text-right">
              {item.quantity} x {formatPrice(item.sellPrice)}
            </span>
            <span className="font-bold text-right w-16">
              {formatPrice(item.quantity * item.sellPrice)}
            </span>
          </div>
        ))}
       </div>
      
       <div className="w-full border-b border-dashed border-black my-2"></div>
      
       <div className="w-full space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(sale.subtotal || sale.total)}</span>
        </div>
        {sale.discountAmount ? (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{formatPrice(sale.discountAmount)}</span>
          </div>
        ) : null}
        
        {sale.taxAmount && sale.taxAmount > 0 && showTax && (
           <div className="flex justify-between">
             <span>Tax</span>
             <span>{formatPrice(sale.taxAmount)}</span>
           </div>
        )}

        {/* Rounding Display - Controlled by Setting */}
        {sale.roundingDifference !== undefined && sale.roundingDifference !== 0 && showRounding && (
           <div className="flex justify-between italic text-[10px]">
             <span>Rounding</span>
             <span>
                {sale.roundingDifference > 0 ? '+' : ''}{formatPrice(sale.roundingDifference)}
             </span>
           </div>
        )}
        
        <div className="flex justify-between font-bold text-sm mt-1 pt-1 border-t border-black">
          <span>TOTAL</span>
          <span>{formatPrice(sale.total)}</span>
        </div>
      </div>

      <div className="w-full border-b border-dashed border-black my-3"></div>

      <div className="w-full space-y-1">
        <div className="flex justify-between">
          <span className="capitalize">Paid via {sale.paymentMethod}</span>
          <span>{formatPrice(sale.amountReceived && sale.amountReceived > 0 ? sale.amountReceived : sale.total)}</span>
        </div>
        
        {(sale.paymentStatus === 'unpaid' || sale.paymentStatus === 'partial') && (
           <div className="flex justify-between font-bold">
              <span>Balance Due</span>
              <span>{formatPrice(sale.remainingAmount || 0)}</span>
           </div>
        )}

        {sale.change !== undefined && sale.change > 0 && (
          <div className="flex justify-between font-bold">
            <span>Change</span>
            <span>{formatPrice(sale.change)}</span>
          </div>
        )}
      </div>

      <div className="w-full border-b border-dashed border-black my-3"></div>

      {settings?.showBankInfoOnReceipt && settings.bankAccounts && settings.bankAccounts.length > 0 && (
         <div className="w-full mb-3 text-[10px] border border-black p-2 rounded">
            <p className="font-bold border-b border-black pb-1 mb-1 text-center">Bank Transfer</p>
            {settings.bankAccounts.map((bank, index) => (
               <div key={bank.id} className={`flex flex-col ${index > 0 ? 'mt-2 pt-2 border-t border-dashed border-black' : ''}`}>
                  <div className="flex justify-between font-bold">
                     <span>{bank.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                     <span>Acc:</span>
                     <span className="font-mono">{bank.accountNumber}</span>
                  </div>
                  <div className="text-[9px] text-gray-600">{bank.accountName}</div>
               </div>
            ))}
         </div>
      )}

      {settings?.receiptFooter && <p className="text-center italic w-full">{settings.receiptFooter}</p>}
      
      {/* QR Code at bottom if configured */}
      {settings?.receiptQrCodeUrl && (
        <div className="mt-3 flex flex-col items-center w-full">
            <img src={settings.receiptQrCodeUrl} alt="QR" className="w-16 h-16 object-contain" />
            <span className="text-[9px] font-bold mt-1">Scan to Pay</span>
        </div>
      )}

      {isReprint && <p className="text-[9px] mt-2 text-slate-500 w-full text-center">*** REPRINT ***</p>}
      <p className="text-[9px] text-center text-slate-400 mt-2 w-full">*** THANK YOU ***</p>
    </div>
  );
};

