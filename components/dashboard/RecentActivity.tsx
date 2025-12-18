
import React from 'react';
import { Activity } from 'lucide-react';
import { AuditLog } from '../../types';

interface RecentActivityProps {
  logs: AuditLog[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ logs }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
         <Activity className="w-5 h-5 mr-2 text-sky-500" />
         Live Activity Feed
      </h3>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide" style={{ maxHeight: '200px' }}>
         {logs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No recent activity.</p>
         ) : (
            logs.map(log => (
               <div key={log.id} className="flex items-start space-x-3 text-sm pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                     log.severity === 'critical' ? 'bg-red-500' :
                     log.severity === 'high' ? 'bg-orange-500' :
                     log.severity === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  <div>
                     <p className="font-medium text-slate-700">
                        <span className="font-bold">{log.userName}</span>: {log.action.replace('_', ' ')}
                     </p>
                     <p className="text-xs text-slate-500">{log.details}</p>
                     <p className="text-[10px] text-slate-400 mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  </div>
               </div>
            ))
         )}
      </div>
    </div>
  );
};
