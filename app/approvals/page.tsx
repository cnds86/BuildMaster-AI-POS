
'use client';
import { ApprovalManagement } from '../../components/ApprovalManagement';
import { useGlobal } from '../../context/GlobalContext';

export default function ApprovalsPage() {
  const { 
    transfers, counts, reservations, receipts, adjustments, warehouses,
    handleStockStatusChange
  } = useGlobal();

  return (
    <ApprovalManagement 
      transfers={transfers}
      counts={counts}
      reservations={reservations}
      receipts={receipts}
      adjustments={adjustments}
      warehouses={warehouses}
      onStatusChange={handleStockStatusChange}
    />
  );
}
