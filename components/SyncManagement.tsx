
import React, { useState } from 'react';
import { SyncLog, Sale, SystemSettings } from '../types';
import { Wifi, WifiOff } from 'lucide-react';
import { SyncStatusCards } from './sync/SyncStatusCards';
import { SyncActions } from './sync/SyncActions';
import { SyncLogTable } from './sync/SyncLogTable';

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
    // Simulate shorter delay before passing to parent
    setTimeout(() => {
      onSync(type);
      setSyncingType(null);
    }, 500);
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

      <SyncStatusCards 
        settings={settings}
        pendingSalesCount={pendingSales.length}
        lastSuccessLog={lastSuccess}
      />

      <SyncActions 
        onSyncAction={handleSyncAction}
        syncingType={syncingType}
        masterApiUrl={settings.masterApiUrl}
      />

      <SyncLogTable logs={logs} />
    </div>
  );
};
