
import React, { useState } from 'react';
import { UnitDefinition } from '../../types';
import { ChevronRight, ChevronDown, Hash, Edit2, Trash2, Plus, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface UnitTreeNodeProps {
  unit: UnitDefinition;
  allUnits: UnitDefinition[];
  level: number;
  onAdd: (unit?: UnitDefinition, parentId?: string | null) => void;
  onEdit: (unit: UnitDefinition) => void;
  onDelete: (id: string) => void;
}

export const UnitTreeNode: React.FC<UnitTreeNodeProps> = ({ 
  unit, allUnits, level, onAdd, onEdit, onDelete 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const children = allUnits.filter(u => u.parentId === unit.id);
  const hasChildren = children.length > 0;

  // Find parent unit for ratio display
  const parentUnit = unit.parentId ? allUnits.find(u => u.id === unit.parentId) : null;
  // If no immediate parent but not base, show relative to base if possible
  const baseUnit = allUnits.find(u => u.isBase);
  const ratioTarget = parentUnit || baseUnit;

  return (
    <div className="animate-slide-in-right">
      <div 
        className={cn(
          "group flex items-center p-3 rounded-2xl transition-all duration-200 hover:bg-slate-50 border border-transparent hover:border-slate-100",
          level === 0 && "bg-white shadow-sm border-slate-50 mb-1"
        )}
        style={{ marginLeft: `${level * 32}px` }}
      >
        <div className="flex items-center flex-1 min-w-0">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "mr-2 p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-white transition-all",
              !hasChildren && "invisible"
            )}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          <div className={cn(
            "mr-4 p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110",
            unit.isBase ? "bg-slate-900 text-white shadow-lg" : "bg-slate-100 text-slate-500"
          )}>
            <Hash className="w-5 h-5" />
          </div>
          
          <div className="flex flex-col truncate">
            <div className="flex items-center gap-2">
               <span className={cn("font-black tracking-tight", level === 0 ? "text-slate-900 text-lg" : "text-slate-700")}>
                 {unit.name}
               </span>
               {unit.isBase && <Badge variant="primary">Base Unit</Badge>}
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {unit.id.slice(-6)}</span>
          </div>
        </div>

        {/* Data Columns */}
        <div className="flex items-center gap-10 mr-4">
           <div className="w-24 text-center">
              <span className="font-mono text-sm font-black bg-slate-100 px-2 py-1 rounded-lg text-slate-600 border border-slate-200">
                {unit.symbol}
              </span>
           </div>
           
           <div className="w-48 text-center hidden sm:block">
              {unit.isBase ? (
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Smallest Reference</span>
              ) : (
                <div className="flex items-center justify-center text-xs font-black text-slate-700 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 shadow-sm">
                   1 {unit.symbol} = {unit.baseFactor} {ratioTarget?.symbol || 'base'}
                </div>
              )}
           </div>

           {/* Actions */}
           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onAdd(undefined, unit.id)}
                className="p-2 text-slate-400 hover:text-construction-orange hover:bg-orange-50 rounded-xl transition-all"
                title="Add Child Unit"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onEdit(unit)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onDelete(unit.id)}
                disabled={unit.isBase}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="relative">
           {/* Visual connector line */}
           <div className="absolute left-[24px] top-0 bottom-4 w-0.5 bg-slate-100 rounded-full" style={{ marginLeft: `${level * 32}px` }} />
           
           {children.map(child => (
            <UnitTreeNode 
              key={child.id} 
              unit={child} 
              allUnits={allUnits}
              level={level + 1} 
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
