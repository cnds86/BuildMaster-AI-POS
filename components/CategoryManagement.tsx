import React, { useState } from 'react';
import { CategoryItem } from '../types';
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  CornerDownRight,
  Layers
} from 'lucide-react';

interface CategoryManagementProps {
  categories: CategoryItem[];
  onAddCategory: (category: CategoryItem) => void;
  onUpdateCategory: (category: CategoryItem) => void;
  onDeleteCategory: (id: string) => void;
}

interface TreeNodeProps {
  node: CategoryItem;
  level: number;
  allCategories: CategoryItem[];
  onAdd: (parentId: string | null) => void;
  onEdit: (cat: CategoryItem) => void;
  onDelete: (id: string) => void;
}

const CategoryTreeNode: React.FC<TreeNodeProps> = ({ 
  node, 
  level, 
  allCategories, 
  onAdd, 
  onEdit, 
  onDelete 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const children = allCategories.filter(c => c.parentId === node.id);
  const hasChildren = children.length > 0;

  const handleToggle = () => setIsExpanded(!isExpanded);

  return (
    <div className="select-none">
      <div 
        className={`flex items-center p-3 hover:bg-slate-50 border-b border-slate-100 transition-colors group ${level === 0 ? 'bg-white' : ''}`}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
      >
        <div className="flex items-center flex-1">
          <button 
            onClick={handleToggle}
            className={`mr-2 p-1 rounded-md text-slate-400 hover:bg-slate-200 transition-colors ${!hasChildren ? 'invisible' : ''}`}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          <div className={`mr-3 p-1.5 rounded-lg ${level === 0 ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
            {isExpanded ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
          </div>
          
          <div className="flex flex-col">
            <span className={`font-medium ${level === 0 ? 'text-slate-800' : 'text-slate-700'}`}>
              {node.name}
            </span>
            {node.description && (
              <span className="text-xs text-slate-400">{node.description}</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity px-2">
          <button 
            onClick={() => onAdd(node.id)}
            title="Add Sub-category"
            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onEdit(node)}
            title="Edit"
            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(node.id)}
            title="Delete"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && children.map(child => (
        <CategoryTreeNode 
          key={child.id} 
          node={child} 
          level={level + 1} 
          allCategories={allCategories}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export const CategoryManagement: React.FC<CategoryManagementProps> = ({ 
  categories, 
  onAddCategory, 
  onUpdateCategory, 
  onDeleteCategory 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);
  const [targetParentId, setTargetParentId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CategoryItem>>({
    name: '',
    description: '',
    parentId: null
  });

  const rootCategories = categories.filter(c => c.parentId === null);

  const handleOpenAdd = (parentId: string | null) => {
    setEditingCat(null);
    setTargetParentId(parentId);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCat) {
      onUpdateCategory({ ...formData, id: editingCat.id } as CategoryItem);
    } else {
      onAddCategory({
        ...formData,
        id: `c-${Date.now()}`,
      } as CategoryItem);
    }
    setIsModalOpen(false);
  };

  const getParentName = (id: string | null) => {
    if (!id) return 'Root (Top Level)';
    const parent = categories.find(c => c.id === id);
    return parent ? parent.name : 'Unknown';
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Category Management</h2>
          <p className="text-slate-500">Organize product hierarchy with nested categories.</p>
        </div>
        <button 
          onClick={() => handleOpenAdd(null)}
          className="flex items-center justify-center px-4 py-2 bg-construction-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Root Category
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center text-sm font-semibold text-slate-500 uppercase tracking-wide">
          <Layers className="w-4 h-4 mr-2" />
          Category Structure
        </div>
        <div className="overflow-y-auto flex-1">
          {rootCategories.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-slate-400">
               <Layers className="w-12 h-12 mb-4 opacity-20" />
               <p>No categories defined.</p>
             </div>
          ) : (
            rootCategories.map(node => (
              <CategoryTreeNode 
                key={node.id}
                node={node}
                level={0}
                allCategories={categories}
                onAdd={handleOpenAdd}
                onEdit={handleOpenEdit}
                onDelete={onDeleteCategory}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {editingCat ? 'Edit Category' : 'Add New Category'}
                </h3>
                <p className="text-sm text-slate-500 mt-1 flex items-center">
                  <CornerDownRight className="w-3 h-3 mr-1" />
                  Parent: <span className="font-semibold ml-1">{getParentName(formData.parentId || null)}</span>
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Electrical Fittings"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none h-24"
                  placeholder="Additional details..."
                />
              </div>

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
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};