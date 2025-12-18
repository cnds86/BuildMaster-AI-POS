
import React from 'react';
import { Shift, Sale } from '../../../types';
import { DollarSign, Clock } from 'lucide-react';

interface OverviewTabProps {
  shifts: Shift[];
  totalSalesValue: number;
  formatPrice: (val: number) => string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ shifts, totalSalesValue, formatPrice }) => {
  // Sort shifts recent first
  const recentShifts = [...shifts].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 5);

  return (
     <div className="space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-100 shadow-sm">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Total Sales Generated</p>
                    <h3 className="text-2xl font-bold text-slate-800">{formatPrice(totalSalesValue)}</h3>
                 </div>
                 <div className="p-2 bg-white rounded-lg shadow-sm">
                    <DollarSign className="w-5 h-5 text-blue-500" />
                 </div>
              </div>
           </div>
           <div className="bg-gradient-to-br from-orange-50 to-white p-5 rounded-xl border border-orange-100 shadow-sm">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mb-1">Shifts Completed</p>
                    <h3 className="text-2xl font-bold text-slate-800">{shifts.filter(s => s.status === 'Closed').length}</h3>
                 </div>
                 <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Clock className="w-5 h-5 text-orange-500" />
                 </div>
              </div>
           </div>
        </div>

        <div>
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-slate-400" /> Recent Activity
           </h3>
           {recentShifts.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                 <p className="text-slate-400 italic">No recent shifts found.</p>
              </div>
           ) : (
              <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 pl-6 pb-2">
                 {recentShifts.map((shift, idx) => (
                    <div key={shift.id} className="relative">
                       <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${shift.status === 'Open' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                       <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                             <div>
                                <p className="font-bold text-slate-800 text-sm">
                                   {shift.status === 'Open' ? 'Currently On Shift' : 'Completed Shift'}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                   {new Date(shift.startTime).toLocaleDateString()} • {new Date(shift.startTime).toLocaleTimeString()}
                                </p>
                             </div>
                             {shift.endCash && (
                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono font-bold">
                                   {formatPrice(shift.endCash)}
                                </span>
                             )}
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </div>
     </div>
  );
};
