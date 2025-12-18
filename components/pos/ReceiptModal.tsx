
import React from 'react';
import { Sale, SystemSettings } from '../../types';
import { CheckCircle, X, Printer, Plus } from 'lucide-react';
import { PrintableReceipt } from '../shared/PrintableReceipt';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  settings?: SystemSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, sale, settings }) => {
  if (!isOpen || !sale) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[70] p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
        <div className="p-4 bg-slate-800 text-white flex justify-between items-center print:hidden">
          <h3 className="font-bold flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-green-400" /> Sale Completed</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 bg-slate-50 flex-1 overflow-y-auto max-h-[60vh] print:p-0 print:max-h-none print:overflow-visible">
          <PrintableReceipt sale={sale} settings={settings} />
        </div>

        <div className="p-4 bg-white border-t border-slate-100 flex gap-3 print:hidden">
          <button onClick={() => window.print()} className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 flex items-center justify-center transition-colors">
            <Printer className="w-5 h-5 mr-2" /> Print
          </button>
          <button onClick={onClose} className="flex-1 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 flex items-center justify-center transition-colors">
            <Plus className="w-5 h-5 mr-2" /> New Order
          </button>
        </div>
      </div>
    </div>
  );
};
