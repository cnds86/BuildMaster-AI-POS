
import React from 'react';
import { SystemSettings, Sale, SyncLog } from '../../types';
import { Server, ArrowUpCircle, Clock, Database } from 'lucide-react';

interface SyncStatusCardsProps {
  settings: SystemSettings;
  pendingSalesCount: number;
  lastSuccessLog?: SyncLog;
}

export const SyncStatusCards: React.FC<SyncStatusCardsProps> = ({ settings, pendingSalesCount, lastSuccessLog }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg mr-4">
             <Server className="w-6 h-6" />
          </div>
          <div>
             <p className="text-sm text-slate-500 font-medium">Device Role</p>
             <h3 className="text-lg font-bold text-slate-800">{settings.deviceRole}</h3>
          </div>
       </div>
       
       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-4">
             <ArrowUpCircle className="w-6 h-6" />
          </div>
          <div>
             <p className="text-sm text-slate-500 font-medium">Pending Uploads</p>
             <h3 className="text-lg font-bold text-slate-800">{pendingSalesCount} Sales</h3>
          </div>
       </div>

       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg mr-4">
             <Clock className="w-6 h-6" />
          </div>
          <div>
             <p className="text-sm text-slate-500 font-medium">Last Sync</p>
             <h3 className="text-sm font-bold text-slate-800">
                {lastSuccessLog ? new Date(lastSuccessLog.timestamp).toLocaleTimeString() : 'Never'}
             </h3>
             <p className="text-xs text-slate-400">{lastSuccessLog ? new Date(lastSuccessLog.timestamp).toLocaleDateString() : ''}</p>
          </div>
       </div>

       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center">
           <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg mr-4">
             <Database className="w-6 h-6" />
          </div>
          <div>
             <p className="text-sm text-slate-500 font-medium">Local DB</p>
             <h3 className="text-lg font-bold text-slate-800">
                {settings.localDatabase?.enabled ? 'Active' : 'Disabled'}
             </h3>
          </div>
       </div>
    </div>
  );
};
