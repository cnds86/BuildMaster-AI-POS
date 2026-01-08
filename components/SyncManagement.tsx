
import React, { useState } from 'react';
import { SyncLog, Sale, SystemSettings, Branch } from '../types';
import { Wifi, WifiOff } from 'lucide-react';
import { SyncStatusCards } from './sync/SyncStatusCards';
import { SyncActions } from './sync/SyncActions';
import { SyncLogTable } from './sync/SyncLogTable';
import { MasterSyncControl } from './sync/MasterSyncControl';

interface SyncManagementProps {
  settings: SystemSettings;
  logs: SyncLog[];
  sales: Sale[];
  branches?: Branch[];
  onSync: (type: 'Auto' | 'Manual' | 'Push' | 'Pull', targetBranchIds?: string[]) => void;
}

export const SyncManagement: React.FC<SyncManagementProps> = ({ settings, logs, sales, branches = [], onSync }) => {
  const [syncingType, setSyncingType] = useState<'Auto' | 'Manual' | 'Push' | 'Pull' | null>(null);

  // Calculate stats
  const pendingSales = sales.filter(s => s.syncStatus === 'pending');
  const lastSuccess = logs.find(l => l.status === 'Success');
  
  // Mock Connection Check
  const isConnected = !!settings.masterApiUrl || settings.deviceRole === 'Master'; 

  const handleSyncAction = (type: 'Auto' | 'Manual' | 'Push' | 'Pull') => {
    setSyncingType(type);
    setTimeout(() => {
      onSync(type);
      setSyncingType(null);
    }, 1500);
  };

  const handleMasterSync = (type: 'Push' | 'Pull', targetIds: string[]) => {
    setSyncingType(type);
    setTimeout(() => {
      onSync(type, targetIds);
      setSyncingType(null);
    }, 2000); // Slightly longer simulation for multi-branch
  };

  return (
    <div className="space-y-6 h-full flex flex-col pb-20 md:pb-0">
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

      {settings.deviceRole === 'Master' ? (
        <MasterSyncControl 
          branches={branches} 
          onSync={handleMasterSync} 
          isSyncing={!!syncingType} 
        />
      ) : (
        <SyncActions 
          onSyncAction={handleSyncAction}
          syncingType={syncingType}
          masterApiUrl={settings.masterApiUrl}
        />
      )}

      <SyncLogTable logs={logs} />
    </div>
  );
};
