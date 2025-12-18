
import React, { useState } from 'react';
import { CategoryItem } from '../../types';
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit2, 
  Trash2,
  Layers
} from 'lucide-react';

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

interface CategoryTreeProps {
  categories: CategoryItem[];
  onAdd: (parentId: string | null) => void;
  onEdit: (cat: CategoryItem) => void;
  onDelete: (id: string) => void;
}

export const CategoryTree: React.FC<CategoryTreeProps> = ({ categories, onAdd, onEdit, onDelete }) => {
  const rootCategories = categories.filter(c => c.parentId === null);

  return (
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
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};
