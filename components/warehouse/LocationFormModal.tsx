
import React, { useState, useEffect } from 'react';
import { StorageLocation } from '../../types';
import { XCircle } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="text-lg font-bold text-slate-800">
            {initialData ? 'Edit Location' : 'Add Location'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Zone</label>
              <input
                required
                type="text"
                value={form.zone}
                onChange={e => setForm({...form, zone: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                placeholder="A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rack</label>
              <input
                required
                type="text"
                value={form.rack}
                onChange={e => setForm({...form, rack: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Shelf/Level</label>
              <input
                required
                type="text"
                value={form.shelf}
                onChange={e => setForm({...form, shelf: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bin/Slot</label>
              <input
                required
                type="text"
                value={form.bin}
                onChange={e => setForm({...form, bin: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="A"
              />
            </div>
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Storage Type</label>
             <select
               value={form.type}
               onChange={e => setForm({...form, type: e.target.value as any})}
               className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
             >
               <option value="Shelf">Shelf</option>
               <option value="Pallet">Pallet</option>
               <option value="Floor">Floor</option>
             </select>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 uppercase font-bold">Preview Code:</span>
            <div className="font-mono text-lg font-bold text-primary-700 mt-1">
               {form.zone || '?'}-{form.rack || '?'}-{form.shelf || '?'}-{form.bin || '?'}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="px-6 py-2 bg-construction-orange text-white rounded-lg hover:bg-orange-600 font-medium">Save Location</button>
          </div>
        </form>
      </div>
    </div>
  );
};
