
import React, { useState } from 'react';
import { UnitDefinition, UnitCategory, VariantAttribute } from '../types';
import { Plus, Ruler, Tag } from 'lucide-react';
import { UnitList } from './unit/UnitList';
import { UnitFormModal } from './unit/UnitFormModal';
import { AttributeList } from './unit/AttributeList';
import { AttributeFormModal } from './unit/AttributeFormModal';
import { useGlobal } from '../context/GlobalContext';

interface UnitManagementProps {
  units: UnitDefinition[];
  onAddUnit: (unit: UnitDefinition) => void;
  onUpdateUnit: (unit: UnitDefinition) => void;
  onDeleteUnit: (id: string) => void;
}

export const UnitManagement: React.FC<UnitManagementProps> = ({ units, onAddUnit, onUpdateUnit, onDeleteUnit }) => {
  const { 
    attributes, 
    addAttribute, 
    updateAttribute, 
    deleteAttribute 
  } = useGlobal();

  const [mainTab, setMainTab] = useState<'units' | 'attributes'>('units');
  const [activeCategory, setActiveCategory] = useState<UnitCategory>('Length');
  
  // Unit Modal State
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Partial<UnitDefinition>>({
    name: '',
    symbol: '',
    category: 'Length',
    baseFactor: 1,
    isBase: false
  });

  // Attribute Modal State
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<Partial<VariantAttribute>>({
    name: '',
    values: []
  });

  // --- Unit Handlers ---
  const handleOpenUnitModal = (unit?: UnitDefinition) => {
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
    setIsUnitModalOpen(true);
  };

  const handleUnitSubmit = (formData: Partial<UnitDefinition>) => {
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
    setIsUnitModalOpen(false);
  };

  // --- Attribute Handlers ---
  const handleOpenAttrModal = (attr?: VariantAttribute) => {
    if (attr) {
      setEditingAttr({ ...attr });
    } else {
      setEditingAttr({ name: '', values: [] });
    }
    setIsAttrModalOpen(true);
  };

  const handleAttrSubmit = (formData: Partial<VariantAttribute>) => {
    if (formData.id) {
      updateAttribute(formData as VariantAttribute);
    } else {
      addAttribute({
        ...formData,
        id: `va-${Date.now()}`
      } as VariantAttribute);
    }
    setIsAttrModalOpen(false);
  };

  return (
    <div className="space-y-6 h-full flex flex-col pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Unit & Attribute Management</h2>
          <p className="text-slate-500">Configure global units, dimensions, and product variant options.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => mainTab === 'units' ? handleOpenUnitModal() : handleOpenAttrModal()}
             className="flex items-center justify-center px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold shadow-sm whitespace-nowrap"
           >
             <Plus className="w-5 h-5 mr-2" />
             {mainTab === 'units' ? 'Add Unit' : 'Add Attribute'}
           </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
         <button
            onClick={() => setMainTab('units')}
            className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
               mainTab === 'units' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
         >
            <Ruler className="w-4 h-4 mr-2" /> Units of Measure
         </button>
         <button
            onClick={() => setMainTab('attributes')}
            className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
               mainTab === 'attributes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
         >
            <Tag className="w-4 h-4 mr-2" /> Variant Attributes
         </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200">
         {mainTab === 'units' ? (
            <div className="p-4 flex flex-col h-full">
               <UnitList 
                  units={units}
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                  onEdit={handleOpenUnitModal}
                  onDelete={onDeleteUnit}
               />
            </div>
         ) : (
            <AttributeList 
               attributes={attributes}
               onEdit={handleOpenAttrModal}
               onDelete={deleteAttribute}
            />
         )}
      </div>

      {/* Modals */}
      <UnitFormModal 
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        onSubmit={handleUnitSubmit}
        initialData={editingUnit}
        activeCategory={activeCategory}
        units={units}
      />

      <AttributeFormModal 
        isOpen={isAttrModalOpen}
        onClose={() => setIsAttrModalOpen(false)}
        onSubmit={handleAttrSubmit}
        initialData={editingAttr}
      />
    </div>
  );
};
