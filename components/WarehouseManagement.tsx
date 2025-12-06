import React, { useState } from 'react';
import { Branch, Warehouse, StorageLocation } from '../types';
import { 
  Container, 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  Grid,
  Box,
  ArrowRight,
  X
} from 'lucide-react';

interface WarehouseManagementProps {
  branches: Branch[];
  warehouses: Warehouse[];
  locations: StorageLocation[];
  onAddWarehouse: (wh: Warehouse) => void;
  onUpdateWarehouse: (wh: Warehouse) => void;
  onDeleteWarehouse: (id: string) => void;
  onAddLocation: (loc: StorageLocation) => void;
  onUpdateLocation: (loc: StorageLocation) => void;
  onDeleteLocation: (id: string) => void;
}

export const WarehouseManagement: React.FC<WarehouseManagementProps> = ({
  branches,
  warehouses,
  locations,
  onAddWarehouse,
  onUpdateWarehouse,
  onDeleteWarehouse,
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);

  // Modal States
  const [isWhModalOpen, setIsWhModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<Warehouse | null>(null);
  
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<StorageLocation | null>(null);

  // Forms
  const [whForm, setWhForm] = useState<Partial<Warehouse>>({
    name: '', code: '', type: 'General', description: ''
  });
  const [locForm, setLocForm] = useState<Partial<StorageLocation>>({
    zone: '', rack: '', shelf: '', bin: '', type: 'Shelf'
  });

  // Filter Logic
  const filteredWarehouses = warehouses.filter(w => w.branchId === selectedBranchId);
  const filteredLocations = locations.filter(l => l.warehouseId === selectedWarehouseId);

  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId);

  // Warehouse Modal Handlers
  const openWhModal = (wh?: Warehouse) => {
    if (wh) {
      setEditingWh(wh);
      setWhForm(wh);
    } else {
      setEditingWh(null);
      setWhForm({ name: '', code: '', type: 'General', description: '' });
    }
    setIsWhModalOpen(true);
  };

  const handleWhSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWh) {
      onUpdateWarehouse({ ...whForm, id: editingWh.id, branchId: selectedBranchId } as Warehouse);
    } else {
      onAddWarehouse({ ...whForm, id: `wh-${Date.now()}`, branchId: selectedBranchId } as Warehouse);
    }
    setIsWhModalOpen(false);
  };

  // Location Modal Handlers
  const openLocModal = (loc?: StorageLocation) => {
    if (loc) {
      setEditingLoc(loc);
      setLocForm(loc);
    } else {
      setEditingLoc(null);
      setLocForm({ zone: '', rack: '', shelf: '', bin: '', type: 'Shelf' });
    }
    setIsLocModalOpen(true);
  };

  const handleLocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouseId) return;

    const fullCode = `${locForm.zone}-${locForm.rack}-${locForm.shelf}-${locForm.bin}`;
    const locationData = { ...locForm, fullCode, warehouseId: selectedWarehouseId };

    if (editingLoc) {
      onUpdateLocation({ ...locationData, id: editingLoc.id } as StorageLocation);
    } else {
      onAddLocation({ ...locationData, id: `loc-${Date.now()}` } as StorageLocation);
    }
    setIsLocModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Warehouse Management (WMS)</h2>
          <p className="text-slate-500">Manage storage facilities, zones, racks, and bins.</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Panel: Warehouses */}
        <div className="lg:w-1/3 flex flex-col gap-4">
          {/* Branch Selector */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Branch</label>
            <select 
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                setSelectedWarehouseId(null);
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Warehouse List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700 flex items-center">
                <Container className="w-5 h-5 mr-2" /> Warehouses
              </h3>
              <button 
                onClick={() => openWhModal()}
                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-2 space-y-2 flex-1">
              {filteredWarehouses.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p>No warehouses found.</p>
                </div>
              ) : (
                filteredWarehouses.map(wh => (
                  <div 
                    key={wh.id}
                    onClick={() => setSelectedWarehouseId(wh.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedWarehouseId === wh.id 
                        ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' 
                        : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{wh.name}</h4>
                        <span className="text-xs font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 mt-1 inline-block">
                          {wh.code}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openWhModal(wh); }}
                          className="p-1 text-slate-400 hover:text-primary-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteWarehouse(wh.id); }}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 flex justify-between">
                       <span>Type: {wh.type}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Locations */}
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
                  onClick={() => openLocModal()}
                  className="flex items-center px-3 py-2 bg-construction-orange text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Location
                </button>
              </div>

              {/* Grid Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="col-span-3">Full Code</div>
                <div className="col-span-2">Zone</div>
                <div className="col-span-2">Rack</div>
                <div className="col-span-2">Shelf/Level</div>
                <div className="col-span-2">Bin/Slot</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              <div className="overflow-y-auto flex-1">
                {filteredLocations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                    <MapPin className="w-10 h-10 mb-2 opacity-20" />
                    <p>No locations defined yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredLocations.map(loc => (
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
                              onClick={() => openLocModal(loc)}
                              className="text-slate-400 hover:text-primary-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => onDeleteLocation(loc.id)}
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
      </div>

      {/* Warehouse Modal */}
      {isWhModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-slate-800">
                {editingWh ? 'Edit Warehouse' : 'Add Warehouse'}
              </h3>
              <button onClick={() => setIsWhModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleWhSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  required
                  type="text"
                  value={whForm.name}
                  onChange={e => setWhForm({...whForm, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                  <input
                    required
                    type="text"
                    value={whForm.code}
                    onChange={e => setWhForm({...whForm, code: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono uppercase"
                    placeholder="WH-01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={whForm.type}
                    onChange={e => setWhForm({...whForm, type: e.target.value as any})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="General">General</option>
                    <option value="Cold Storage">Cold Storage</option>
                    <option value="Hazardous">Hazardous</option>
                    <option value="Showroom">Showroom</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={whForm.description || ''}
                  onChange={e => setWhForm({...whForm, description: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none h-20"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="px-6 py-2 bg-construction-orange text-white rounded-lg hover:bg-orange-600 font-medium">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {isLocModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-slate-800">
                {editingLoc ? 'Edit Location' : 'Add Location'}
              </h3>
              <button onClick={() => setIsLocModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleLocSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Zone</label>
                  <input
                    required
                    type="text"
                    value={locForm.zone}
                    onChange={e => setLocForm({...locForm, zone: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                    placeholder="A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rack</label>
                  <input
                    required
                    type="text"
                    value={locForm.rack}
                    onChange={e => setLocForm({...locForm, rack: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shelf/Level</label>
                  <input
                    required
                    type="text"
                    value={locForm.shelf}
                    onChange={e => setLocForm({...locForm, shelf: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bin/Slot</label>
                  <input
                    required
                    type="text"
                    value={locForm.bin}
                    onChange={e => setLocForm({...locForm, bin: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="A"
                  />
                </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Storage Type</label>
                 <select
                   value={locForm.type}
                   onChange={e => setLocForm({...locForm, type: e.target.value as any})}
                   className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                 >
                   <option value="Shelf">Shelf</option>
                   <option value="Pallet">Pallet</option>
                   <option value="Floor">Floor</option>
                 </select>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-bold">Preview Code:</span>
                <div className="font-mono text-lg font-bold text-primary-700 mt-1">
                   {locForm.zone || '?'}-{locForm.rack || '?'}-{locForm.shelf || '?'}-{locForm.bin || '?'}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="px-6 py-2 bg-construction-orange text-white rounded-lg hover:bg-orange-600 font-medium">Save Location</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};