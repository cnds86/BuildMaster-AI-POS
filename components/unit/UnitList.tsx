
import React from 'react';
import { UnitDefinition, UnitCategory } from '../../types';
import { Ruler, Weight, Hash, Edit2, Trash2, ArrowRight } from 'lucide-react';

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

  const filteredUnits = units.filter(u => u.category === activeCategory);
  const baseUnit = filteredUnits.find(u => u.isBase);

  return (
    <>
      {/* Category Tabs - Style A Pill */}
      <div className="bg-slate-100 p-1 rounded-xl flex overflow-x-auto shrink-0 mb-6">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex-1 flex items-center justify-center py-3 rounded-lg transition-all min-w-[100px] text-sm font-bold whitespace-nowrap ${
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
         {/* Desktop Table */}
         <div className="hidden md:block overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Conversion Ratio</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUnits.map((unit) => (
                <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="font-bold text-slate-800">{unit.name}</span>
                      {unit.isBase && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-full tracking-wide">Base</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 text-sm border border-slate-200 font-bold">
                      {unit.symbol}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {unit.isBase ? (
                      <span className="text-slate-400 italic font-medium">Reference Standard</span>
                    ) : (
                      <div className="flex items-center font-medium">
                        <span className="text-slate-800">1 {unit.symbol}</span>
                        <ArrowRight className="w-3 h-3 mx-2 text-slate-400" />
                        <span className="text-slate-800">{unit.baseFactor} {baseUnit?.symbol || 'base'}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => onEdit(unit)}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(unit.id)}
                        disabled={unit.isBase}
                        className={`p-2 rounded-lg transition-colors ${
                          unit.isBase 
                          ? 'text-slate-200 cursor-not-allowed' 
                          : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden p-4 space-y-3 flex-1 overflow-y-auto bg-slate-50">
           {filteredUnits.map(unit => (
              <div key={unit.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                 <div>
                    <div className="flex items-center mb-1">
                       <span className="font-bold text-slate-900">{unit.name}</span>
                       {unit.isBase && <span className="ml-2 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded">BASE</span>}
                    </div>
                    <div className="text-xs text-slate-500 mb-2">
                       Symbol: <span className="font-mono bg-slate-100 px-1 rounded text-slate-700">{unit.symbol}</span>
                    </div>
                    {!unit.isBase && (
                       <div className="text-xs font-medium text-slate-700 bg-slate-50 px-2 py-1 rounded inline-block border border-slate-100">
                          1 {unit.symbol} = {unit.baseFactor} {baseUnit?.symbol}
                       </div>
                    )}
                 </div>
                 <div className="flex flex-col gap-2">
                    <button onClick={() => onEdit(unit)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                       <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                       onClick={() => onDelete(unit.id)} 
                       disabled={unit.isBase}
                       className={`p-2 bg-slate-50 border border-slate-200 rounded-lg ${unit.isBase ? 'opacity-50' : 'text-red-500'}`}
                    >
                       <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>
           ))}
        </div>

        {filteredUnits.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            No units defined for this category.
          </div>
        )}
      </div>
    </>
  );
};
