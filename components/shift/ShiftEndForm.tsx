
import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';

interface ShiftEndFormProps {
  onEnd: (endCash: number, notes: string) => void;
  onCancel: () => void;
}

export const ShiftEndForm: React.FC<ShiftEndFormProps> = ({ onEnd, onCancel }) => {
  const [endCash, setEndCash] = useState<string>('0');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEnd(parseFloat(endCash) || 0, notes);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
       <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
          <h4 className="font-bold text-slate-700 mb-2">Closing Register</h4>
          <p className="text-xs text-slate-500">Please count the cash drawer and enter the total amount.</p>
       </div>
       
       <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Closing Cash Amount</label>
          <div className="flex gap-2">
             <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input 
                   type="number" 
                   step="0.01" 
                   min="0"
                   required
                   value={endCash}
                   onChange={(e) => setEndCash(e.target.value)}
                   className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 text-lg font-bold"
                />
             </div>
          </div>
       </div>

       <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Shift Notes</label>
          <textarea 
             value={notes}
             onChange={(e) => setNotes(e.target.value)}
             className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 h-24 resize-none"
             placeholder="Any discrepancies or comments..."
          />
       </div>

       <div className="flex space-x-3 pt-2">
          <button 
             type="button"
             onClick={onCancel}
             className="flex-1 py-3 border border-slate-300 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
          >
             Cancel
          </button>
          <button 
             type="submit"
             className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-md"
          >
             Confirm Clock Out
          </button>
       </div>
    </form>
  );
};
