
import React from 'react';
import { UnitDefinition } from '../../types';
import { UnitTreeNode } from './UnitTreeNode';
import { Layers } from 'lucide-react';

interface UnitTreeProps {
  units: UnitDefinition[];
  onAdd: (unit?: UnitDefinition, parentId?: string | null) => void;
  onEdit: (unit: UnitDefinition) => void;
  onDelete: (id: string) => void;
}

export const UnitTree: React.FC<UnitTreeProps> = ({ units, onAdd, onEdit, onDelete }) => {
  // We assume units with parentId === null OR isBase === true as roots
  const rootUnits = units.filter(u => !u.parentId);

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Layers className="w-5 h-5 text-slate-400" />
           <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Hierarchy View</span>
        </div>
        <div className="flex gap-10 pr-32 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:flex">
           <span className="w-24 text-center">Symbol</span>
           <span className="w-32 text-center">Factor</span>
           <span className="w-24 text-center">Actions</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
        {rootUnits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 py-20">
             <Layers className="w-16 h-16 mb-4 opacity-20" />
             <p className="font-bold uppercase tracking-widest">No units in this category</p>
          </div>
        ) : (
          rootUnits.map(unit => (
            <UnitTreeNode 
              key={unit.id}
              unit={unit}
              allUnits={units}
              level={0}
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
