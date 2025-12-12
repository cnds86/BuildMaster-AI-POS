
'use client';
import { UnitManagement } from '../../components/UnitManagement';
import { useGlobal } from '../../context/GlobalContext';

export default function UnitsPage() {
  const { units, addUnit, updateUnit, deleteUnit } = useGlobal();

  return (
    <UnitManagement 
      units={units} 
      onAddUnit={addUnit}
      onUpdateUnit={updateUnit} 
      onDeleteUnit={deleteUnit} 
    />
  );
}
