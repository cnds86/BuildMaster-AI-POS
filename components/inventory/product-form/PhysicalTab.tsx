
import React from 'react';
import { Product } from '../../../types';
import { Ruler } from 'lucide-react';

interface PhysicalTabProps {
  formData: Partial<Product>;
  handlePhysicalChange: (field: string, value: string) => void;
}

export const PhysicalTab: React.FC<PhysicalTabProps> = ({ formData, handlePhysicalChange }) => {
  return (
     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
        <h4 className="font-bold text-slate-800 mb-4 flex items-center"><Ruler className="w-5 h-5 mr-2" /> Dimensions & Weight</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div><label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label><input type="number" value={formData.physical?.weight || 0} onChange={e => handlePhysicalChange('weight', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" /></div>
           <div className="grid grid-cols-3 gap-2">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Length</label><input type="number" value={formData.physical?.depth || 0} onChange={e => handlePhysicalChange('depth', e.target.value)} className="w-full px-2 py-2 border border-slate-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Width</label><input type="number" value={formData.physical?.width || 0} onChange={e => handlePhysicalChange('width', e.target.value)} className="w-full px-2 py-2 border border-slate-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Height</label><input type="number" value={formData.physical?.height || 0} onChange={e => handlePhysicalChange('height', e.target.value)} className="w-full px-2 py-2 border border-slate-300 rounded-lg" /></div>
           </div>
        </div>
     </div>
  );
};
