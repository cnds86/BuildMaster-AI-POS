
import React from 'react';
import { SystemSettings, Language } from '../../types';

interface LocalizationSettingsProps {
  formData: SystemSettings;
  setFormData: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

export const LocalizationSettings: React.FC<LocalizationSettingsProps> = ({ formData, setFormData }) => {
  const handleLangChange = (lang: Language) => {
    setFormData({ ...formData, language: lang });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Localization</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">System Language</label>
            <div className="grid grid-cols-3 gap-3">
               {[{ code: 'en', flag: '🇺🇸', label: 'English' }, { code: 'th', flag: '🇹🇭', label: 'ไทย' }, { code: 'lo', flag: '🇱🇦', label: 'ລາວ' }].map((lang) => (
                  <button key={lang.code} type="button" onClick={() => handleLangChange(lang.code as any)} className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${formData.language === lang.code ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                     <span className="text-3xl mb-2">{lang.flag}</span>
                     <span className="text-sm font-bold">{lang.label}</span>
                  </button>
               ))}
            </div>
         </div>
         <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Currency Symbol</label>
            <select value={formData.currencySymbol} onChange={e => setFormData({ ...formData, currencySymbol: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg">
               <option value="$">USD ($)</option>
               <option value="฿">Thai Baht (฿)</option>
               <option value="₭">Lao Kip (₭)</option>
            </select>
         </div>
      </div>
    </div>
  );
};
