
import React from 'react';
import { Sale, SystemSettings } from '../../types';

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

  const showTax = settings?.tax?.displayOnReceipt !== false; // Default true if undefined
  // Check newly added setting, default to true if undefined for backward compatibility
  const showRounding = settings?.rounding?.displayOnReceipt !== false; 

  return (
    <div id="printable-receipt" className={`bg-white p-4 text-xs font-mono text-black mx-auto ${receiptWidthClass} print:shadow-none print:border-none`}>
      <div className="text-center mb-4">
        {settings?.receiptLogoUrl && (
           <img src={settings.receiptLogoUrl} alt="Logo" className="h-12 w-auto mx-auto mb-2 object-contain" />
        )}
        <h2 className="text-lg font-bold mb-1">{settings?.companyName || 'Store Name'}</h2>
        <p>{settings?.address}</p>
        <p>{settings?.phone}</p>
        {settings?.receiptShowTaxId && settings.taxId && <p>Tax ID: {settings.taxId}</p>}
        
        <div className="border-b border-dashed border-black my-2"></div>
        
        <div className="flex justify-between">
           <span>Inv: #{sale.id.slice(-6)}</span>
           <span>{new Date(sale.date).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
           <span>Time: {new Date(sale.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
           {settings?.receiptShowCashier && <span>Staff: {sale.userName || 'Admin'}</span>}
        </div>
        {sale.customerName && <div className="text-left mt-1">Cust: {sale.customerName}</div>}
        {sale.status === 'voided' && <div className="font-bold text-center mt-1">[ VOIDED ]</div>}
      </div>
      
      <div className="border-b border-dashed border-black my-2"></div>
      
      <div className="space-y-1 mb-2">
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
      
      <div className="border-b border-dashed border-black my-2"></div>
      
      <div className="space-y-1">
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
          <span>Total</span>
          <span>{formatPrice(sale.total)}</span>
        </div>
      </div>

      <div className="border-b border-dashed border-black my-3"></div>

      <div className="space-y-1">
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

      <div className="mt-6 text-center italic">
        <p className="mb-1">{settings?.receiptHeader}</p>
        <p>{settings?.receiptFooter}</p>
        {isReprint && <p className="text-[9px] mt-2 text-slate-500">*** REPRINT ***</p>}
        
        {/* QR Code at bottom if configured */}
        {settings?.receiptQrCodeUrl && (
          <div className="mt-3 flex flex-col items-center">
              <img src={settings.receiptQrCodeUrl} alt="QR" className="w-16 h-16 object-contain" />
              <span className="text-[9px] font-bold mt-1">Scan to Pay</span>
          </div>
        )}
      </div>
    </div>
  );
};
