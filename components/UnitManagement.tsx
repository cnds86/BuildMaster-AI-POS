
import React, { useState } from 'react';
import { UnitDefinition, UnitCategory } from '../types';
import { Plus, Edit2, Trash2, Check, X, Ruler, Weight, Hash, Info } from 'lucide-react';

interface UnitManagementProps {
  units: UnitDefinition[];
  onAddUnit: (unit: UnitDefinition) => void;
  onUpdateUnit: (unit: UnitDefinition) => void;
  onDeleteUnit: (id: string) => void;
}

export const UnitManagement: React.FC<UnitManagementProps> = ({ units, onAddUnit, onUpdateUnit, onDeleteUnit }) => {
  const [activeCategory, setActiveCategory] = useState<UnitCategory>('Length');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<UnitDefinition>>({
    name: '',
    symbol: '',
    category: 'Length',
    baseFactor: 1,
    isBase: false
  });

  const categories: { id: UnitCategory; icon: any; label: string }[] = [
    { id: 'Length', icon: Ruler, label: 'Length' },
    { id: 'Weight', icon: Weight, label: 'Weight' },
    { id: 'Quantity', icon: Hash, label: 'Quantity' },
  ];

  const filteredUnits = units.filter(u => u.category === activeCategory);
  const baseUnit = filteredUnits.find(u => u.isBase);

  const handleOpenModal = (unit?: UnitDefinition) => {
    if (unit) {
      setEditingId(unit.id);
      setFormData({ ...unit });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        symbol: '',
        category: activeCategory,
        baseFactor: 1,
        isBase: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      onUpdateUnit({ ...formData, id: editingId } as UnitDefinition);
    } else {
      onAddUnit({
        ...formData,
        id: `u-${Date.now()}`,
        category: activeCategory // Ensure it stays in current category
      } as UnitDefinition);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Unit Management</h2>
          <p className="text-slate-500">Configure global units and conversion factors.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center px-4 py-2 bg-construction-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Unit
        </button>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-3 gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center justify-center py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-slate-800 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              <span className="font-medium">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Units Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
         <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversion Ratio</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUnits.map((unit) => (
                <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="font-medium text-slate-800">{unit.name}</span>
                      {unit.isBase && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-full">Base Unit</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 text-sm">
                      {unit.symbol}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {unit.isBase ? (
                      <span className="text-slate-400 italic">Reference Standard</span>
                    ) : (
                      <div className="flex items-center">
                        <span className="font-medium">1 {unit.symbol}</span>
                        <span className="mx-2 text-slate-400">=</span>
                        <span>{unit.baseFactor} {baseUnit?.symbol || 'base units'}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => handleOpenModal(unit)}
                        className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDeleteUnit(unit.id)}
                        disabled={unit.isBase}
                        className={`p-1.5 rounded transition-colors ${
                          unit.isBase 
                          ? 'text-slate-200 cursor-not-allowed' 
                          : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUnits.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              No units defined for this category.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Unit' : 'Add New Unit'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
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
                  Is this the Base Unit? (e.g. Piece for Quantity, Gram for Weight)
                </label>
              </div>

              {!formData.isBase && (
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Conversion / Base Factor
                  </label>
                  
                  <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                     <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">1 {formData.symbol || 'Unit'} =</span>
                     <input
                      type="number"
                      required
                      step="0.000001"
                      value={formData.baseFactor}
                      onChange={e => setFormData({...formData, baseFactor: parseFloat(e.target.value)})}
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-center font-bold text-slate-800 focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">{baseUnit?.name || 'Base Units'} ({baseUnit?.symbol})</span>
                  </div>

                  <div className="text-xs text-slate-500 mt-2 flex items-start bg-blue-50 p-2 rounded border border-blue-100 text-blue-800">
                    <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    {activeCategory === 'Quantity' ? (
                      <span>
                        <strong>Tip:</strong> For fixed units like <strong>Dozen</strong>, enter <strong>12</strong>. 
                        For container units (e.g., <strong>Box, Pack</strong>) that depend on the product, you can set a default of <strong>1</strong> here. 
                        You can override the exact ratio (e.g., 1 Box = 24 Pieces) when adding products in the Inventory.
                      </span>
                    ) : (
                      <span>
                        Example: If Base is <strong>{baseUnit?.symbol || 'g'}</strong>, and this is <strong>{formData.symbol || 'kg'}</strong>, enter <strong>1000</strong>.
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
      )}
    </div>
  );
};
