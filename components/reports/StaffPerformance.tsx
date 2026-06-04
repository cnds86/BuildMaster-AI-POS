
import React from 'react';
import { Award, Users } from 'lucide-react';
import { EmptyState } from '../ux';

interface StaffPerformanceProps {
  data: {
    id: string;
    name: string;
    revenue: number;
    count: number;
  }[];
  formatPrice: (val: number) => string;
}

export const StaffPerformance: React.FC<StaffPerformanceProps> = ({ data, formatPrice }) => {
  return (
    <div className="space-y-6 animate-fade-in">
       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center">
             <Award className="w-5 h-5 mr-2 text-yellow-500" />
             Top Performing Staff
          </h4>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold">
                   <tr>
                      <th className="px-6 py-4 rounded-l-lg">Rank</th>
                      <th className="px-6 py-4">Staff Name</th>
                      <th className="px-6 py-4 text-center">Transactions</th>
                      <th className="px-6 py-4 text-right">Avg. Ticket</th>
                      <th className="px-6 py-4 text-right rounded-r-lg">Total Revenue</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {data.map((staff, idx) => (
                      <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'}`}>
                               {idx + 1}
                            </div>
                         </td>
                         <td className="px-6 py-4 font-medium text-slate-700">{staff.name}</td>
                         <td className="px-6 py-4 text-center text-slate-600">{staff.count}</td>
                         <td className="px-6 py-4 text-right text-slate-600 font-mono">
                            {formatPrice(staff.count > 0 ? staff.revenue / staff.count : 0)}
                         </td>
                         <td className="px-6 py-4 text-right font-bold text-green-600">
                            {formatPrice(staff.revenue)}
                         </td>
                      </tr>
                   ))}
                   {data.length === 0 && (
                      <tr>
                         <td colSpan={5}>
                            <EmptyState
                               icon={Users}
                               compact
                               title="No staff performance data"
                               description="No sales were recorded in the selected period. Try a wider date range."
                            />
                         </td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};
