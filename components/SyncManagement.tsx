
import React, { useState } from 'react';
import { SyncLog, Sale, SystemSettings } from '../types';
import { 
  RefreshCw, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Server, 
  Database,
  CloudOff,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';

interface SyncManagementProps {
  settings: SystemSettings;
  logs: SyncLog[];
  sales: Sale[];
  onSync: (type: 'Auto' | 'Manual' | 'Push' | 'Pull') => void;
}

export const SyncManagement: React.FC<SyncManagementProps> = ({ settings, logs, sales, onSync }) => {
  const [syncingType, setSyncingType] = useState<'Auto' | 'Manual' | 'Push' | 'Pull' | null>(null);

  // Calculate stats
  const pendingSales = sales.filter(s => s.syncStatus === 'pending');
  const lastSuccess = logs.find(l => l.status === 'Success');
  
  // Mock Connection Check (In reality, this would be a real ping)
  const isConnected = !!settings.masterApiUrl; 

  const handleSyncAction = (type: 'Auto' | 'Manual' | 'Push' | 'Pull') => {
    setSyncingType(type);
    // Simulate delay before passing to parent
    setTimeout(() => {
      onSync(type);
      setSyncingType(null);
    }, 2000);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Data Synchronization</h2>
          <p className="text-slate-500">Monitor and manage data transfer between POS and Master Server.</p>
        </div>
        <div className="flex items-center space-x-2">
           <span className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isConnected ? <Wifi className="w-4 h-4 mr-2" /> : <WifiOff className="w-4 h-4 mr-2" />}
              {isConnected ? 'Online' : 'Offline'}
           </span>
        </div>
      </div>

      {/* Status Cards */}
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
               <h3 className="text-lg font-bold text-slate-800">{pendingSales.length} Sales</h3>
            </div>
         </div>

         <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg mr-4">
               <Clock className="w-6 h-6" />
            </div>
            <div>
               <p className="text-sm text-slate-500 font-medium">Last Sync</p>
               <h3 className="text-sm font-bold text-slate-800">
                  {lastSuccess ? new Date(lastSuccess.timestamp).toLocaleTimeString() : 'Never'}
               </h3>
               <p className="text-xs text-slate-400">{lastSuccess ? new Date(lastSuccess.timestamp).toLocaleDateString() : ''}</p>
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

      {/* Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
         <h3 className="font-bold text-slate-800 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-slate-500" />
            Sync Operations
         </h3>
         <div className="flex flex-wrap gap-4">
            <button
               onClick={() => handleSyncAction('Manual')}
               disabled={!!syncingType}
               className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium shadow-sm"
            >
               <RefreshCw className={`w-5 h-5 mr-2 ${syncingType === 'Manual' ? 'animate-spin' : ''}`} />
               {syncingType === 'Manual' ? 'Syncing...' : 'Sync Now (Bi-directional)'}
            </button>
            
            <button
               onClick={() => handleSyncAction('Push')}
               disabled={!!syncingType}
               className="flex items-center px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors font-medium"
            >
               <ArrowUpCircle className={`w-5 h-5 mr-2 ${syncingType === 'Push' ? 'animate-bounce' : ''}`} />
               {syncingType === 'Push' ? 'Uploading...' : 'Force Upload (Push)'}
            </button>

            <button
               onClick={() => handleSyncAction('Pull')}
               disabled={!!syncingType}
               className="flex items-center px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors font-medium"
            >
               <ArrowDownCircle className={`w-5 h-5 mr-2 ${syncingType === 'Pull' ? 'animate-bounce' : ''}`} />
               {syncingType === 'Pull' ? 'Downloading...' : 'Force Download (Pull)'}
            </button>
         </div>
         
         {!settings.masterApiUrl && (
            <div className="mt-4 p-3 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-sm flex items-center">
               <AlertCircle className="w-4 h-4 mr-2" />
               Master API URL is not configured. Please go to Settings to configure the connection.
            </div>
         )}
      </div>

      {/* Logs */}
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
               <div className="p-8 text-center text-slate-400">No logs available.</div>
            )}
         </div>
      </div>
    </div>
  );
};
