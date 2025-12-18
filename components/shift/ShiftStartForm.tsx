
import React, { useState } from 'react';
import { ShiftSchedule } from '../../types';
import { CalendarDays, MapPin, Monitor, DollarSign, PlayCircle } from 'lucide-react';

interface ShiftStartFormProps {
  onStart: (startCash: number, notes: string) => void;
  todaySchedule?: ShiftSchedule;
  currentBranchName: string;
  currentPosName: string;
}

export const ShiftStartForm: React.FC<ShiftStartFormProps> = ({
  onStart, todaySchedule, currentBranchName, currentPosName
}) => {
  const [startCash, setStartCash] = useState<string>('0');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scheduleInfo = todaySchedule ? ` (Scheduled: ${todaySchedule.startTime}-${todaySchedule.endTime})` : '';
    const finalNotes = `${notes}${scheduleInfo}`.trim();
    onStart(parseFloat(startCash) || 0, finalNotes);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      {todaySchedule && (
         <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start text-sm text-blue-700">
            <CalendarDays className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
               <p className="font-bold">Scheduled for Today</p>
               <p className="text-xs mt-1">
                  {todaySchedule.startTime} - {todaySchedule.endTime}
               </p>
               {todaySchedule.note && <p className="text-xs italic mt-1">"{todaySchedule.note}"</p>}
            </div>
         </div>
      )}

      <div>
         <label className="block text-sm font-medium text-slate-700 mb-1">Location / Branch</label>
         <div className="relative">
            <MapPin className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
            <input 
               type="text" 
               disabled
               value={currentBranchName}
               className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 font-medium cursor-not-allowed"
            />
         </div>
         <div className="mt-2 flex items-center text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
            <Monitor className="w-3.5 h-3.5 mr-2 text-blue-500" />
            <span>
               POS ID: <span className="font-bold font-mono text-slate-700">{currentPosName}</span>
            </span>
         </div>
      </div>

      <div>
         <label className="block text-sm font-medium text-slate-700 mb-1">Opening Cash Amount</label>
         <div className="relative">
            <DollarSign className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
            <input 
               type="number" 
               step="0.01" 
               min="0"
               required
               value={startCash}
               onChange={(e) => setStartCash(e.target.value)}
               className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 font-bold"
            />
         </div>
      </div>

      <div>
         <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
         <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 h-20 resize-none"
            placeholder="e.g. Register 2"
         />
      </div>

      <button 
         type="submit"
         className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg flex items-center justify-center"
      >
         <PlayCircle className="w-6 h-6 mr-2" />
         Start Shift (Clock In)
      </button>
    </form>
  );
};
