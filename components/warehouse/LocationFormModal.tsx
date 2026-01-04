
import React, { useState, useEffect } from 'react';
import { StorageLocation } from '../../types';
import { X, Check, Grid, Hash, Layers } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<StorageLocation>) => void;
  initialData: StorageLocation | null;
}

export const LocationFormModal: React.FC<LocationFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState<Partial<StorageLocation>>({
    zone: '', rack: '', shelf: '', bin: '', type: 'Shelf'
  });

  useEffect(() => {
    if (initialData) setForm(initialData);
    else setForm({ zone: '', rack: '', shelf: '', bin: '', type: 'Shelf' });
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
               <Grid className="w-5 h-5 text-slate-400" />
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {initialData ? 'Edit Location' : 'Map New Location'}
              </h3>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-7">Internal Warehouse Address</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <Input 
              label="Zone Identifier"
              required
              value={form.zone}
              onChange={e => setForm({...form, zone: e.target.value.toUpperCase()})}
              placeholder="e.g. A"
              maxLength={2}
              className="text-center font-black"
            />
            <Input 
              label="Rack / Aisle"
              required
              value={form.rack}
              onChange={e => setForm({...form, rack: e.target.value})}
              placeholder="01"
              className="text-center font-bold"
            />
            <Input 
              label="Shelf / Level"
              required
              value={form.shelf}
              onChange={e => setForm({...form, shelf: e.target.value})}
              placeholder="1"
              className="text-center font-bold"
            />
            <Input 
              label="Bin / Slot"
              required
              value={form.bin}
              onChange={e => setForm({...form, bin: e.target.value.toUpperCase()})}
              placeholder="A"
              className="text-center font-bold"
            />
          </div>

          <div className="space-y-1.5">
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Storage Strategy</label>
             <div className="grid grid-cols-3 gap-3">
                {['Shelf', 'Pallet', 'Floor'].map((type) => (
                   <button
                      key={type}
                      type="button"
                      onClick={() => setForm({...form, type: type as any})}
                      className={`py-3 px-4 rounded-2xl border-2 font-bold text-xs transition-all ${
                         form.type === type 
                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg' 
                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                      }`}
                   >
                      {type}
                   </button>
                ))}
             </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <Hash className="w-32 h-32 text-white" />
             </div>
             <div className="relative z-10 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">System Mapping Code</p>
                <div className="flex items-center justify-center gap-2">
                   <div className="px-5 py-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/5 text-3xl font-black text-white tracking-tighter">
                      {form.zone || '?'}
                   </div>
                   <span className="text-white/20 font-black text-2xl">-</span>
                   <div className="px-5 py-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/5 text-3xl font-black text-white tracking-tighter">
                      {form.rack || '??'}
                   </div>
                   <span className="text-white/20 font-black text-2xl">-</span>
                   <div className="px-5 py-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/5 text-3xl font-black text-white tracking-tighter">
                      {form.shelf || '?'}
                   </div>
                   <span className="text-white/20 font-black text-2xl">-</span>
                   <div className="px-5 py-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/5 text-3xl font-black text-white tracking-tighter">
                      {form.bin || '?'}
                   </div>
                </div>
             </div>
          </div>

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
              className="min-w-[200px]"
            >
              <Check className="w-5 h-5 mr-2" />
              Save Location
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
