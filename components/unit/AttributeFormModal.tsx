
import React, { useState, useEffect } from 'react';
import { VariantAttribute } from '../../types';
import { X, Plus } from 'lucide-react';

interface AttributeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (attr: Partial<VariantAttribute>) => void;
  initialData: Partial<VariantAttribute>;
}

export const AttributeFormModal: React.FC<AttributeFormModalProps> = ({ 
  isOpen, onClose, onSubmit, initialData 
}) => {
  const [formData, setFormData] = useState<Partial<VariantAttribute>>(initialData);
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    setFormData(initialData);
    if (!initialData.values) {
        setFormData(prev => ({ ...prev, values: [] }));
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    onSubmit(formData);
    onClose();
  };

  const handleAddValue = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (newValue.trim()) {
      setFormData(prev => ({
        ...prev,
        values: [...(prev.values || []), newValue.trim()]
      }));
      setNewValue('');
    }
  };

  const handleRemoveValue = (index: number) => {
    setFormData(prev => ({
      ...prev,
      values: (prev.values || []).filter((_, i) => i !== index)
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddValue(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="text-xl font-bold text-slate-800">
            {initialData.id ? 'Edit Attribute' : 'New Attribute'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Attribute Name</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Color, Size, Material"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Options / Values</label>
            <div className="flex gap-2 mb-3">
               <input
                 type="text"
                 value={newValue}
                 onChange={e => setNewValue(e.target.value)}
                 onKeyDown={handleKeyDown}
                 className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                 placeholder="Type value & press Enter"
               />
               <button 
                 type="button" 
                 onClick={handleAddValue}
                 className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors"
               >
                 <Plus className="w-5 h-5" />
               </button>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 min-h-[100px] flex flex-wrap content-start gap-2">
               {formData.values && formData.values.length > 0 ? (
                  formData.values.map((val, idx) => (
                     <span key={idx} className="inline-flex items-center px-3 py-1 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 shadow-sm">
                        {val}
                        <button 
                           type="button"
                           onClick={() => handleRemoveValue(idx)}
                           className="ml-2 text-slate-400 hover:text-red-500"
                        >
                           <X className="w-3 h-3" />
                        </button>
                     </span>
                  ))
               ) : (
                  <p className="text-sm text-slate-400 w-full text-center py-4 italic">No options added yet.</p>
               )}
            </div>
          </div>

          <div className="flex justify-end pt-2 space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Save Attribute
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
