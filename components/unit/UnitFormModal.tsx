
import React, { useState, useEffect } from 'react';
import { UnitDefinition, UnitCategory } from '../../types';
import { X, ArrowRightLeft, Info, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
// Fix: Added missing imports for cn and Badge
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface UnitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (unit: Partial<UnitDefinition>) => void;
  initialData: Partial<UnitDefinition>;
  activeCategory: UnitCategory;
  units: UnitDefinition[];
}

export const UnitFormModal: React.FC<UnitFormModalProps> = ({ 
  isOpen, onClose, onSubmit, initialData, activeCategory, units 
}) => {
  const [formData, setFormData] = useState<Partial<UnitDefinition>>(initialData);
  
  const filteredUnits = units.filter(u => u.category === activeCategory);
  const baseUnit = filteredUnits.find(u => u.isBase);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl flex flex-col overflow-hidden border border-white/20">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {initialData.id ? 'Edit Unit' : 'Add New Unit'}
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Definition & Conversion</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Unit Name"
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Dozen"
            />
            <Input 
              label="Symbol"
              required
              value={formData.symbol}
              onChange={e => setFormData({...formData, symbol: e.target.value})}
              placeholder="e.g. doz"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Relationship</label>
                <select 
                   className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3.5 px-4 transition-all outline-none font-bold text-slate-800 focus:ring-4 focus:ring-orange-100 focus:border-construction-orange focus:bg-white appearance-none"
                   value={formData.parentId || ''}
                   onChange={e => setFormData({...formData, parentId: e.target.value || null})}
                >
                   <option value="">No Parent (Root)</option>
                   {filteredUnits.filter(u => u.id !== formData.id).map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                   ))}
                </select>
             </div>

             <div className="flex items-center h-full pt-6">
                <label className="flex items-center cursor-pointer group">
                   <div className="relative">
                      <input 
                         type="checkbox" 
                         className="sr-only"
                         checked={formData.isBase}
                         onChange={e => setFormData({...formData, isBase: e.target.checked, parentId: null, baseFactor: 1})}
                      />
                      {/* Fix: Added missing import usage for cn */}
                      <div className={cn(
                         "w-12 h-6 rounded-full transition-all",
                         formData.isBase ? "bg-construction-orange" : "bg-slate-200"
                      )}></div>
                      {/* Fix: Added missing import usage for cn */}
                      <div className={cn(
                         "absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform",
                         formData.isBase && "translate-x-6"
                      )}></div>
                   </div>
                   <span className="ml-3 text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-700 transition-colors">Base Unit</span>
                </label>
             </div>
          </div>

          {!formData.isBase && (
             <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Conversion Rule</h4>
                   {/* Fix: Added missing component Badge */}
                   <Badge variant="slate">Logic</Badge>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200 text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Source</p>
                      <p className="font-black text-slate-900">1 {formData.symbol || '?'}</p>
                   </div>
                   
                   <div className="p-2 bg-slate-900 text-white rounded-full shadow-lg">
                      <ArrowRightLeft className="w-4 h-4" />
                   </div>

                   <div className="flex-1 space-y-1">
                      <Input 
                        type="number"
                        step="0.001"
                        value={formData.baseFactor}
                        onChange={e => setFormData({...formData, baseFactor: parseFloat(e.target.value) || 0})}
                        className="text-center text-xl h-14"
                      />
                   </div>
                </div>
                
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 px-2 py-1 italic bg-white/50 rounded-lg border border-slate-100">
                   <Info className="w-3.5 h-3.5 text-blue-500" />
                   <span>Factor relative to the global <strong>Base Unit</strong>.</span>
                </div>
             </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
            >
              Cancel
            </button>
            <Button
              type="submit"
              variant="primary"
              size="xl"
              className="min-w-[200px]"
            >
              <Check className="w-5 h-5 mr-2" />
              Save Unit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
