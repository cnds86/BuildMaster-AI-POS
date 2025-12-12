
'use client';
import { Settings } from '../../components/Settings';
import { useGlobal } from '../../context/GlobalContext';

export default function SettingsPage() {
  const { settings, updateSettings, branches, posMachines } = useGlobal();

  return (
    <Settings 
      settings={settings} 
      onUpdateSettings={updateSettings} 
      branches={branches}
      posMachines={posMachines}
    />
  );
}
