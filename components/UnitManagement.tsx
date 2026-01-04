
import React, { useState } from 'react';
import { UnitDefinition, UnitCategory } from '../types';
import { Plus, Scale } from 'lucide-react';
import { UnitTree } from './unit/UnitTree';
import { UnitFormModal } from './unit/UnitFormModal';
import { Button } from './ui/Button';

interface UnitManagementProps {
  units: UnitDefinition[];
  onAddUnit: (unit: UnitDefinition) => void;
  onUpdateUnit: (unit: UnitDefinition) => void;
  onDeleteUnit: (id: string) => void;
}

export const UnitManagement: React.FC<UnitManagementProps> = ({ units, onAddUnit, onUpdateUnit, onDeleteUnit }) => {
  const [activeCategory, setActiveCategory] = useState<UnitCategory>('Quantity');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Partial<UnitDefinition>>({
    name: '',
    symbol: '',
    category: 'Quantity',
    baseFactor: 1,
    isBase: false,
    parentId: null
  });

  const handleOpenModal = (unit?: UnitDefinition, parentId?: string | null) => {
    if (unit) {
      setEditingUnit({ ...unit });
    } else {
      setEditingUnit({
        name: '',
        symbol: '',
        category: activeCategory,
        baseFactor: 1,
        isBase: false,
        parentId: parentId || null
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
        onUpdateUnit({ ...existingBase, isBase: false });
      }
    }

    if (formData.id) {
      onUpdateUnit(formData as UnitDefinition);
    } else {
      onAddUnit({
        ...formData,
        id: `u-${Date.now()}`,
        category: activeCategory
      } as UnitDefinition);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 h-full flex flex-col pb-20 md:pb-0 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-slate-900 text-white rounded-xl">
                <Scale className="w-5 h-5" />
             </div>
             <h2 className="text-4xl font-black text-slate-900 tracking-tight">Unit Management</h2>
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] ml-11">
            Global standard units and conversion tree
          </p>
        </div>

        <Button 
          variant="primary" 
          size="lg" 
          onClick={() => handleOpenModal()}
          className="rounded-2xl"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Root Unit
        </Button>
      </div>

      {/* Style A: Category Selector */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit shadow-inner">
        {(['Quantity', 'Weight', 'Length'] as UnitCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeCategory === cat 
                ? 'bg-white text-slate-900 shadow-md scale-105' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col">
        <UnitTree 
          units={units.filter(u => u.category === activeCategory)}
          onAdd={handleOpenModal}
          onEdit={handleOpenModal}
          onDelete={onDeleteUnit}
        />
      </div>

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
