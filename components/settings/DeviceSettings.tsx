
import React, { useState } from 'react';
import { SystemSettings, Branch, PosMachine } from '../../types';
import { Network, RefreshCw } from 'lucide-react';

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

  return (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Device Configuration</h3>
      
      {/* Branch & POS Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
         <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Branch Location</label>
            <select value={formData.currentBranchId || ''} onChange={e => { setFormData({ ...formData, currentBranchId: e.target.value, currentPosId: '' }); setPosCheckStatus('idle'); }} className="w-full px-4 py-2 border border-slate-300 rounded-lg">
               <option value="">Select Branch</option>
               {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
         </div>
         <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">POS Terminal ID</label>
            <select value={formData.currentPosId || ''} onChange={e => { const newId = e.target.value; setFormData({ ...formData, currentPosId: newId }); checkPosAvailability(newId); }} disabled={!formData.currentBranchId} className="w-full px-4 py-2 border border-slate-300 rounded-lg">
               <option value="">Select POS Machine</option>
               {availablePosMachines.map(p => <option key={p.id} value={p.id}>{p.machineNumber}</option>)}
            </select>
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
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500"
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
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500"
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
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
                        placeholder="http://192.168.1.10:3000"
                     />
                     <button 
                        type="button"
                        onClick={handleTestConnection}
                        className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${connectionStatus === 'success' ? 'bg-green-100 text-green-700' : connectionStatus === 'error' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}
                     >
                        {connectionStatus === 'testing' ? <RefreshCw className="w-4 h-4 animate-spin" /> : connectionStatus === 'success' ? 'OK' : 'Test'}
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  placeholder="0 to disable"
               />
               <p className="text-xs text-slate-400 mt-1">Set to 0 to disable automatic synchronization.</p>
            </div>
         </div>
      </div>
    </div>
  );
};
