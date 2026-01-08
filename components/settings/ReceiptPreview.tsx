
import React from 'react';
import { SystemSettings, Branch, PosMachine } from '../../types';
import { MhxIcon } from '../shared/MhxLogo';

interface ReceiptPreviewProps {
  settings: SystemSettings;
  branches: Branch[];
  posMachines: PosMachine[];
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ settings, branches, posMachines }) => {
  const getBranchName = (id?: string) => branches.find(b => b.id === id)?.name || 'Main Branch';
  const getPosName = (id?: string) => posMachines.find(p => p.id === id)?.machineNumber || 'POS-01';

  return (
    <div className="bg-slate-200 p-6 rounded-xl flex justify-center items-start min-h-[500px] overflow-hidden border border-slate-300">
      <div 
        className={`bg-white shadow-xl p-4 text-xs font-mono text-slate-800 flex flex-col items-center transition-all duration-300 origin-top ${settings.receiptPaperSize === '58mm' ? 'w-[200px]' : settings.receiptPaperSize === '80mm' ? 'w-[280px]' : 'w-[300px] min-h-[400px]'}`} 
        style={{ transform: settings.receiptPaperSize === 'A4' ? 'scale(0.8)' : 'none' }}
      >
         {/* Logo */}
         {settings.receiptLogoUrl ? (
            <img src={settings.receiptLogoUrl} alt="Logo" className="h-12 w-auto mb-2 object-contain" />
         ) : (
            <div className="mb-2 text-slate-800">
               <MhxIcon className="w-12 h-12" />
            </div>
         )}

         <h3 className="font-bold text-center text-sm mb-1">{settings.companyName || 'MAHAXAY'}</h3>
         <p className="text-center text-[10px] leading-tight text-slate-600 mb-1">{settings.address}</p>
         <p className="text-center text-[10px] leading-tight text-slate-600">Tel: {settings.phone}</p>
         {settings.receiptShowTaxId && settings.taxId && <p className="text-center text-[10px] text-slate-600 mt-1">Tax ID: {settings.taxId}</p>}
         
         <div className="w-full border-b border-dashed border-slate-300 my-2"></div>
         
         <div className="w-full text-[10px] text-slate-500 flex justify-between">
            <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
            <span>Inv: #S-1001</span>
         </div>
         
         {/* Branch & POS Info */}
         <div className="w-full text-[10px] text-slate-500 flex justify-between mt-1">
            <span>Br: {getBranchName(settings.currentBranchId)}</span>
            <span>POS: {getPosName(settings.currentPosId)}</span>
         </div>
         {settings.receiptShowCashier && (
            <div className="w-full text-[10px] text-slate-500 mt-1">Cashier: Admin User</div>
         )}

         <div className="w-full border-b border-dashed border-slate-300 my-2"></div>
         
         {/* Header Msg */}
         {settings.receiptHeader && <p className="text-center italic mb-2 font-medium">{settings.receiptHeader}</p>}

         {/* Mock Items */}
         <div className="w-full space-y-1 mb-2">
            <div className="flex justify-between"><span>Portland Cement x2</span><span>{settings.currencySymbol}130,000</span></div>
            <div className="flex justify-between"><span>Red Brick x100</span><span>{settings.currencySymbol}150,000</span></div>
            <div className="flex justify-between"><span>Rebar 12mm x5</span><span>{settings.currencySymbol}600,000</span></div>
         </div>

         <div className="w-full border-b border-dashed border-slate-300 my-2"></div>
         
         <div className="w-full space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>{settings.currencySymbol}880,000</span></div>
            {settings.tax.enabled && (
               <div className="flex justify-between text-slate-500">
                  <span>Tax ({settings.tax.rate}%)</span>
                  <span>{settings.currencySymbol}{(880000 * (settings.tax.rate/100)).toFixed(0)}</span>
               </div>
            )}
            <div className="flex justify-between font-bold text-sm mt-1 pt-1 border-t border-slate-800">
               <span>TOTAL</span>
               <span>{settings.currencySymbol}{settings.tax.enabled && settings.tax.calculationMode === 'excluded' ? (880000 * (1 + settings.tax.rate/100)).toFixed(0) : '880,000'}</span>
            </div>
         </div>

         <div className="w-full border-b border-dashed border-slate-300 my-3"></div>
         
         {/* Bank Info */}
         {settings.showBankInfoOnReceipt && settings.bankAccounts && settings.bankAccounts.length > 0 && (
            <div className="w-full mb-3 text-[10px] border border-slate-300 p-2 rounded">
               <p className="font-bold border-b border-slate-200 pb-1 mb-1 text-center">Bank Transfer</p>
               {settings.bankAccounts.map((bank, index) => (
                  <div key={bank.id} className={`flex flex-col ${index > 0 ? 'mt-2 pt-2 border-t border-dashed border-slate-200' : ''}`}>
                     <div className="flex justify-between font-bold">
                        <span>{bank.bankName}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-slate-500">Acc:</span>
                        <span className="font-mono">{bank.accountNumber}</span>
                     </div>
                     <div className="text-[9px] text-slate-400">{bank.accountName}</div>
                  </div>
               ))}
            </div>
         )}

         {/* Footer Msg */}
         {settings.receiptFooter && <p className="text-center italic">{settings.receiptFooter}</p>}
         
         {/* QR Code */}
         {settings.receiptQrCodeUrl && (
            <div className="mt-3 flex flex-col items-center">
               <img src={settings.receiptQrCodeUrl} alt="QR" className="w-16 h-16 object-contain" />
               <span className="text-[9px] font-bold mt-1">Scan to Pay</span>
            </div>
         )}
         
         <p className="text-[9px] text-center text-slate-400 mt-2">*** THANK YOU ***</p>
      </div>
    </div>
  );
};
