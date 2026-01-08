
'use client';
import { SyncManagement } from '../../components/SyncManagement';
import { useGlobal } from '../../context/GlobalContext';

export default function SyncPage() {
  const { settings, syncLogs, sales, branches, handleSyncOperation } = useGlobal();

  return (
    <SyncManagement 
      settings={settings}
      logs={syncLogs}
      sales={sales}
      branches={branches}
      onSync={handleSyncOperation}
    />
  );
}
