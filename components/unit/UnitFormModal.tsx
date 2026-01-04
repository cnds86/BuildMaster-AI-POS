import React, { useState, useEffect } from 'react';
import { UnitDefinition, UnitCategory } from '../../types';
import { X, ArrowRightLeft, Info, Check, CornerDownRight, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
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
  // Find current parent and base for UI logic
  const parentUnit = formData.parentId ? filteredUnits.find(u => u.id === formData.parentId) : null;
  const baseUnit = filteredUnits.find(u => u.isBase);
  const displayTargetSymbol = parentUnit?.symbol || baseUnit?.symbol || 'base';

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
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
                   <CornerDownRight className="w-3 h-3 mr-1" /> Immediate Parent
                </label>
                <select 
                   className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3.5 px-4 transition-all outline-none font-bold text-slate-800 focus:ring-4 focus:ring-orange-100 focus:border-construction-orange focus:bg-white appearance-none disabled:opacity-50"
                   value={formData.parentId || ''}
                   onChange={e => setFormData({...formData, parentId: e.target.value || null})}
                   disabled={formData.isBase}
                >
                   <option value="">No Parent (Root Level)</option>
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
                      <div className={cn(
                         "w-12 h-6 rounded-full transition-all",
                         formData.isBase ? "bg-construction-orange" : "bg-slate-200"
                      )}></div>
                      <div className={cn(
                         "absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm",
                         formData.isBase && "translate-x-6"
                      )}></div>
                   </div>
                   <span className="ml-3 text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-700 transition-colors">Smallest Base Unit</span>
                </label>
             </div>
          </div>

          {!formData.isBase && (
             <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/10 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <ArrowRightLeft className="w-32 h-32 text-white" />
                </div>
                
                <div className="flex items-center justify-between relative z-10">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Scale Definition</h4>
                   <Badge variant="primary" className="bg-orange-500 text-white border-transparent">Active Rule</Badge>
                </div>
                
                <div className="flex items-center gap-4 relative z-10">
                   <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">THIS UNIT</p>
                      <p className="font-black text-white text-lg">1 {formData.symbol || '?'}</p>
                   </div>
                   
                   <div className="p-3 bg-white text-slate-900 rounded-full shadow-lg">
                      <ArrowRight className="w-5 h-5" />
                   </div>

                   <div className="flex-1 space-y-2">
                      <p className="text-center text-[9px] font-black text-slate-400 uppercase">CONVERSION FACTOR</p>
                      <Input 
                        type="number"
                        step="0.001"
                        value={formData.baseFactor}
                        onChange={e => setFormData({...formData, baseFactor: parseFloat(e.target.value) || 0})}
                        className="text-center text-2xl h-16 bg-white border-transparent focus:ring-orange-500 text-slate-900"
                        placeholder="Qty"
                      />
                   </div>

                   <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">TARGET UNIT</p>
                      <p className="font-black text-white text-lg">{displayTargetSymbol}</p>
                   </div>
                </div>
                
                <div className="flex items-start gap-2 text-[10px] font-bold text-slate-400 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 relative z-10">
                   <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                   <p className="leading-relaxed">
                      Entering <strong>{formData.baseFactor || '0'}</strong> defines that one <strong>{formData.name || 'unit'}</strong> consists of {formData.baseFactor || '0'} <strong>{parentUnit?.name || baseUnit?.name || 'base units'}</strong>.
                   </p>
                </div>
             </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              variant="primary"
              size="xl"
              className="min-w-[220px]"
            >
              <Check className="w-5 h-5 mr-2" />
              Finalize Unit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};