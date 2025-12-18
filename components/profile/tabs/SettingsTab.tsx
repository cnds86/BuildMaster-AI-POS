
import React from 'react';

export const SettingsTab: React.FC = () => {
  return (
     <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
        <div>
           <h3 className="font-bold text-slate-800 mb-4">Appearance & Interface</h3>
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                 <p className="font-medium text-slate-700 text-sm">Dark Mode</p>
                 <p className="text-xs text-slate-500">Switch between light and dark themes</p>
              </div>
              <label className="relative inline-flex items-center cursor-not-allowed opacity-60">
                 <input type="checkbox" className="sr-only peer" disabled />
                 <div className="w-11 h-6 bg-slate-300 rounded-full peer-focus:outline-none"></div>
              </label>
           </div>
        </div>

        <div>
           <h3 className="font-bold text-slate-800 mb-4">Notifications</h3>
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center mb-3">
              <div>
                 <p className="font-medium text-slate-700 text-sm">Shift Reminders</p>
                 <p className="text-xs text-slate-500">Notify 1 hour before scheduled shift</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" className="sr-only peer" defaultChecked />
                 <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
           </div>
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                 <p className="font-medium text-slate-700 text-sm">System Alerts</p>
                 <p className="text-xs text-slate-500">Low stock and critical updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" className="sr-only peer" defaultChecked />
                 <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
           </div>
        </div>
     </div>
  );
};
