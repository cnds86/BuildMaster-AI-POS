
import React, { useState, useEffect } from 'react';
import { PosMachine } from '../../types';
import { X, Check, Monitor, Power, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface PosFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pos: Partial<PosMachine>) => void;
  initialData: PosMachine | null;
}

export const PosFormModal: React.FC<PosFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState<Partial<PosMachine>>({
    machineNumber: '', status: 'active'
  });

  useEffect(() => {
    if (initialData) setForm(initialData);
    else setForm({ machineNumber: '', status: 'active' });
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md flex flex-col overflow-hidden border border-white/20">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <Monitor className="w-5 h-5 text-slate-400" />
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {initialData ? 'Edit Terminal' : 'New Terminal'}
              </h3>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-7">Point of Sale Hardware</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-6">
            <Input 
              label="Terminal Identifier"
              icon={<Settings className="w-5 h-5" />}
              required
              value={form.machineNumber}
              onChange={e => setForm({...form, machineNumber: e.target.value.toUpperCase()})}
              placeholder="e.g. POS-01"
              className="font-mono text-lg"
            />

            <div className="space-y-1.5">
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Terminal Status</label>
               <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'active', label: 'Active (Online)', icon: Power, color: 'emerald' },
                    { id: 'maintenance', label: 'Maintenance', icon: Settings, color: 'amber' },
                    { id: 'inactive', label: 'Inactive', icon: Power, color: 'slate' }
                  ].map((status) => (
                    <button
                      key={status.id}
                      type="button"
                      onClick={() => setForm({...form, status: status.id as any})}
                      className={`flex items-center p-4 rounded-2xl border-2 transition-all text-left ${
                        form.status === status.id 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                          : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <status.icon className={`w-5 h-5 mr-3 ${form.status === status.id ? 'text-white' : `text-${status.color}-500`}`} />
                      <span className="font-bold text-sm">{status.label}</span>
                      {form.status === status.id && <Check className="w-4 h-4 ml-auto" />}
                    </button>
                  ))}
               </div>
            </div>
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
              size="lg"
              className="w-full sm:w-auto min-w-[180px]"
            >
              <Check className="w-5 h-5 mr-2" />
              Confirm Terminal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
