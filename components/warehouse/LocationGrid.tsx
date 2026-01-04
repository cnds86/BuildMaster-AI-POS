
import React from 'react';
import { Warehouse, StorageLocation } from '../../types';
import { Grid, Plus, MapPin, Edit2, Trash2, Container, Hash, Layers } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

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
  return (
    <Card className="flex-1 flex flex-col overflow-hidden bg-white border-slate-200">
      {selectedWarehouse ? (
        <>
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <Grid className="w-5 h-5 text-slate-400" />
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Storage Grid</h3>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center ml-7">
                Facility: <span className="text-slate-600 ml-1.5">{selectedWarehouse.name} ({selectedWarehouse.code})</span>
              </p>
            </div>
            <Button 
              variant="primary"
              size="sm"
              onClick={onAdd}
              className="rounded-xl w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Location
            </Button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto flex-1">
            <table className="w-full text-left">
               <thead className="bg-white border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                  <tr>
                    <th className="px-8 py-4">Full Code</th>
                    <th className="px-6 py-4">Zone</th>
                    <th className="px-6 py-4">Rack</th>
                    <th className="px-6 py-4">Level</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {locations.map(loc => (
                    <tr key={loc.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="font-mono font-black text-sm text-slate-900 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl w-fit shadow-sm">
                          {loc.fullCode}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                         <Badge variant="outline" className="font-black text-slate-600">Zone {loc.zone}</Badge>
                      </td>
                      <td className="px-6 py-5 text-slate-600 font-bold">{loc.rack}</td>
                      <td className="px-6 py-5 text-slate-600 font-bold">{loc.shelf}</td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                              onClick={() => onEdit(loc)}
                              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-200 transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => onDelete(loc.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
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

          {/* Mobile Card View */}
          <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
             {locations.map(loc => (
               <div key={loc.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="font-mono font-black text-lg text-slate-900">
                       {loc.fullCode}
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => onEdit(loc)} className="p-2 bg-slate-50 text-slate-400 rounded-xl"><Edit2 className="w-4 h-4" /></button>
                       <button onClick={() => onDelete(loc.id)} className="p-2 bg-slate-50 text-red-400 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                     <div className="bg-slate-50 p-2 rounded-xl text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Zone</p>
                        <p className="font-bold text-slate-700">{loc.zone}</p>
                     </div>
                     <div className="bg-slate-50 p-2 rounded-xl text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Rack</p>
                        <p className="font-bold text-slate-700">{loc.rack}</p>
                     </div>
                     <div className="bg-slate-50 p-2 rounded-xl text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Level</p>
                        <p className="font-bold text-slate-700">{loc.shelf}</p>
                     </div>
                  </div>
               </div>
             ))}
          </div>

          {locations.length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 p-20 text-center">
              <div className="p-6 bg-slate-50 rounded-[2rem] mb-6">
                <MapPin className="w-12 h-12 text-slate-200" />
              </div>
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter">No Mapping Data</h4>
              <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto mt-1">Start by adding storage bins or shelf identifiers to this facility.</p>
            </div>
          )}
        </>
      ) : (
         <div className="flex flex-col items-center justify-center flex-1 text-slate-400 p-20 text-center">
            <div className="p-6 bg-slate-50 rounded-[2rem] mb-6 animate-pulse">
               <Container className="w-16 h-16 text-slate-200" />
            </div>
            <h4 className="text-2xl font-black text-slate-800 tracking-tight">Select a Warehouse</h4>
            <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto mt-2">Pick a storage facility from the left column to view its detailed layout and bin locations.</p>
         </div>
      )}
    </Card>
  );
};
