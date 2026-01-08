
import React from 'react';
import { VariantAttribute } from '../../types';
import { Edit2, Trash2, Tag, Layers } from 'lucide-react';

interface AttributeListProps {
  attributes: VariantAttribute[];
  onEdit: (attr: VariantAttribute) => void;
  onDelete: (id: string) => void;
}

export const AttributeList: React.FC<AttributeListProps> = ({ attributes, onEdit, onDelete }) => {
  if (attributes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-slate-400 p-8">
        <Layers className="w-12 h-12 mb-3 opacity-20" />
        <p>No attributes defined.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 overflow-y-auto flex-1 bg-slate-50">
      {attributes.map((attr) => (
        <div key={attr.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Tag className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800">{attr.name}</h3>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onEdit(attr)}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => { if(confirm('Delete attribute?')) onDelete(attr.id); }}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex flex-wrap gap-2">
              {attr.values.map((val, idx) => (
                <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md border border-slate-200">
                  {val}
                </span>
              ))}
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
             <span>{attr.values.length} options</span>
             <span className="font-mono">{attr.id}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
