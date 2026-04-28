
import React, { useState, useEffect } from 'react';
import { SystemSettings, Branch, PosMachine } from '../types';
import { 
  Save, 
  Globe, 
  Building, 
  Printer, 
  Percent, 
  Monitor, 
  Database, 
  LayoutList, 
  CheckCircle, 
  Tv, 
  AlertTriangle,
  Loader2,
  Network
} from 'lucide-react';

// Import Sub-Components
import { CompanySettings } from './settings/CompanySettings';
import { ReceiptSettings } from './settings/ReceiptSettings';
import { FinancialSettings } from './settings/FinancialSettings';
import { DeviceSettings } from './settings/DeviceSettings';
import { DatabaseSettings } from './settings/DatabaseSettings';
import { LocalizationSettings } from './settings/LocalizationSettings';
import { CustomerDisplaySettings } from './settings/CustomerDisplaySettings';

import { useGlobal } from '../context/GlobalContext';

interface SettingsProps {
  settings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => void;
  branches?: Branch[];
  posMachines?: PosMachine[];
}

type SettingsTab = 'company' | 'receipt' | 'financials' | 'device' | 'database' | 'localization' | 'interface' | 'customer_display';

const TABS: { id: SettingsTab; label: string; icon: any }[] = [
  { id: 'company', label: 'settings.company', icon: Building },
  { id: 'receipt', label: 'settings.receipt', icon: Printer },
  { id: 'financials', label: 'settings.financials', icon: Percent },
  { id: 'customer_display', label: 'settings.customerDisplay', icon: Tv },
  { id: 'device', label: 'settings.device', icon: Network },
  { id: 'database', label: 'settings.database', icon: Database },
  { id: 'localization', label: 'settings.localization', icon: Globe },
  { id: 'interface', label: 'settings.interface', icon: LayoutList },
];

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, branches = [], posMachines = [] }) => {
  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [activeTab, setActiveTab] = useState<SettingsTab>('company');
  const [successMsg, setSuccessMsg] = useState('');
  
  // POS Availability Check State (Lifted state for validation)
  const [posCheckStatus, setPosCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Sync state when props change
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // Handle Tab Change with Auto-Reset Logic
  const handleTabChange = (newTab: SettingsTab) => {
    if (activeTab === 'device' && (posCheckStatus === 'taken' || posCheckStatus === 'checking')) {
        setFormData(prev => ({
            ...prev,
            currentBranchId: settings.currentBranchId,
            currentPosId: settings.currentPosId,
            deviceRole: settings.deviceRole,
            masterApiUrl: settings.masterApiUrl,
            autoSyncInterval: settings.autoSyncInterval
        }));
        setPosCheckStatus('idle');
    }
    setActiveTab(newTab);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict Block: Prevent saving ONLY if on Device tab AND (ID is duplicate OR Checking)
    if (activeTab === 'device') {
       if (posCheckStatus === 'taken') {
          alert("Error: Cannot save settings. The selected POS Terminal ID is already in use.");
          return;
       }
       if (posCheckStatus === 'checking') {
          return; // Silently block
       }
    }
    
    onUpdateSettings(formData);
    setSuccessMsg('Settings saved successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const isSaveDisabled = activeTab === 'device' && (posCheckStatus === 'taken' || posCheckStatus === 'checking');

  const { t } = useGlobal();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">System Settings</h2>
          <p className="text-slate-500">Manage configuration, preferences, and connections.</p>
        </div>
        {successMsg && (
          <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-2 rounded-xl flex items-center shadow-sm animate-fade-in font-bold text-sm">
            <CheckCircle className="w-5 h-5 mr-2" />
            {successMsg}
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 min-h-0">
        {/* Sidebar Tabs - Style A: Clean list */}
        <div className="w-full md:w-72 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto shrink-0 p-2 md:p-3 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            let label = t(tab.label, tab.label);
            if (tab.id === 'database') {
                label = t('settings.database', 'Database & Backup');
            }

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center px-4 py-3 text-sm font-bold transition-all rounded-xl whitespace-nowrap md:whitespace-normal text-left
                  ${isActive 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  } ${
                    tab.id === 'device' && activeTab === 'device' && posCheckStatus === 'taken' ? 'text-red-500 hover:text-red-600' : ''
                  }`}
              >
                <Icon className={`w-5 h-5 mr-3 shrink-0 ${isActive ? 'text-slate-900' : (tab.id === 'device' && activeTab === 'device' && posCheckStatus === 'taken' ? 'text-red-500' : 'text-slate-400')}`} />
                {label}
                {tab.id === 'device' && activeTab === 'device' && posCheckStatus === 'taken' && (
                   <AlertTriangle className="w-4 h-4 ml-auto text-red-500" />
                )}
                {tab.id === 'device' && activeTab === 'device' && posCheckStatus === 'checking' && (
                   <Loader2 className="w-4 h-4 ml-auto text-slate-400 animate-spin" />
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white relative">
          <form onSubmit={handleSave} className="max-w-4xl mx-auto pb-8 h-full flex flex-col">
            
            <div className="flex-1">
              {activeTab === 'company' && <CompanySettings formData={formData} setFormData={setFormData} />}
              
              {activeTab === 'receipt' && <ReceiptSettings formData={formData} setFormData={setFormData} branches={branches} posMachines={posMachines} />}
              
              {activeTab === 'financials' && <FinancialSettings formData={formData} setFormData={setFormData} />}
              
              {activeTab === 'device' && (
                <DeviceSettings 
                  formData={formData} 
                  setFormData={setFormData} 
                  branches={branches} 
                  posMachines={posMachines}
                  posCheckStatus={posCheckStatus}
                  setPosCheckStatus={setPosCheckStatus}
                />
              )}
              
              {activeTab === 'database' && <DatabaseSettings formData={formData} setFormData={setFormData} />}
              
              {activeTab === 'localization' && <LocalizationSettings formData={formData} setFormData={setFormData} />}
              
              {activeTab === 'customer_display' && <CustomerDisplaySettings formData={formData} setFormData={setFormData} />}

              {activeTab === 'interface' && (
                <div className="space-y-6 animate-fade-in">
                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Interface & Display</h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Default Items Per Page</label>
                      <select value={formData.defaultItemsPerPage} onChange={e => setFormData({ ...formData, defaultItemsPerPage: parseInt(e.target.value) })} className="w-full md:w-64 px-4 py-2 border border-slate-300 rounded-lg">
                          <option value={10}>10 items</option>
                          <option value={20}>20 items</option>
                          <option value={50}>50 items</option>
                      </select>
                    </div>
                </div>
              )}
            </div>

            {/* Static Save Button - Bottom of form */}
            <div className="mt-8 flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSaveDisabled}
                  className={`px-8 py-3.5 font-bold rounded-xl shadow-xl flex items-center transform transition-all ${
                    isSaveDisabled 
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                      : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 active:scale-95'
                  }`}
                >
                  {isSaveDisabled && <AlertTriangle className="w-5 h-5 mr-2" />}
                  {!isSaveDisabled && <Save className="w-5 h-5 mr-2" />}
                  {isSaveDisabled 
                     ? (posCheckStatus === 'checking' ? 'Checking ID...' : 'Cannot Save (Invalid ID)') 
                     : 'Save Settings'}
                </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
