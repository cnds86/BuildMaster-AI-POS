
import React, { useState, useEffect } from 'react';
import { UnitDefinition, UnitCategory } from '../../types';
import { X, ArrowRightLeft, Info } from 'lucide-react';

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
  const [referenceUnitId, setReferenceUnitId] = useState<string>('');

  const filteredUnits = units.filter(u => u.category === activeCategory);
  const baseUnit = filteredUnits.find(u => u.isBase);

  useEffect(() => {
    setFormData(initialData);
    if (initialData.id) {
        // Editing existing: set reference to base unit if not base itself
        const currentBase = units.find(u => u.category === initialData.category && u.isBase);
        setReferenceUnitId(currentBase?.id || '');
    } else {
        // New unit
        setFormData({
            name: '',
            symbol: '',
            category: activeCategory,
            baseFactor: 1,
            isBase: false
        });
        const currentBase = units.find(u => u.category === activeCategory && u.isBase);
        setReferenceUnitId(currentBase?.id || '');
    }
  }, [initialData, isOpen, activeCategory, units]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const getDisplayRatio = () => {
    if (formData.isBase) return 1;
    if (!referenceUnitId) return formData.baseFactor || 1;
    
    const refUnit = units.find(u => u.id === referenceUnitId);
    if (!refUnit || refUnit.baseFactor === 0) return 0;
    
    // Calculate ratio
    const ratio = (formData.baseFactor || 0) / refUnit.baseFactor;
    return parseFloat(ratio.toFixed(6)); 
  };

  const handleRatioChange = (val: number) => {
    const refUnit = units.find(u => u.id === referenceUnitId);
    const refFactor = refUnit ? refUnit.baseFactor : 1;
    setFormData({ ...formData, baseFactor: val * refFactor });
  };

  const selectedRefUnit = units.find(u => u.id === referenceUnitId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="text-xl font-bold text-slate-800">
            {initialData.id ? 'Edit Unit' : 'Add New Unit'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unit Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder={activeCategory === 'Quantity' ? 'e.g. Dozen, Pack, Box' : 'e.g. Kilogram'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Symbol / Abbreviation</label>
            <input
              type="text"
              required
              value={formData.symbol}
              onChange={e => setFormData({...formData, symbol: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder={activeCategory === 'Quantity' ? 'e.g. doz, pk, box' : 'e.g. kg'}
            />
          </div>

          <div className="flex items-center space-x-2 my-2">
             <input
              type="checkbox"
              id="isBase"
              checked={formData.isBase}
              onChange={e => setFormData({...formData, isBase: e.target.checked, baseFactor: 1})}
              className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isBase" className="text-sm font-medium text-slate-700">
              Is this the Base Unit? (e.g. Piece, Gram)
            </label>
          </div>

          {!formData.isBase && (
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Conversion Definition
              </label>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                 <div className="flex items-center space-x-3">
                    <span className="font-bold text-slate-800 text-sm whitespace-nowrap">
                       1 {formData.symbol || 'Unit'}
                    </span>
                    <ArrowRightLeft className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    
                    <div className="flex-1 flex items-center space-x-2">
                       <input
                          type="number"
                          required
                          step="0.000001"
                          value={getDisplayRatio()}
                          onChange={e => handleRatioChange(parseFloat(e.target.value))}
                          className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-center font-bold text-slate-800 focus:ring-2 focus:ring-primary-500"
                       />
                       <select
                          value={referenceUnitId}
                          onChange={e => setReferenceUnitId(e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 text-sm"
                       >
                          {filteredUnits.map(u => (
                             <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                          ))}
                       </select>
                    </div>
                 </div>

                 <div className="text-xs text-slate-500 flex items-start bg-blue-50 p-2 rounded border border-blue-100 text-blue-800">
                    <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                       <span>
                          Stored as: <strong>{formData.baseFactor?.toLocaleString()} {baseUnit?.symbol}</strong> (Base).
                       </span>
                       {selectedRefUnit && !selectedRefUnit.isBase && (
                          <div className="mt-1">
                             Defining relative to <strong>{selectedRefUnit.name}</strong> makes it easy to set up hierarchies (e.g. 1 Pallet = 50 Boxes).
                          </div>
                       )}
                    </div>
                 </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-construction-orange text-white font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
            >
              Save Unit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
