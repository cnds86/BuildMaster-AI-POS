
import React from 'react';
import { SystemSettings } from '../../types';
import { Target } from 'lucide-react';

interface CompanySettingsProps {
  formData: SystemSettings;
  setFormData: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

export const CompanySettings: React.FC<CompanySettingsProps> = ({ formData, setFormData }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Company Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
          <input
            type="text"
            value={formData.companyName}
            onChange={e => setFormData({ ...formData, companyName: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID / Registration No.</label>
          <input
            type="text"
            value={formData.taxId}
            onChange={e => setFormData({ ...formData, taxId: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
          <textarea
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none h-24"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
          <input
            type="text"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        {/* Monthly Target Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
             <Target className="w-4 h-4 mr-1 text-slate-500" />
             Monthly Revenue Target ({formData.currencySymbol})
          </label>
          <input
            type="number"
            min="0"
            value={formData.monthlyTarget || 0}
            onChange={e => setFormData({ ...formData, monthlyTarget: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-bold"
          />
          <p className="text-xs text-slate-400 mt-1">Used for dashboard progress tracking.</p>
        </div>
      </div>
    </div>
  );
};
