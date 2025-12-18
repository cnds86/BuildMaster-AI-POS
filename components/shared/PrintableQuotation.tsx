
import React from 'react';
import { Quotation, SystemSettings } from '../../types';

interface PrintableQuotationProps {
  quotation: Quotation;
  settings?: SystemSettings;
}

export const PrintableQuotation: React.FC<PrintableQuotationProps> = ({ quotation, settings }) => {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings?.currencySymbol === '₭' ? 'LAK' : settings?.currencySymbol === '฿' ? 'THB' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #printable-receipt { 
            width: 210mm !important; 
            min-height: 297mm !important; 
            padding: 20mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .print-row { flex-direction: row !important; }
          .print-col-2-3 { width: 66.666667% !important; }
          .print-col-1-3 { width: 33.333333% !important; }
          .print-col-1-2 { width: 50% !important; }
          .print-text-right { text-align: right !important; }
          .print-mt-0 { margin-top: 0 !important; }
          .print-mb-8 { margin-bottom: 2rem !important; }
          .print-overflow-visible { overflow: visible !important; }
          
          /* Force Black Borders and Text for Print */
          .print-black-text { color: black !important; }
          .print-black-border { border-color: black !important; }
        }
      `}</style>
      <div 
        id="printable-receipt" 
        className="bg-white p-6 md:p-10 text-sm font-sans text-black mx-auto w-full md:max-w-[210mm] md:min-h-[297mm] flex flex-col print:shadow-none print:border-none"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row print-row justify-between items-start mb-6 md:mb-8 pb-6 border-b-2 border-black">
           <div className="w-full md:w-2/3 print-col-2-3 mb-6 md:mb-0 print-mb-0">
              <div className="flex items-center gap-4 mb-2">
                 {settings?.receiptLogoUrl && (
                    <img src={settings.receiptLogoUrl} alt="Logo" className="h-16 md:h-20 w-auto object-contain" />
                 )}
                 <div>
                    <h2 className="text-xl md:text-2xl font-bold text-black">{settings?.companyName || 'Company Name'}</h2>
                    <p className="text-sm text-black mt-1 whitespace-pre-line">{settings?.address}</p>
                    <p className="text-sm text-black">Tel: {settings?.phone}</p>
                    {settings?.taxId && <p className="text-sm text-black">Tax ID: {settings.taxId}</p>}
                 </div>
              </div>
           </div>
           <div className="w-full md:w-1/3 print-col-1-3 md:text-right print:text-right">
              <h1 className="text-3xl md:text-4xl font-bold text-black uppercase tracking-widest mb-2">Quotation</h1>
              <div className="space-y-1 text-sm bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-lg text-black">
                 <div className="flex justify-between md:justify-end gap-4">
                    <span className="font-bold text-black">REF NO:</span>
                    <span className="font-bold font-mono text-black">{quotation.referenceNo}</span>
                 </div>
                 <div className="flex justify-between md:justify-end gap-4">
                    <span className="font-bold text-black">DATE:</span>
                    <span className="text-black">{new Date(quotation.date).toLocaleDateString()}</span>
                 </div>
                 <div className="flex justify-between md:justify-end gap-4">
                    <span className="font-bold text-black">VALID UNTIL:</span>
                    <span className="text-red-600 font-bold">{new Date(quotation.validUntil).toLocaleDateString()}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Customer & Issuer Info */}
        <div className="flex flex-col md:flex-row print-row justify-between gap-4 md:gap-8 mb-8 text-black">
           <div className="w-full md:w-1/2 print-col-1-2 p-4 bg-slate-50 rounded-lg border border-black print:border-black">
              <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-2">Quotation For (Customer)</h3>
              <p className="font-bold text-lg text-black">{quotation.customerName || 'General Customer'}</p>
              {quotation.customerPhone && <p className="text-sm mt-1 text-black">Tel: {quotation.customerPhone}</p>}
              {quotation.customerAddress && <p className="text-sm mt-1 text-black">{quotation.customerAddress}</p>}
           </div>
           <div className="w-full md:w-1/2 print-col-1-2 p-4 bg-slate-50 rounded-lg border border-black print:border-black">
              <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-2">Prepared By</h3>
              <p className="font-bold text-lg text-black">{quotation.userName || 'Staff'}</p>
              <p className="text-sm mt-1 text-black">{settings?.companyName}</p>
           </div>
        </div>

        {/* Items Table - Explicit Black Colors */}
        <div className="flex-1 overflow-x-auto print-overflow-visible mb-6">
           <table className="w-full border-collapse min-w-[600px] md:min-w-0">
              <thead className="bg-slate-200 print:bg-slate-200 text-black">
                 <tr>
                    <th className="py-3 px-4 text-left border border-black w-12 text-center font-bold text-black print:text-black print:border-black">#</th>
                    <th className="py-3 px-4 text-left border border-black font-bold text-black print:text-black print:border-black">Description</th>
                    <th className="py-3 px-4 text-right border border-black w-24 font-bold text-black print:text-black print:border-black">Qty</th>
                    <th className="py-3 px-4 text-right border border-black w-32 font-bold text-black print:text-black print:border-black">Unit Price</th>
                    <th className="py-3 px-4 text-right border border-black w-32 font-bold text-black print:text-black print:border-black">Amount</th>
                 </tr>
              </thead>
              <tbody className="text-sm text-black">
                 {quotation.items.map((item, i) => (
                    <tr key={i} className="border-b border-black">
                       <td className="py-3 px-4 border-l border-r border-black text-center text-black print:text-black print:border-black">{i + 1}</td>
                       <td className="py-3 px-4 border-l border-r border-black text-black print:text-black print:border-black">
                          <span className="font-bold text-black">{item.name}</span>
                          {item.sellUnit && <span className="text-xs ml-1 text-black">({item.sellUnit})</span>}
                       </td>
                       <td className="py-3 px-4 border-l border-r border-black text-right text-black print:text-black print:border-black">{item.quantity}</td>
                       <td className="py-3 px-4 border-l border-r border-black text-right text-black print:text-black print:border-black">{formatPrice(item.sellPrice)}</td>
                       <td className="py-3 px-4 border-l border-r border-black text-right font-bold text-black print:text-black print:border-black">{formatPrice(item.quantity * item.sellPrice)}</td>
                    </tr>
                 ))}
                 {/* Fill empty rows to look nice on A4 */}
                 {quotation.items.length < 5 && Array.from({ length: 5 - quotation.items.length }).map((_, i) => (
                    <tr key={`empty-${i}`} className="border-b border-black h-12 hidden md:table-row print:table-row">
                       <td className="border-l border-r border-black"></td>
                       <td className="border-l border-r border-black"></td>
                       <td className="border-l border-r border-black"></td>
                       <td className="border-l border-r border-black"></td>
                       <td className="border-l border-r border-black"></td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>

        {/* Totals & Notes */}
        <div className="flex flex-col-reverse md:flex-row print-row gap-8 mb-12 break-inside-avoid text-black">
           <div className="w-full md:flex-1 print-col-2-3">
              <h4 className="font-bold text-sm mb-2 text-black">Terms & Conditions / Notes:</h4>
              <div className="p-4 bg-slate-50 rounded border border-black text-xs h-full text-black print:border-black">
                 {quotation.note ? (
                    <p className="text-black">{quotation.note}</p>
                 ) : (
                    <ul className="list-disc list-inside space-y-1 text-black">
                       <li>This quotation is valid for 7 days from the date of issue.</li>
                       <li>Prices are subject to change without prior notice after the validity period.</li>
                       <li>Goods once sold are not returnable without receipt.</li>
                    </ul>
                 )}
              </div>
           </div>
           <div className="w-full md:w-1/3 print-col-1-3">
              <div className="space-y-2">
                 <div className="flex justify-between text-black">
                    <span>Subtotal</span>
                    <span>{formatPrice(quotation.subtotal)}</span>
                 </div>
                 {quotation.discountAmount > 0 && (
                    <div className="flex justify-between text-black font-bold">
                       <span>Discount</span>
                       <span>-{formatPrice(quotation.discountAmount)}</span>
                    </div>
                 )}
                 {quotation.taxAmount > 0 && (
                    <div className="flex justify-between text-black">
                       <span>Tax</span>
                       <span>{formatPrice(quotation.taxAmount)}</span>
                    </div>
                 )}
                 <div className="flex justify-between font-bold text-xl border-t-2 border-black pt-3 mt-2 text-black">
                    <span>Total</span>
                    <span>{formatPrice(quotation.total)}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Footer Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-2 print-row gap-12 md:gap-20 mt-auto pt-8 break-inside-avoid text-black">
           <div className="text-center">
              <div className="border-b border-black mb-2 h-16 md:h-20"></div>
              <p className="font-bold text-black">Customer Acceptance</p>
              <p className="text-xs text-black">Signature & Date</p>
           </div>
           <div className="text-center">
              <div className="border-b border-black mb-2 h-16 md:h-20 relative">
                 <div className="absolute inset-0 flex items-end justify-center opacity-10 pb-2">
                    <div className="border-4 border-black rounded-full w-20 h-20 md:w-24 md:h-24 flex items-center justify-center -rotate-12">
                       <span className="font-bold text-xs uppercase text-black">Approved</span>
                    </div>
                 </div>
              </div>
              <p className="font-bold text-black">Authorized Signature</p>
              <p className="text-xs text-black">{settings?.companyName}</p>
           </div>
        </div>
      </div>
    </>
  );
};
