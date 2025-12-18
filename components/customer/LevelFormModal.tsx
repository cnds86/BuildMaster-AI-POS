
import React, { useState, useEffect } from 'react';
import { CustomerLevel } from '../../types';
import { X } from 'lucide-react';

interface LevelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (level: CustomerLevel) => void;
  initialData?: CustomerLevel;
}

export const LevelFormModal: React.FC<LevelFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [levelForm, setLevelForm] = useState<Partial<CustomerLevel>>({
    name: '',
    discountPercentage: 0,
    color: '#64748b'
  });

  useEffect(() => {
    if (initialData) {
      setLevelForm(initialData);
    } else {
      setLevelForm({
        name: '',
        discountPercentage: 0,
        color: '#64748b'
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelForm.name) return;
    
    // Pass ID if editing, otherwise parent handles new ID
    const submission = { ...levelForm, id: initialData?.id } as CustomerLevel;
    onSubmit(submission);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-fade-in">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="text-lg font-bold text-slate-800">
            {initialData ? 'Edit Level' : 'New Level'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Level Name</label>
             <input
               required
               type="text"
               value={levelForm.name}
               onChange={e => setLevelForm({...levelForm, name: e.target.value})}
               className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
               placeholder="e.g. Gold Member"
             />
          </div>
          
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Discount Percentage</label>
             <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={levelForm.discountPercentage}
                  onChange={e => setLevelForm({...levelForm, discountPercentage: parseFloat(e.target.value) || 0})}
                  className="w-full pl-4 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-bold"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-2">Badge Color</label>
             <div className="flex gap-2">
                {['#64748b', '#eab308', '#94a3b8', '#8b5cf6', '#ef4444', '#22c55e', '#3b82f6'].map(color => (
                   <button
                      key={color}
                      type="button"
                      onClick={() => setLevelForm({...levelForm, color})}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${levelForm.color === color ? 'border-slate-800 ring-2 ring-slate-300' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                   />
                ))}
             </div>
          </div>

          <div className="flex justify-end pt-4 space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition-colors shadow-sm"
            >
              Save Level
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
