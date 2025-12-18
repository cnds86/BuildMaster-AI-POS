
import React, { useState } from 'react';
import { UnitDefinition, UnitCategory } from '../types';
import { Plus } from 'lucide-react';
import { UnitList } from './unit/UnitList';
import { UnitFormModal } from './unit/UnitFormModal';

interface UnitManagementProps {
  units: UnitDefinition[];
  onAddUnit: (unit: UnitDefinition) => void;
  onUpdateUnit: (unit: UnitDefinition) => void;
  onDeleteUnit: (id: string) => void;
}

export const UnitManagement: React.FC<UnitManagementProps> = ({ units, onAddUnit, onUpdateUnit, onDeleteUnit }) => {
  const [activeCategory, setActiveCategory] = useState<UnitCategory>('Length');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Partial<UnitDefinition>>({
    name: '',
    symbol: '',
    category: 'Length',
    baseFactor: 1,
    isBase: false
  });

  const handleOpenModal = (unit?: UnitDefinition) => {
    if (unit) {
      setEditingUnit({ ...unit });
    } else {
      setEditingUnit({
        name: '',
        symbol: '',
        category: activeCategory,
        baseFactor: 1,
        isBase: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (formData: Partial<UnitDefinition>) => {
    // Enforce Single Base Unit Rule
    if (formData.isBase) {
      const categoryToCheck = formData.id ? formData.category : activeCategory;
      const existingBase = units.find(u => 
        u.category === categoryToCheck && 
        u.isBase && 
        u.id !== formData.id
      );
      
      if (existingBase) {
        // Automatically unmark the previous base unit
        onUpdateUnit({ ...existingBase, isBase: false });
      }
    }

    if (formData.id) {
      onUpdateUnit(formData as UnitDefinition);
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
    <div className="space-y-6 h-full flex flex-col pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Unit Management</h2>
          <p className="text-slate-500">Configure global units and conversion factors.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold shadow-sm whitespace-nowrap"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Unit
        </button>
      </div>

      <UnitList 
        units={units}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onEdit={handleOpenModal}
        onDelete={onDeleteUnit}
      />

      {/* Modal */}
      <UnitFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingUnit}
        activeCategory={activeCategory}
        units={units}
      />
    </div>
  );
};
