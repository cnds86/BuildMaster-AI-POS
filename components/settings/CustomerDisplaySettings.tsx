
import React from 'react';
import { SystemSettings } from '../../types';

interface CustomerDisplaySettingsProps {
  formData: SystemSettings;
  setFormData: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

export const CustomerDisplaySettings: React.FC<CustomerDisplaySettingsProps> = ({ formData, setFormData }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Customer Facing Display Configuration</h3>
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between mb-6">
        <div>
          <h4 className="font-bold text-slate-800">Enable Customer Screen</h4>
          <p className="text-xs text-slate-500">Allow customers to view cart and pay on a secondary screen</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={formData.customerDisplay?.enabled} onChange={e => setFormData({ ...formData, customerDisplay: { ...formData.customerDisplay, enabled: e.target.checked } })} />
          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:bg-green-600"></div>
        </label>
      </div>
      {formData.customerDisplay?.enabled && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Welcome Message</label>
            <input type="text" value={formData.customerDisplay.welcomeMessage} onChange={e => setFormData({ ...formData, customerDisplay: { ...formData.customerDisplay, welcomeMessage: e.target.value } })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Slide Interval (Seconds)</label>
            <input type="number" min="3" max="60" value={formData.customerDisplay.promotionInterval} onChange={e => setFormData({ ...formData, customerDisplay: { ...formData.customerDisplay, promotionInterval: parseInt(e.target.value) || 5 } })} className="w-full md:w-32 px-4 py-2 border border-slate-300 rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
};
