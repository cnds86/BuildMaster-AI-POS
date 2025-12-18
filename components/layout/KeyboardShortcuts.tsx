
import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const generalShortcuts = [
    { keys: ['F1'], label: 'Dashboard' },
    { keys: ['F2'], label: 'POS Terminal' },
    { keys: ['F3'], label: 'Inventory' },
    { keys: ['⌘', 'K'], label: 'Global Search' },
    { keys: ['Shift', '?'], label: 'Show Shortcuts' },
  ];

  const posShortcuts = [
    { keys: ['F4'], label: 'Select Customer' },
    { keys: ['F6'], label: 'Recall Order' },
    { keys: ['F8'], label: 'Add Discount' },
    { keys: ['F9'], label: 'Focus Search' },
    { keys: ['F12'], label: 'Checkout / Charge' },
    { keys: ['Esc'], label: 'Close Modal / Clear' },
  ];

  const renderShortcutRow = (sc: { keys: string[], label: string }, idx: number) => (
    <div key={idx} className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-2 -mx-2 rounded-lg transition-colors">
      <span className="text-sm text-slate-600 font-medium">{sc.label}</span>
      <div className="flex space-x-1.5">
          {sc.keys.map((k, j) => (
            <span key={j} className="min-w-[28px] px-2 py-1 bg-white border-b-2 border-slate-200 rounded-md text-xs font-mono font-bold text-slate-600 text-center shadow-sm border border-slate-300">
                {k}
            </span>
          ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
         <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center text-lg">
               <Keyboard className="w-5 h-5 mr-2.5 text-slate-500" />
               Keyboard Shortcuts
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1 border border-slate-200 hover:border-slate-300 shadow-sm"><X className="w-5 h-5" /></button>
         </div>
         
         <div className="p-5 max-h-[70vh] overflow-y-auto">
            <div className="mb-6">
               <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">General Navigation</h4>
               <div className="space-y-0.5">
                  {generalShortcuts.map(renderShortcutRow)}
               </div>
            </div>

            <div>
               <h4 className="text-xs font-bold text-orange-500 uppercase mb-2 tracking-wider">POS Terminal</h4>
               <div className="space-y-0.5">
                  {posShortcuts.map(renderShortcutRow)}
               </div>
            </div>
         </div>
         
         <div className="p-4 bg-slate-50 text-center text-xs text-slate-400 border-t border-slate-100">
            Press <span className="font-bold text-slate-600">Esc</span> to close dialogs
         </div>
      </div>
    </div>
  );
};
