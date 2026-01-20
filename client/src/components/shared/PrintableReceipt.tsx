
import React from 'react';
import { Sale, SystemSettings } from '../../types';
import { MhxIcon } from './MhxLogo';

interface PrintableReceiptProps {
  sale: Sale;
  settings?: SystemSettings;
  isReprint?: boolean;
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ sale, settings, isReprint }) => {
  const receiptWidthClass = settings?.receiptPaperSize === '58mm' ? 'print-w-58mm' : settings?.receiptPaperSize === 'A4' ? 'print-w-A4' : 'print-w-80mm';

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings?.currencySymbol === '₭' ? 'LAK' : settings?.currencySymbol === '฿' ? 'THB' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const showTax = settings?.tax?.displayOnReceipt !== false; 
  const showRounding = settings?.rounding?.displayOnReceipt !== false; 

  // Helper to get branch/pos names (In a real scenario, these might come from the Sale object if stored, or derived from current settings)
  const branchName = settings?.currentBranchId ? 'Main Branch' : 'HQ';
  const posName = settings?.currentPosId ? settings.currentPosId : 'POS-01';

  return (
    <div id="printable-receipt" className={`bg-white p-4 text-xs font-mono text-black mx-auto ${receiptWidthClass} print:shadow-none print:border-none flex flex-col items-center`}>
      
      {/* --- HEADER --- */}
      <div className="flex flex-col items-center mb-2 w-full text-center">
        {settings?.receiptLogoUrl ? (
           <img src={settings.receiptLogoUrl} alt="Logo" className="h-12 w-auto mb-2 object-contain grayscale" />
        ) : (
           <div className="mb-2 text-black">
              <MhxIcon className="w-12 h-12" color="black" />
           </div>
        )}
        
        <h3 className="text-sm font-bold mb-1 uppercase">{settings?.companyName || 'Store Name'}</h3>
        
        <p className="text-[10px] leading-tight text-black mb-1">{settings?.address}</p>
        <p className="text-[10px] leading-tight text-black">Tel: {settings?.phone}</p>
        {settings?.receiptShowTaxId && settings.taxId && <p className="text-[10px] mt-1 text-black">Tax ID: {settings.taxId}</p>}
      </div>
      
      <div className="w-full border-b border-dashed border-black my-2"></div>
      
      {/* --- META INFO --- */}
      <div className="w-full space-y-1 text-[10px] text-black">
        <div className="flex justify-between">
           <span>{new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
           <span className="font-bold">Inv: #{sale.id.slice(-6)}</span>
        </div>
        
        {/* Branch & POS - Adding to match Settings Preview */}
        <div className="flex justify-between">
           <span>Br: {branchName}</span>
           <span>POS: {posName}</span>
        </div>

        {settings?.receiptShowCashier && (
           <div>Cashier: {sale.userName || 'Admin'}</div>
        )}
        
        {sale.customerName && (
           <div className="font-bold">Cust: {sale.customerName}</div>
        )}
        
        {sale.status === 'voided' && <div className="font-bold text-center mt-1 text-sm border-2 border-black p-1 uppercase">[ VOIDED ]</div>}
      </div>

      <div className="w-full border-b border-dashed border-black my-2"></div>
      
      {/* --- HEADER MESSAGE --- */}
      {settings?.receiptHeader && <p className="text-center text-[10px] italic mb-2 w-full text-black">{settings.receiptHeader}</p>}

      {/* --- ITEMS --- */}
      <div className="w-full space-y-1 mb-2 text-[10px] text-black">
        {sale.items.map((item, i) => (
          <div key={i} className="flex justify-between items-start">
            <span className="w-2/3 pr-2 leading-tight">
               {item.name} x{item.quantity}
            </span>
            <span className="font-bold w-1/3 text-right">
              {formatPrice(item.quantity * item.sellPrice)}
            </span>
          </div>
        ))}
      </div>
      
      <div className="w-full border-b border-dashed border-black my-2"></div>
      
      {/* --- TOTALS --- */}
      <div className="w-full space-y-1 text-[10px] text-black">
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

        {sale.roundingDifference !== undefined && sale.roundingDifference !== 0 && showRounding && (
           <div className="flex justify-between italic">
             <span>Rounding</span>
             <span>{sale.roundingDifference > 0 ? '+' : ''}{formatPrice(sale.roundingDifference)}</span>
           </div>
        )}
        
        <div className="flex justify-between font-bold text-sm mt-1 pt-1 border-t border-black">
          <span>TOTAL</span>
          <span>{formatPrice(sale.total)}</span>
        </div>
      </div>

      <div className="w-full border-b border-dashed border-black my-3"></div>

      {/* --- PAYMENTS --- */}
      <div className="w-full space-y-1 text-[10px] text-black">
        <div className="flex justify-between uppercase">
          <span>Paid by {sale.paymentMethod}</span>
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

      {/* --- BANK INFO (Matches Settings Preview) --- */}
      {settings?.showBankInfoOnReceipt && settings.bankAccounts && settings.bankAccounts.length > 0 && (
         <div className="w-full mb-3 text-[10px] border border-black p-2 rounded text-black">
            <p className="font-bold border-b border-black pb-1 mb-1 text-center">Bank Transfer</p>
            {settings.bankAccounts.map((bank, index) => (
               <div key={bank.id} className={`flex flex-col ${index > 0 ? 'mt-2 pt-2 border-t border-dashed border-black' : ''}`}>
                  <div className="font-bold">{bank.bankName}</div>
                  <div className="flex justify-between">
                     <span>Acc:</span>
                     <span className="font-mono">{bank.accountNumber}</span>
                  </div>
                  <div className="text-[9px] italic">{bank.accountName}</div>
               </div>
            ))}
         </div>
      )}

      {/* --- FOOTER --- */}
      <div className="text-center w-full mt-2 text-black">
        {settings?.receiptFooter && <p className="text-[10px] italic mb-2 leading-tight">{settings.receiptFooter}</p>}
        
        {settings?.receiptQrCodeUrl && (
          <div className="flex flex-col items-center my-2">
              <img src={settings.receiptQrCodeUrl} alt="QR" className="w-16 h-16 object-contain grayscale" />
              <span className="text-[9px] font-bold mt-1">Scan to Pay</span>
          </div>
        )}
        
        {isReprint && <p className="text-[9px] font-bold mt-1">*** REPRINT ***</p>}
        <p className="text-[9px] mt-2 font-bold">*** THANK YOU ***</p>
      </div>
    </div>
  );
};
