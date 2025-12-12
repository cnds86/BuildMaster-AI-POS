
'use client';
import { StockManagement } from '../../components/StockManagement';
import { useGlobal } from '../../context/GlobalContext';

export default function StockPage() {
  const { 
    warehouses, products, transfers, counts, reservations, receipts, adjustments, settings,
    updateTransfer, updateCount, updateReservation, updateReceipt, updateAdjustment,
    deleteTransfer, deleteCount, deleteReservation, deleteReceipt, deleteAdjustment,
    handleStockStatusChange
  } = useGlobal();

  return (
    <StockManagement 
      warehouses={warehouses}
      products={products}
      transfers={transfers}
      counts={counts}
      reservations={reservations}
      receipts={receipts}
      adjustments={adjustments}
      defaultItemsPerPage={settings.defaultItemsPerPage}
      onUpdateTransfer={updateTransfer}
      onUpdateCount={updateCount}
      onUpdateReservation={updateReservation}
      onUpdateReceipt={updateReceipt}
      onUpdateAdjustment={updateAdjustment}
      onDeleteTransfer={deleteTransfer}
      onDeleteCount={deleteCount}
      onDeleteReservation={deleteReservation}
      onDeleteReceipt={deleteReceipt}
      onDeleteAdjustment={deleteAdjustment}
      onStatusChange={handleStockStatusChange}
    />
  );
}
