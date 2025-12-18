
import React from 'react';
import { Shift, Branch, User } from '../../types';
import { History, MapPin } from 'lucide-react';

interface ShiftHistoryListProps {
  historyShifts: Shift[];
  users: User[];
  branches: Branch[];
  formatPrice: (val: number) => string;
  onGenerateReport: (shift: Shift) => void;
}

export const ShiftHistoryList: React.FC<ShiftHistoryListProps> = ({
  historyShifts, users, branches, formatPrice, onGenerateReport
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-[500px]">
       <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-700 flex items-center">
             <History className="w-5 h-5 mr-2 text-slate-500" />
             Recent Shift History
          </h3>
       </div>
       <div className="overflow-y-auto flex-1 p-0">
          {historyShifts.length === 0 ? (
             <div className="p-8 text-center text-slate-400">No shift history found.</div>
          ) : (
             <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold sticky top-0">
                   <tr>
                      <th className="px-4 py-3">Date / User</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3 text-right">Cash Out</th>
                      <th className="px-4 py-3 text-center">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {historyShifts.map(shift => {
                      const start = new Date(shift.startTime);
                      const end = shift.endTime ? new Date(shift.endTime) : null;
                      const duration = end ? 
                         Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60) * 10) / 10 + ' hrs' : 
                         'Running';
                      
                      const user = users.find(u => u.id === shift.userId);
                      const branch = branches.find(b => b.id === shift.branchId);

                      return (
                         <tr key={shift.id} className="hover:bg-slate-50 transition-colors text-sm">
                            <td className="px-4 py-3">
                               <div className="font-medium text-slate-800">{start.toLocaleDateString()}</div>
                               <div className="text-xs text-slate-500">{user?.name || 'Unknown'}</div>
                               <div className="text-[10px] text-slate-400 flex items-center mt-0.5">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {branch?.name}
                               </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                               {start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
                               {end ? end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '...'}
                               <div className="text-xs text-slate-400 mt-0.5">{duration}</div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                               {shift.endCash !== undefined ? formatPrice(shift.endCash) : '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                               <button 
                                  onClick={() => onGenerateReport(shift)}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-bold underline"
                               >
                                  Report
                               </button>
                            </td>
                         </tr>
                      );
                   })}
                </tbody>
             </table>
          )}
       </div>
    </div>
  );
};
