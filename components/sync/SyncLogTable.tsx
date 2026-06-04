
import React from 'react';
import { SyncLog } from '../../types';
import { CheckCircle, AlertCircle, Activity } from 'lucide-react';
import { EmptyState } from '../ux';

interface SyncLogTableProps {
  logs: SyncLog[];
}

export const SyncLogTable: React.FC<SyncLogTableProps> = ({ logs }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
       <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-700">Sync Activity Log</h3>
       </div>
       <div className="overflow-y-auto flex-1">
          <table className="w-full text-left">
             <thead className="bg-slate-50 text-slate-500 text-xs uppercase sticky top-0">
                <tr>
                   <th className="px-6 py-3">Time</th>
                   <th className="px-6 py-3">Type</th>
                   <th className="px-6 py-3">Status</th>
                   <th className="px-6 py-3">Details</th>
                   <th className="px-6 py-3 text-right">Duration</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                   <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                         {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded text-xs font-bold ${
                            log.type === 'Auto' ? 'bg-slate-100 text-slate-600' :
                            log.type === 'Manual' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                         }`}>
                            {log.type}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`flex items-center text-sm font-medium ${
                            log.status === 'Success' ? 'text-green-600' : 
                            log.status === 'Failed' ? 'text-red-600' : 'text-orange-600'
                         }`}>
                            {log.status === 'Success' ? <CheckCircle className="w-4 h-4 mr-1.5" /> : 
                             log.status === 'Failed' ? <AlertCircle className="w-4 h-4 mr-1.5" /> : null}
                            {log.status}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                         {log.details}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 font-mono text-right">
                         {log.durationMs}ms
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
          {logs.length === 0 && (
             <tr>
                <td colSpan={5}>
                   <EmptyState
                      icon={Activity}
                      compact
                      title="No sync activity yet"
                      description="Sync events from this device will be logged here. Trigger a manual sync to see logs."
                   />
                </td>
             </tr>
          )}
       </div>
    </div>
  );
};
