
import React, { useState } from 'react';
import { Shift, Branch, PosMachine, User, ShiftSchedule } from '../../types';
import { Clock } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';
import { ShiftActiveState } from './ShiftActiveState';
import { ShiftStartForm } from './ShiftStartForm';
import { ShiftEndForm } from './ShiftEndForm';
import { ShiftHistoryList } from './ShiftHistoryList';

interface ShiftAttendanceProps {
  shifts: Shift[];
  branches: Branch[];
  posMachines: PosMachine[];
  users: User[];
  currentUser: User | null;
  settings: any;
  activeShift: Shift | undefined;
  todaySchedule: ShiftSchedule | undefined;
  historyShifts: Shift[];
  onStartShift: (branchId: string, startCash: number, notes?: string, posId?: string) => void;
  onEndShift: (shiftId: string, endCash: number, notes?: string) => void;
  onAddCashTransaction: (type: 'in' | 'out', amount: number, reason: string) => void;
  onGenerateReport: (shift: Shift) => void;
}

export const ShiftAttendance: React.FC<ShiftAttendanceProps> = ({
  shifts, branches, posMachines, users, currentUser, settings, 
  activeShift, todaySchedule, historyShifts,
  onStartShift, onEndShift, onAddCashTransaction, onGenerateReport
}) => {
  const { formatPrice } = useGlobal();
  const [confirmEnd, setConfirmEnd] = useState(false);
  
  // Internal Transaction Modal State
  const [isTxnOpen, setIsTxnOpen] = useState(false);
  const [txnType, setTxnType] = useState<'in'|'out'>('out');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnReason, setTxnReason] = useState('');

  const currentBranchName = branches.find(b => b.id === currentUser?.branchId || settings.currentBranchId)?.name || 'Unknown Branch';
  const currentPosName = posMachines.find(p => p.id === settings.currentPosId)?.machineNumber || 'Unknown POS';

  const handleStart = (startCash: number, notes: string) => {
    const branchId = currentUser?.branchId || settings.currentBranchId || (branches[0]?.id);
    if (!branchId) return alert("Branch not configured");
    onStartShift(branchId, startCash, notes, settings.currentPosId);
  };

  const handleEnd = (endCash: number, notes: string) => {
    if (!activeShift) return;
    onEndShift(activeShift.id, endCash, notes);
    setConfirmEnd(false);
  };

  const submitCashTxn = () => {
    const amt = parseFloat(txnAmount);
    if (amt > 0 && txnReason) {
      onAddCashTransaction(txnType, amt, txnReason);
      setIsTxnOpen(false);
      setTxnAmount('');
      setTxnReason('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in print:hidden">
      {/* Active Shift Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
         <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center">
               <Clock className="w-5 h-5 mr-2 text-slate-500" />
               Current Status
            </h3>
            {activeShift ? (
               <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  On Duty
               </span>
            ) : (
               <span className="px-3 py-1 bg-slate-200 text-slate-500 rounded-full text-xs font-bold uppercase tracking-wide">
                  Off Duty
               </span>
            )}
         </div>
         
         <div className="p-6">
            {activeShift ? (
               !confirmEnd ? (
                  <ShiftActiveState 
                    activeShift={activeShift}
                    posMachines={posMachines}
                    currentPosId={settings.currentPosId}
                    formatPrice={formatPrice}
                    onTxn={(type) => { setTxnType(type); setIsTxnOpen(true); }}
                    onGenerateReport={onGenerateReport}
                    onEndRequest={() => setConfirmEnd(true)}
                  />
               ) : (
                  <ShiftEndForm 
                    onEnd={handleEnd}
                    onCancel={() => setConfirmEnd(false)}
                  />
               )
            ) : (
               <ShiftStartForm 
                 onStart={handleStart}
                 todaySchedule={todaySchedule}
                 currentBranchName={currentBranchName}
                 currentPosName={currentPosName}
               />
            )}
         </div>
      </div>

      {/* History */}
      <ShiftHistoryList 
        historyShifts={historyShifts}
        users={users}
        branches={branches}
        formatPrice={formatPrice}
        onGenerateReport={onGenerateReport}
      />

      {/* Transaction Modal */}
      {isTxnOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
               <h3 className="font-bold text-slate-800 mb-4">{txnType === 'in' ? 'Pay In (Add Cash)' : 'Pay Out (Remove Cash)'}</h3>
               <input 
                  type="number" 
                  placeholder="Amount" 
                  className="w-full border rounded-lg px-3 py-2 mb-3"
                  value={txnAmount}
                  onChange={e => setTxnAmount(e.target.value)}
                  autoFocus
               />
               <textarea 
                  placeholder="Reason / Reference" 
                  className="w-full border rounded-lg px-3 py-2 mb-4 h-20"
                  value={txnReason}
                  onChange={e => setTxnReason(e.target.value)}
               />
               <div className="flex gap-2">
                  <button onClick={() => setIsTxnOpen(false)} className="flex-1 py-2 border rounded-lg">Cancel</button>
                  <button onClick={submitCashTxn} className="flex-1 py-2 bg-slate-900 text-white rounded-lg">Confirm</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
