
import React, { useMemo } from 'react';
import { UnitDefinition, UnitCategory } from '../../types';
import { Ruler, Weight, Hash, Edit2, Trash2, ArrowRight, CornerDownRight, Box, CheckCircle2 } from 'lucide-react';

interface UnitListProps {
  units: UnitDefinition[];
  activeCategory: UnitCategory;
  onCategoryChange: (category: UnitCategory) => void;
  onEdit: (unit: UnitDefinition) => void;
  onDelete: (id: string) => void;
}

export const UnitList: React.FC<UnitListProps> = ({ 
  units, activeCategory, onCategoryChange, onEdit, onDelete 
}) => {
  const categories: { id: UnitCategory; icon: any; label: string }[] = [
    { id: 'Length', icon: Ruler, label: 'Length' },
    { id: 'Weight', icon: Weight, label: 'Weight' },
    { id: 'Quantity', icon: Hash, label: 'Quantity' },
  ];

  // Logic to organize units into a hierarchy based on Base Factor
  const { baseUnit, derivedUnits } = useMemo(() => {
    const filtered = units.filter(u => u.category === activeCategory);
    const base = filtered.find(u => u.isBase);
    const others = filtered.filter(u => !u.isBase).sort((a, b) => a.baseFactor - b.baseFactor);
    return { baseUnit: base, derivedUnits: others };
  }, [units, activeCategory]);

  return (
    <div className="flex flex-col h-full">
      {/* Category Tabs */}
      <div className="bg-slate-100 p-1 rounded-xl flex overflow-x-auto shrink-0 mb-6 w-fit">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex items-center justify-center px-6 py-2.5 rounded-lg transition-all text-sm font-bold whitespace-nowrap ${
                isActive 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 p-6 rounded-2xl border border-slate-200">
         {!baseUnit && derivedUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
               <Box className="w-16 h-16 mb-4 opacity-20" />
               <p className="font-medium">No units defined for {activeCategory}.</p>
               <p className="text-xs">Create a Base Unit to start.</p>
            </div>
         ) : (
            <div className="max-w-3xl mx-auto">
               
               {/* ROOT NODE (Base Unit) */}
               {baseUnit ? (
                  <div className="relative z-10">
                     <div className="bg-white p-5 rounded-2xl border-2 border-blue-100 shadow-sm flex justify-between items-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                        <div className="flex items-center gap-4 pl-2">
                           <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                              <CheckCircle2 className="w-6 h-6" />
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                 <h3 className="text-lg font-bold text-slate-900">{baseUnit.name}</h3>
                                 <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-full tracking-wide">Base Unit</span>
                              </div>
                              <p className="text-sm text-slate-500 mt-0.5">
                                 Symbol: <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 rounded">{baseUnit.symbol}</span>
                              </p>
                           </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => onEdit(baseUnit)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4"/></button>
                        </div>
                     </div>
                     
                     {/* Connecting Line to Children */}
                     {derivedUnits.length > 0 && (
                        <div className="absolute left-8 top-full h-8 w-0.5 bg-slate-300"></div>
                     )}
                  </div>
               ) : (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 text-sm mb-6 flex items-center">
                     <Trash2 className="w-5 h-5 mr-3" />
                     Warning: No Base Unit defined. Please create one (e.g., 'Piece', 'Gram').
                  </div>
               )}

               {/* CHILDREN NODES (Derived Units) */}
               <div className="mt-8 ml-8 space-y-4">
                  {derivedUnits.map((unit, index) => {
                     const isLast = index === derivedUnits.length - 1;
                     return (
                        <div key={unit.id} className="relative pl-10">
                           {/* Tree Lines */}
                           <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-300 -mt-4"></div>
                           <div className="absolute left-0 top-1/2 w-8 h-0.5 bg-slate-300"></div>
                           {isLast && <div className="absolute left-0 top-1/2 bottom-0 w-0.5 bg-slate-50"></div>} {/* Mask line for last item */}

                           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex justify-between items-center group relative">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center font-bold text-xs border border-slate-100">
                                    {unit.symbol}
                                 </div>
                                 <div>
                                    <h4 className="font-bold text-slate-800">{unit.name}</h4>
                                    <div className="flex items-center text-xs text-slate-500 mt-1 bg-slate-50 px-2 py-1 rounded-lg w-fit">
                                       <span className="font-semibold text-slate-700">1 {unit.symbol}</span>
                                       <ArrowRight className="w-3 h-3 mx-2 text-slate-400" />
                                       <span className="font-mono text-slate-700">{unit.baseFactor} {baseUnit?.symbol || 'base'}</span>
                                    </div>
                                 </div>
                              </div>

                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => onEdit(unit)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4"/></button>
                                 <button onClick={() => onDelete(unit.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>
         )}
      </div>
    </div>
  );
};
