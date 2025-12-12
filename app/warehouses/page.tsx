
'use client';
import { WarehouseManagement } from '../../components/WarehouseManagement';
import { useGlobal } from '../../context/GlobalContext';

export default function WarehousesPage() {
  const { 
    branches, warehouses, locations,
    addWarehouse, updateWarehouse, deleteWarehouse,
    addLocation, updateLocation, deleteLocation
  } = useGlobal();

  return (
    <WarehouseManagement
       branches={branches}
       warehouses={warehouses}
       locations={locations}
       onAddWarehouse={addWarehouse}
       onUpdateWarehouse={updateWarehouse}
       onDeleteWarehouse={deleteWarehouse}
       onAddLocation={addLocation}
       onUpdateLocation={updateLocation}
       onDeleteLocation={deleteLocation}
    />
  );
}
