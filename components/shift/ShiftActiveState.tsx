
import React from 'react';
import { Shift, PosMachine } from '../../types';
import { Clock, Monitor, Briefcase, ArrowDownCircle, ArrowUpCircle, FileText, StopCircle } from 'lucide-react';

interface ShiftActiveStateProps {
  activeShift: Shift;
  posMachines: PosMachine[];
  currentPosId?: string;
  formatPrice: (amount: number) => string;
  onTxn: (type: 'in' | 'out') => void;
  onGenerateReport: (shift: Shift) => void;
  onEndRequest: () => void;
}

export const ShiftActiveState: React.FC<ShiftActiveStateProps> = ({
  activeShift, posMachines, currentPosId, formatPrice, onTxn, onGenerateReport, onEndRequest
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex items-center justify-between">
          <div>
             <p className="text-sm text-slate-500 mb-1">Started At</p>
             <p className="text-xl font-bold text-slate-800">
                {new Date(activeShift.startTime).toLocaleTimeString()}
             </p>
             <p className="text-xs text-slate-400">
                {new Date(activeShift.startTime).toLocaleDateString()}
             </p>
          </div>
          <div className="text-right">
             <p className="text-sm text-slate-500 mb-1">Opening Cash</p>
             <p className="text-xl font-bold text-green-600">
                {formatPrice(activeShift.startCash)}
             </p>
          </div>
       </div>

       <div className="bg-blue-50 p-3 rounded-lg flex items-center border border-blue-100">
          <Monitor className="w-5 h-5 text-blue-600 mr-2" />
          <div>
             <p className="text-xs text-blue-500 font-bold uppercase">Active POS Terminal</p>
             <p className="text-sm font-bold text-slate-700">
                {activeShift.posId 
                   ? (posMachines.find(p => p.id === activeShift.posId)?.machineNumber || activeShift.posId)
                   : (currentPosId ? posMachines.find(p => p.id === currentPosId)?.machineNumber : 'Unknown')
                }
             </p>
          </div>
       </div>
       
       <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <h4 className="font-bold text-slate-700 mb-3 flex items-center text-sm">
             <Briefcase className="w-4 h-4 mr-2" /> Drawer Operations
          </h4>
          <div className="grid grid-cols-2 gap-3">
             <button 
                onClick={() => onTxn('in')}
                className="flex items-center justify-center px-4 py-2 bg-white border border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition-colors font-medium text-sm shadow-sm"
             >
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                Add Cash
             </button>
             <button 
                onClick={() => onTxn('out')}
                className="flex items-center justify-center px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm shadow-sm"
             >
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                Pay Out
             </button>
          </div>
       </div>

       <div className="flex gap-3">
          <button 
             onClick={() => onGenerateReport(activeShift)}
             className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center"
          >
             <FileText className="w-5 h-5 mr-2" />
             X-Report
          </button>
          <button 
              onClick={onEndRequest}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg flex items-center justify-center"
          >
              <StopCircle className="w-6 h-6 mr-2" />
              End Shift
          </button>
       </div>
    </div>
  );
};
