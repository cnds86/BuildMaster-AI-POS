
import React, { useRef } from 'react';
import { SystemSettings } from '../../types';
import { HardDrive, Download, Upload, AlertCircle } from 'lucide-react';
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

  const importFileRef = useRef<HTMLInputElement>(null);
  
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

  return (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">
         Backup & Restoration
      </h3>
      
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
         <h4 className="font-bold text-slate-800 mb-4 flex items-center">
            <HardDrive className="w-5 h-5 mr-2 text-slate-500" />
            Data Management
         </h4>
         <p className="text-sm text-slate-500 mb-6 max-w-2xl">
            Manage your system data securely. Regular backups are recommended to prevent data loss. 
            Restoring data will replace all current inventory, sales, and settings.
         </p>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
               <h5 className="font-bold text-slate-800 mb-2 flex items-center">
                  <Download className="w-4 h-4 mr-2 text-blue-600" /> Backup Data
               </h5>
               <p className="text-xs text-slate-500 mb-4 h-10">
                  Download a full JSON snapshot of your current system state.
               </p>
               <button 
                  type="button"
                  onClick={handleExportData}
                  className="flex items-center justify-center w-full px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm font-bold shadow-sm"
               >
                  Export JSON Backup
               </button>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
               <h5 className="font-bold text-slate-800 mb-2 flex items-center">
                  <Upload className="w-4 h-4 mr-2 text-orange-600" /> Restore Data
               </h5>
               <p className="text-xs text-slate-500 mb-4 h-10">
                  Import a backup file to restore system state. <span className="text-red-500 font-bold">Overwrites current data.</span>
               </p>
               <button 
                  type="button"
                  onClick={() => importFileRef.current?.click()}
                  className="flex items-center justify-center w-full px-4 py-2.5 bg-white border-2 border-slate-100 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-200 transition-colors text-sm font-bold"
               >
                  Select File to Restore
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

      <div className="p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 flex items-start">
         <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
         <div>
            <h4 className="font-bold text-sm">Database Connection Settings</h4>
            <p className="text-xs mt-1 text-blue-700">
               To configure the connection to a local SQL database (PostgreSQL, MySQL, SQLite), 
               please go to the <strong>Device & Network</strong> tab.
            </p>
         </div>
      </div>
    </div>
  );
};
