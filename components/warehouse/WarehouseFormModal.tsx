
import React, { useState, useEffect } from 'react';
import { Warehouse } from '../../types';
import { X, Check, Container, Info } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface WarehouseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Warehouse>) => void;
  initialData: Warehouse | null;
}

export const WarehouseFormModal: React.FC<WarehouseFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState<Partial<Warehouse>>({
    name: '', code: '', type: 'General', description: ''
  });

  useEffect(() => {
    if (initialData) setForm(initialData);
    else setForm({ name: '', code: '', type: 'General', description: '' });
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl flex flex-col overflow-hidden border border-white/20">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <Container className="w-5 h-5 text-slate-400" />
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {initialData ? 'Edit Facility' : 'Register Facility'}
              </h3>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-7">Warehouse & Logistics Definition</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-6">
            <Input 
              label="Warehouse Name"
              required
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="e.g. Central Distribution Center"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Facility Code"
                required
                value={form.code}
                onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                placeholder="CDC-01"
                className="font-mono"
              />
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logistics Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value as any})}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3.5 px-4 transition-all outline-none font-bold text-slate-800 focus:ring-4 focus:ring-orange-100 focus:border-construction-orange focus:bg-white appearance-none"
                >
                  <option value="General">General Logistics</option>
                  <option value="Cold Storage">Cold Storage</option>
                  <option value="Hazardous">Hazardous Materials</option>
                  <option value="Showroom">Showroom / Display</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Notes</label>
               <textarea
                 value={form.description || ''}
                 onChange={e => setForm({...form, description: e.target.value})}
                 className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 transition-all outline-none font-bold text-slate-800 focus:ring-4 focus:ring-orange-100 focus:border-construction-orange focus:bg-white resize-none h-24 placeholder:text-slate-300"
                 placeholder="Site details, access codes, or primary contents..."
               />
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
             <div className="p-2 bg-white rounded-xl shadow-sm">
                <Info className="w-5 h-5 text-blue-500" />
             </div>
             <p className="text-xs font-bold text-blue-700 leading-relaxed">
                Facilities are branch-specific. Once created, you can define storage zones and rack layouts for granular inventory tracking.
             </p>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Discard
            </button>
            <Button
              type="submit"
              variant="primary"
              size="xl"
              className="min-w-[200px]"
            >
              <Check className="w-5 h-5 mr-2" />
              Save Facility
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
