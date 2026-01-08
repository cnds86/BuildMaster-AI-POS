
import React, { useState } from 'react';
import { SystemSettings, Branch, PosMachine } from '../../types';
import { Network, RefreshCw, Database, Server, CheckCircle, XCircle, ChevronDown } from 'lucide-react';

interface DeviceSettingsProps {
  formData: SystemSettings;
  setFormData: React.Dispatch<React.SetStateAction<SystemSettings>>;
  branches: Branch[];
  posMachines: PosMachine[];
  posCheckStatus: 'idle' | 'checking' | 'available' | 'taken';
  setPosCheckStatus: (status: 'idle' | 'checking' | 'available' | 'taken') => void;
}

export const DeviceSettings: React.FC<DeviceSettingsProps> = ({ 
  formData, setFormData, branches, posMachines, posCheckStatus, setPosCheckStatus 
}) => {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [dbStatus, setDbStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const availablePosMachines = posMachines.filter(p => p.branchId === formData.currentBranchId);

  const checkPosAvailability = (posId: string) => {
     if (!posId) {
        setPosCheckStatus('idle');
        return;
     }
     setPosCheckStatus('checking');
     // Mock async check
     setTimeout(() => {
        if (posId === 'pm2') { 
           setPosCheckStatus('taken');
        } else {
           setPosCheckStatus('available');
        }
     }, 1000); 
  };

  const handleTestConnection = () => {
    if (!formData.masterApiUrl) {
       setConnectionStatus('error');
       return;
    }
    setConnectionStatus('testing');
    setTimeout(() => {
       if (formData.masterApiUrl && (formData.masterApiUrl.includes('http') || formData.masterApiUrl.includes('192') || formData.masterApiUrl.includes('localhost'))) {
          setConnectionStatus('success');
       } else {
          setConnectionStatus('error');
       }
    }, 1500);
  };

  const handleTestDb = () => {
    setDbStatus('testing');
    setTimeout(() => {
       if (formData.localDatabase?.host) {
          setDbStatus('success');
       } else {
          setDbStatus('error');
       }
    }, 1500);
  };

  // Safe helper to update localDatabase fields
  const updateDbField = (field: string, value: any) => {
    setFormData({
      ...formData,
      localDatabase: {
        // Provide defaults if somehow undefined
        type: 'postgresql',
        host: 'localhost',
        port: '5432',
        databaseName: 'buildmaster_pos',
        username: 'postgres',
        password: '',
        enabled: false,
        ...formData.localDatabase,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Device & Network Configuration</h3>
      
      {/* Branch & POS Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
         <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Branch Location</label>
            <div className="relative">
               <select 
                  value={formData.currentBranchId || ''} 
                  onChange={e => { setFormData({ ...formData, currentBranchId: e.target.value, currentPosId: '' }); setPosCheckStatus('idle'); }} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-slate-400 outline-none text-slate-700 font-medium"
               >
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
               </select>
               <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
         </div>
         <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">POS Terminal ID</label>
            <div className="relative">
               <select 
                  value={formData.currentPosId || ''} 
                  onChange={e => { const newId = e.target.value; setFormData({ ...formData, currentPosId: newId }); checkPosAvailability(newId); }} 
                  disabled={!formData.currentBranchId} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-slate-400 outline-none text-slate-700 font-medium disabled:bg-slate-100 disabled:text-slate-400"
               >
                  <option value="">Select POS Machine</option>
                  {availablePosMachines.map(p => <option key={p.id} value={p.id}>{p.machineNumber}</option>)}
               </select>
               <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
         </div>
      </div>

      {/* Network Role Configuration */}
      <div className="space-y-4">
         <h4 className="font-bold text-slate-700 flex items-center">
            <Network className="w-5 h-5 mr-2 text-slate-500" />
            Network Role & Synchronization
         </h4>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
               <label className="block text-sm font-bold text-slate-700 mb-2">Device Role</label>
               <div className="flex space-x-4">
                  <label className="flex items-center cursor-pointer">
                     <input 
                        type="radio" 
                        name="deviceRole" 
                        value="Master"
                        checked={formData.deviceRole === 'Master'}
                        onChange={() => setFormData({...formData, deviceRole: 'Master'})}
                        className="w-4 h-4 text-brand-red focus:ring-brand-red"
                     />
                     <span className="ml-2 text-sm text-slate-700">Master Server</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                     <input 
                        type="radio" 
                        name="deviceRole" 
                        value="Slave"
                        checked={formData.deviceRole === 'Slave'}
                        onChange={() => setFormData({...formData, deviceRole: 'Slave'})}
                        className="w-4 h-4 text-brand-red focus:ring-brand-red"
                     />
                     <span className="ml-2 text-sm text-slate-700">Slave (Client)</span>
                  </label>
               </div>
               <p className="text-xs text-slate-500 mt-2">
                  {formData.deviceRole === 'Master' 
                     ? 'This device acts as the central server for other POS terminals.' 
                     : 'This device connects to a Master server to sync data.'}
               </p>
            </div>

            {formData.deviceRole === 'Slave' && (
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Master Server API URL</label>
                  <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={formData.masterApiUrl || ''} 
                        onChange={e => setFormData({...formData, masterApiUrl: e.target.value})}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none"
                        placeholder="http://192.168.1.10:3000"
                     />
                     <button 
                        type="button"
                        onClick={handleTestConnection}
                        className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center ${connectionStatus === 'success' ? 'bg-green-100 text-green-700' : connectionStatus === 'error' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}
                     >
                        {connectionStatus === 'testing' ? <RefreshCw className="w-4 h-4 animate-spin" /> : connectionStatus === 'success' ? <CheckCircle className="w-4 h-4"/> : connectionStatus === 'error' ? <XCircle className="w-4 h-4"/> : 'Test'}
                     </button>
                  </div>
               </div>
            )}
            
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-2">Auto-Sync Interval (Seconds)</label>
               <input 
                  type="number" 
                  min="0"
                  value={formData.autoSyncInterval || 0} 
                  onChange={e => setFormData({...formData, autoSyncInterval: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none"
                  placeholder="0 to disable"
               />
               <p className="text-xs text-slate-400 mt-1">Set to 0 to disable automatic synchronization.</p>
            </div>
         </div>
      </div>

      {/* Local Database Configuration */}
      <div className="space-y-4 pt-6 border-t border-slate-100">
         <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-700 flex items-center">
               <Database className="w-5 h-5 mr-2 text-slate-500" />
               Local Database Connection
            </h4>
            <label className="relative inline-flex items-center cursor-pointer">
               <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.localDatabase?.enabled} 
                  onChange={e => updateDbField('enabled', e.target.checked)} 
               />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
               <span className={`ml-3 text-sm font-medium ${formData.localDatabase?.enabled ? 'text-green-700 font-bold' : 'text-slate-600'}`}>
                  {formData.localDatabase?.enabled ? 'Enabled' : 'Disabled'}
               </span>
            </label>
         </div>

         {formData.localDatabase?.enabled && (
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Database Engine</label>
                     <div className="relative">
                        <select
                           value={formData.localDatabase.type}
                           onChange={e => updateDbField('type', e.target.value)}
                           className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white appearance-none focus:ring-2 focus:ring-slate-400 outline-none text-slate-700 font-medium"
                        >
                           <option value="postgresql">PostgreSQL</option>
                           <option value="mysql">MySQL</option>
                           <option value="sqlite">SQLite</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Host</label>
                     <div className="relative">
                        <Server className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input type="text" value={formData.localDatabase.host} onChange={e => updateDbField('host', e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none" placeholder="localhost" />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
                     <input type="text" value={formData.localDatabase.port} onChange={e => updateDbField('port', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none" placeholder="5432" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Database Name</label>
                     <input type="text" value={formData.localDatabase.databaseName} onChange={e => updateDbField('databaseName', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none" placeholder="buildmaster_pos" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                     <input type="text" value={formData.localDatabase.username} onChange={e => updateDbField('username', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                     <input type="password" value={formData.localDatabase.password} onChange={e => updateDbField('password', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none" />
                  </div>
               </div>
               
               <div className="flex justify-end pt-4 mt-4 border-t border-slate-200">
                  <button 
                     type="button"
                     onClick={handleTestDb}
                     disabled={dbStatus === 'testing'}
                     className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center transition-all ${dbStatus === 'success' ? 'bg-green-100 text-green-700' : dbStatus === 'error' ? 'bg-red-100 text-red-700' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                  >
                     {dbStatus === 'testing' ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : dbStatus === 'success' ? <CheckCircle className="w-4 h-4 mr-2"/> : dbStatus === 'error' ? <XCircle className="w-4 h-4 mr-2"/> : <Database className="w-4 h-4 mr-2" />}
                     {dbStatus === 'testing' ? 'Connecting...' : dbStatus === 'success' ? 'Connected' : dbStatus === 'error' ? 'Failed' : 'Test Connection'}
                  </button>
               </div>
            </div>
         )}
      </div>
    </div>
  );
};
