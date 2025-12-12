
'use client';
import { SyncManagement } from '../../components/SyncManagement';
import { useGlobal } from '../../context/GlobalContext';

export default function SyncPage() {
  const { settings, syncLogs, sales, handleSyncOperation } = useGlobal();

  return (
    <SyncManagement 
      settings={settings}
      logs={syncLogs}
      sales={sales}
      onSync={handleSyncOperation}
    />
  );
}
