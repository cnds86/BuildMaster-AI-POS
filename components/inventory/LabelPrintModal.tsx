
import React, { useState } from 'react';
import { Product } from '../../types';
import { X, Printer, Tag } from 'lucide-react';
import { usePrint } from '../../lib/usePrint';
import { IframePrintWarning } from '../shared/IframePrintWarning';

interface LabelPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  formatPrice: (val: number) => string;
}

export const LabelPrintModal: React.FC<LabelPrintModalProps> = ({ isOpen, onClose, product, formatPrice }) => {
  const [settings, setSettings] = useState({ type: 'shelf', quantity: 1, showPrice: true, showSku: true });
  const { showIframeWarning, setShowIframeWarning, handlePrint } = usePrint();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
       <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
             <h3 className="font-bold text-slate-800 flex items-center"><Tag className="w-5 h-5 mr-2 text-slate-500" /> Print Labels</h3>
             <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
          </div>
          
          <IframePrintWarning show={showIframeWarning} onDismiss={() => setShowIframeWarning(false)} />

          <div className="p-6 flex-1 overflow-y-auto">
             <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                   <select className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={settings.type} onChange={e => setSettings({...settings, type: e.target.value})}>
                      <option value="shelf">Shelf Tag</option>
                      <option value="sticker">Sticker</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                   <input type="number" min="1" className="w-full px-3 py-2 border border-slate-300 rounded-lg" value={settings.quantity} onChange={e => setSettings({...settings, quantity: parseInt(e.target.value)||1})} />
                </div>
             </div>
             
             <div className="bg-slate-100 p-4 rounded-xl flex justify-center">
                <div className={`bg-white border shadow-sm p-4 flex flex-col items-center text-center ${settings.type === 'shelf' ? 'w-64 h-40' : 'w-32 h-20 text-xs'}`}>
                   <div className="font-bold truncate w-full mb-1">{product.name}</div>
                   {settings.showPrice && <div className={`${settings.type === 'shelf' ? 'text-2xl' : 'text-lg'} font-bold`}>{formatPrice(product.price)}</div>}
                   {settings.showSku && <div className="text-slate-500 font-mono text-xs">{product.sku}</div>}
                   <div className="w-full bg-slate-800 mt-2 opacity-80 h-6 sm:h-8"></div>
                </div>
             </div>
          </div>
          <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
             <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100">Cancel</button>
             <button onClick={handlePrint} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold flex items-center"><Printer className="w-4 h-4 mr-2" /> Print</button>
          </div>
       </div>
    </div>
  );
};
