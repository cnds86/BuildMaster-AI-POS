
import React, { useState } from 'react';
import { Branch, Warehouse, StorageLocation } from '../types';
import { WarehouseList } from './warehouse/WarehouseList';
import { LocationGrid } from './warehouse/LocationGrid';
import { WarehouseFormModal } from './warehouse/WarehouseFormModal';
import { LocationFormModal } from './warehouse/LocationFormModal';

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

  // Filter Logic
  const filteredLocations = locations.filter(l => l.warehouseId === selectedWarehouseId);
  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId);

  // Warehouse Modal Handlers
  const openWhModal = (wh?: Warehouse) => {
    setEditingWh(wh || null);
    setIsWhModalOpen(true);
  };

  const handleWhSubmit = (whForm: Partial<Warehouse>) => {
    if (editingWh) {
      onUpdateWarehouse({ ...whForm, id: editingWh.id, branchId: selectedBranchId } as Warehouse);
    } else {
      onAddWarehouse({ ...whForm, id: `wh-${Date.now()}`, branchId: selectedBranchId } as Warehouse);
    }
    setIsWhModalOpen(false);
  };

  // Location Modal Handlers
  const openLocModal = (loc?: StorageLocation) => {
    setEditingLoc(loc || null);
    setIsLocModalOpen(true);
  };

  const handleLocSubmit = (locForm: Partial<StorageLocation>) => {
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
    <div className="flex flex-col h-full space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Warehouse Management (WMS)</h2>
          <p className="text-slate-500">Manage storage facilities, zones, racks, and bins.</p>
        </div>
      </div>

      {/* Main Content Area: Stacks on Mobile */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        <div className="w-full lg:w-1/3 flex flex-col h-full">
           <WarehouseList 
             branches={branches}
             warehouses={warehouses}
             selectedBranchId={selectedBranchId}
             selectedWarehouseId={selectedWarehouseId}
             onSelectBranch={setSelectedBranchId}
             onSelectWarehouse={setSelectedWarehouseId}
             onAdd={() => openWhModal()}
             onEdit={openWhModal}
             onDelete={onDeleteWarehouse}
           />
        </div>

        <div className="w-full lg:w-2/3 flex flex-col h-full">
           <LocationGrid 
             selectedWarehouse={selectedWarehouse}
             locations={filteredLocations}
             onAdd={() => openLocModal()}
             onEdit={openLocModal}
             onDelete={onDeleteLocation}
           />
        </div>
      </div>

      {/* Modals */}
      <WarehouseFormModal 
        isOpen={isWhModalOpen}
        onClose={() => setIsWhModalOpen(false)}
        onSubmit={handleWhSubmit}
        initialData={editingWh}
      />

      <LocationFormModal 
        isOpen={isLocModalOpen}
        onClose={() => setIsLocModalOpen(false)}
        onSubmit={handleLocSubmit}
        initialData={editingLoc}
      />
    </div>
  );
};
