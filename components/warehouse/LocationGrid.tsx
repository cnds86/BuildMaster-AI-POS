
import React, { useState } from 'react';
import { Warehouse, StorageLocation } from '../../types';
import { Grid, Plus, MapPin, Edit2, Trash2, Container, Search, LayoutGrid } from 'lucide-react';

interface LocationGridProps {
  selectedWarehouse: Warehouse | undefined;
  locations: StorageLocation[];
  onAdd: () => void;
  onEdit: (loc: StorageLocation) => void;
  onDelete: (id: string) => void;
}

export const LocationGrid: React.FC<LocationGridProps> = ({
  selectedWarehouse, locations, onAdd, onEdit, onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLocations = locations.filter(l => 
    l.fullCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.zone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
      {selectedWarehouse ? (
        <>
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <h3 className="text-xl font-bold text-slate-800">{selectedWarehouse.name}</h3>
                   <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wider">{selectedWarehouse.code}</span>
                </div>
                <p className="text-slate-500 text-sm flex items-center">
                   <Container className="w-4 h-4 mr-1.5" /> {selectedWarehouse.type} Storage
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 text-slate-400">
                <LayoutGrid className="w-6 h-6" />
              </div>
            </div>

            <div className="flex gap-3">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                     type="text" 
                     placeholder="Search locations (Zone, Bin code)..." 
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 outline-none transition-all"
                  />
               </div>
               <button 
                  onClick={onAdd}
                  className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors text-sm font-bold shadow-sm whitespace-nowrap"
               >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Location
               </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {filteredLocations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 pb-10">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                   <MapPin className="w-8 h-8 opacity-30" />
                </div>
                <p className="font-medium">No storage locations found.</p>
                {locations.length === 0 && <button onClick={onAdd} className="mt-4 text-blue-600 hover:underline text-sm">Create first location</button>}
              </div>
            ) : (
               <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10 text-xs font-bold text-slate-500 uppercase tracking-wider">
                     <tr>
                        <th className="px-6 py-3 pl-8">Location Code</th>
                        <th className="px-6 py-3">Zone Details</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3 text-right pr-8">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                     {filteredLocations.map(loc => (
                        <tr key={loc.id} className="hover:bg-slate-50 transition-colors group">
                           <td className="px-6 py-3 pl-8">
                              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                 {loc.fullCode}
                              </span>
                           </td>
                           <td className="px-6 py-3 text-slate-600">
                              <div className="flex items-center gap-3">
                                 <span className="font-bold text-slate-800 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">Zone {loc.zone}</span>
                                 <span className="text-slate-400 text-xs">Rack {loc.rack} • Shelf {loc.shelf}</span>
                              </div>
                           </td>
                           <td className="px-6 py-3">
                              <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${
                                 loc.type === 'Cold Storage' ? 'bg-cyan-50 text-cyan-700 border-cyan-100' : 
                                 loc.type === 'Hazardous' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                 'bg-slate-50 text-slate-600 border-slate-100'
                              }`}>
                                 {loc.type || 'Shelf'}
                              </span>
                           </td>
                           <td className="px-6 py-3 text-right pr-8">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => onEdit(loc)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 className="w-4 h-4"/></button>
                                 <button onClick={() => onDelete(loc.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4"/></button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            )}
          </div>
        </>
      ) : (
         <div className="flex flex-col items-center justify-center flex-1 text-slate-400 p-8 bg-slate-50/50">
            <Container className="w-16 h-16 mb-4 text-slate-200" />
            <p className="text-lg font-medium text-slate-500">Select a Warehouse</p>
            <p className="text-sm">Choose a warehouse from the left to manage locations.</p>
         </div>
      )}
    </div>
  );
};
