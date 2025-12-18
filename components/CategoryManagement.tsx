
import React, { useState } from 'react';
import { CategoryItem } from '../types';
import { Plus } from 'lucide-react';
import { CategoryTree } from './category/CategoryTree';
import { CategoryFormModal } from './category/CategoryFormModal';

interface CategoryManagementProps {
  categories: CategoryItem[];
  onAddCategory: (category: CategoryItem) => void;
  onUpdateCategory: (category: CategoryItem) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({ 
  categories, 
  onAddCategory, 
  onUpdateCategory, 
  onDeleteCategory 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);
  
  const [formData, setFormData] = useState<Partial<CategoryItem>>({
    name: '',
    description: '',
    parentId: null
  });

  const handleOpenAdd = (parentId: string | null) => {
    setEditingCat(null);
    setFormData({
      name: '',
      description: '',
      parentId: parentId
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCat(cat);
    setFormData({ ...cat });
    setIsModalOpen(true);
  };

  const handleSubmit = (data: Partial<CategoryItem>) => {
    if (editingCat) {
      onUpdateCategory({ ...data, id: editingCat.id } as CategoryItem);
    } else {
      onAddCategory({
        ...data,
        id: `c-${Date.now()}`,
      } as CategoryItem);
    }
    setIsModalOpen(false);
  };

  const getParentName = (id: string | null | undefined) => {
    if (!id) return 'Root (Top Level)';
    const parent = categories.find(c => c.id === id);
    return parent ? parent.name : 'Unknown';
  };

  return (
    <div className="space-y-6 h-full flex flex-col pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Category Management</h2>
          <p className="text-slate-500">Organize product hierarchy with nested categories.</p>
        </div>
        <button 
          onClick={() => handleOpenAdd(null)}
          className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold shadow-sm whitespace-nowrap w-full md:w-auto justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Root Category
        </button>
      </div>

      <CategoryTree 
        categories={categories}
        onAdd={handleOpenAdd}
        onEdit={handleOpenEdit}
        onDelete={onDeleteCategory}
      />

      <CategoryFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={formData}
        parentName={getParentName(formData.parentId)}
      />
    </div>
  );
};
