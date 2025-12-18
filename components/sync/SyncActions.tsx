
import React from 'react';
import { Activity, RefreshCw, ArrowUpCircle, ArrowDownCircle, AlertCircle } from 'lucide-react';

interface SyncActionsProps {
  onSyncAction: (type: 'Auto' | 'Manual' | 'Push' | 'Pull') => void;
  syncingType: 'Auto' | 'Manual' | 'Push' | 'Pull' | null;
  masterApiUrl?: string;
}

export const SyncActions: React.FC<SyncActionsProps> = ({ onSyncAction, syncingType, masterApiUrl }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
       <h3 className="font-bold text-slate-800 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-slate-500" />
          Sync Operations
       </h3>
       <div className="flex flex-wrap gap-4">
          <button
             onClick={() => onSyncAction('Manual')}
             disabled={!!syncingType}
             className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium shadow-sm"
          >
             <RefreshCw className={`w-5 h-5 mr-2 ${syncingType === 'Manual' ? 'animate-spin' : ''}`} />
             {syncingType === 'Manual' ? 'Syncing...' : 'Sync Now (Bi-directional)'}
          </button>
          
          <button
             onClick={() => onSyncAction('Push')}
             disabled={!!syncingType}
             className="flex items-center px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors font-medium"
          >
             <ArrowUpCircle className={`w-5 h-5 mr-2 ${syncingType === 'Push' ? 'animate-bounce' : ''}`} />
             {syncingType === 'Push' ? 'Uploading...' : 'Force Upload (Push)'}
          </button>

          <button
             onClick={() => onSyncAction('Pull')}
             disabled={!!syncingType}
             className="flex items-center px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors font-medium"
          >
             <ArrowDownCircle className={`w-5 h-5 mr-2 ${syncingType === 'Pull' ? 'animate-bounce' : ''}`} />
             {syncingType === 'Pull' ? 'Downloading...' : 'Force Download (Pull)'}
          </button>
       </div>
       
       {!masterApiUrl && (
          <div className="mt-4 p-3 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-sm flex items-center">
             <AlertCircle className="w-4 h-4 mr-2" />
             Master API URL is not configured. Please go to Settings to configure the connection.
          </div>
       )}
    </div>
  );
};
