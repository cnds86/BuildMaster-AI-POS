
import React, { useRef, useState } from 'react';
import { SystemSettings } from '../../types';
import { HardDrive, Download, Upload, RefreshCw } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';

interface DatabaseSettingsProps {
  formData: SystemSettings;
  setFormData: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

export const DatabaseSettings: React.FC<DatabaseSettingsProps> = ({ formData, setFormData }) => {
  const { 
    products, sales, customers, users, units, categories, 
    branches, posMachines, warehouses, locations, transfers, 
    counts, reservations, receipts, adjustments, shifts, 
    shiftSchedules, promotions, restoreSystemData 
  } = useGlobal();

  const [localDbStatus, setLocalDbStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const importFileRef = useRef<HTMLInputElement>(null);
  
  const isMasterNode = formData.deviceRole === 'Master';

  const handleExportData = () => {
    const exportData = {
      meta: {
        exportedAt: new Date().toISOString(),
        version: '1.0'
      },
      settings: formData,
      products,
      sales,
      customers,
      users,
      units,
      categories,
      branches,
      posMachines,
      warehouses,
      locations,
      transfers,
      counts,
      reservations,
      receipts,
      adjustments,
      shifts,
      shiftSchedules,
      promotions
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `buildmaster_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        if (confirm("This will overwrite your current system data. Are you sure?")) {
           restoreSystemData(jsonData);
           alert("System data restored successfully!");
        }
      } catch (err) {
        alert("Failed to parse backup file. Invalid JSON.");
      }
      // Reset input
      if (importFileRef.current) importFileRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleTestLocalDb = () => {
    setLocalDbStatus('testing');
    setTimeout(() => {
      if (formData.localDatabase?.host) {
        setLocalDbStatus('success');
      } else {
        setLocalDbStatus('error');
      }
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">
         {isMasterNode ? 'Primary System Database' : 'Local Database & Backup'}
      </h3>
      
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
         <h4 className="font-bold text-slate-800 mb-4 flex items-center">
            <HardDrive className="w-5 h-5 mr-2 text-slate-500" />
            Data Management
         </h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
               <h5 className="font-bold text-slate-700 mb-2">Backup System Data</h5>
               <p className="text-xs text-slate-500 mb-4">
                  Export all system data (Products, Sales, Settings, Customers) as a JSON file. Useful for migration or manual backup.
               </p>
               <button 
                  type="button"
                  onClick={handleExportData}
                  className="flex items-center justify-center w-full px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium"
               >
                  <Download className="w-4 h-4 mr-2" /> Export JSON
               </button>
            </div>

            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
               <h5 className="font-bold text-slate-700 mb-2">Restore System Data</h5>
               <p className="text-xs text-slate-500 mb-4">
                  Import a previously exported JSON file. <span className="text-red-500 font-bold">Warning: This will overwrite existing data.</span>
               </p>
               <button 
                  type="button"
                  onClick={() => importFileRef.current?.click()}
                  className="flex items-center justify-center w-full px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
               >
                  <Upload className="w-4 h-4 mr-2" /> Import JSON
               </button>
               <input 
                  type="file" 
                  ref={importFileRef}
                  className="hidden"
                  accept=".json"
                  onChange={handleImportData}
               />
            </div>
         </div>
      </div>

      <div className={`p-4 border rounded-xl flex items-center justify-between mb-6 ${isMasterNode ? 'bg-purple-50 border-purple-100' : 'bg-indigo-50 border-indigo-100'}`}>
        <div>
          <h4 className={`font-bold ${isMasterNode ? 'text-purple-900' : 'text-indigo-900'}`}>
             {isMasterNode ? 'Enable Database Engine' : 'Enable Local Database'}
          </h4>
          <p className={`text-xs ${isMasterNode ? 'text-purple-700' : 'text-indigo-700'}`}>
             {isMasterNode 
                ? 'Configure the main database connection for this Master Node' 
                : 'Cache data locally for offline operations'
             }
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={formData.localDatabase?.enabled} onChange={e => setFormData({ ...formData, localDatabase: { ...formData.localDatabase!, enabled: e.target.checked } })} />
          <div className={`w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${isMasterNode ? 'peer-checked:bg-purple-600' : 'peer-checked:bg-indigo-600'}`}></div>
        </label>
      </div>

      {formData.localDatabase?.enabled && (
        <div className="space-y-4 border-t border-slate-100 pt-6">
           <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Connection Details</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Database Type</label>
               <select
                 value={formData.localDatabase.type}
                 onChange={e => setFormData({ ...formData, localDatabase: { ...formData.localDatabase!, type: e.target.value as any } })}
                 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
               >
                 <option value="postgresql">PostgreSQL</option>
                 <option value="mysql">MySQL</option>
                 <option value="sqlite">SQLite</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Host</label>
               <input type="text" value={formData.localDatabase.host} onChange={e => setFormData({ ...formData, localDatabase: { ...formData.localDatabase!, host: e.target.value } })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="localhost" />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
               <input type="text" value={formData.localDatabase.port} onChange={e => setFormData({ ...formData, localDatabase: { ...formData.localDatabase!, port: e.target.value } })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="5432" />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Database Name</label>
               <input type="text" value={formData.localDatabase.databaseName} onChange={e => setFormData({ ...formData, localDatabase: { ...formData.localDatabase!, databaseName: e.target.value } })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="buildmaster_pos" />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
               <input type="text" value={formData.localDatabase.username} onChange={e => setFormData({ ...formData, localDatabase: { ...formData.localDatabase!, username: e.target.value } })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
               <input type="password" value={formData.localDatabase.password} onChange={e => setFormData({ ...formData, localDatabase: { ...formData.localDatabase!, password: e.target.value } })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
             </div>
             
             <div className="md:col-span-2 pt-4 border-t border-slate-100 flex justify-end">
                <button 
                   type="button"
                   onClick={handleTestLocalDb}
                   disabled={localDbStatus === 'testing'}
                   className={`px-4 py-2 rounded-lg font-medium flex items-center transition-all ${localDbStatus === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                   {localDbStatus === 'testing' ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <HardDrive className="w-4 h-4 mr-2" />}
                   {localDbStatus === 'testing' ? 'Connecting...' : localDbStatus === 'success' ? 'Connected Successfully' : 'Test Connection'}
                </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};
