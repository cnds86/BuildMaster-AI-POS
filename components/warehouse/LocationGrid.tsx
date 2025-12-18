
import React from 'react';
import { Warehouse, StorageLocation } from '../../types';
import { Grid, Plus, MapPin, Edit2, Trash2, Container } from 'lucide-react';

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
    <div className="lg:w-2/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
      {selectedWarehouse ? (
        <>
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center">
                <Grid className="w-5 h-5 mr-2 text-slate-500" />
                Storage Locations
              </h3>
              <p className="text-xs text-slate-500 ml-7">
                {selectedWarehouse.name} ({selectedWarehouse.code})
              </p>
            </div>
            <button 
              onClick={onAdd}
              className="flex items-center px-3 py-2 bg-construction-orange text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Location
            </button>
          </div>

          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-3">Full Code</div>
            <div className="col-span-2">Zone</div>
            <div className="col-span-2">Rack</div>
            <div className="col-span-2">Shelf/Level</div>
            <div className="col-span-2">Bin/Slot</div>
            <div className="col-span-1 text-center">Action</div>
          </div>

          <div className="overflow-y-auto flex-1">
            {locations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <MapPin className="w-10 h-10 mb-2 opacity-20" />
                <p>No locations defined yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {locations.map(loc => (
                  <div key={loc.id} className="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-slate-50 transition-colors text-sm">
                    <div className="col-span-3 font-mono font-bold text-primary-700 bg-primary-50 inline-block px-2 py-1 rounded w-fit">
                      {loc.fullCode}
                    </div>
                    <div className="col-span-2 text-slate-700">{loc.zone}</div>
                    <div className="col-span-2 text-slate-600">{loc.rack}</div>
                    <div className="col-span-2 text-slate-600">{loc.shelf}</div>
                    <div className="col-span-2 text-slate-600">{loc.bin}</div>
                    <div className="col-span-1 flex justify-center space-x-2">
                       <button 
                          onClick={() => onEdit(loc)}
                          className="text-slate-400 hover:text-primary-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDelete(loc.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
         <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
            <Container className="w-16 h-16 mb-4 text-slate-200" />
            <p className="text-lg font-medium">Select a Warehouse</p>
            <p className="text-sm">Choose a warehouse from the left to manage locations.</p>
         </div>
      )}
    </div>
  );
};
