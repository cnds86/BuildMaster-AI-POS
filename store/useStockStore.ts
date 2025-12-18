
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Warehouse, StorageLocation, StockTransfer, StockCount, StockReservation, StockReceipt, StockAdjustment } from '../types';
import { INITIAL_WAREHOUSES, INITIAL_LOCATIONS, INITIAL_TRANSFERS, INITIAL_COUNTS, INITIAL_RESERVATIONS, INITIAL_RECEIPTS, INITIAL_ADJUSTMENTS } from '../services/data';

interface StockState {
  warehouses: Warehouse[];
  locations: StorageLocation[];
  transfers: StockTransfer[];
  counts: StockCount[];
  reservations: StockReservation[];
  receipts: StockReceipt[];
  adjustments: StockAdjustment[];

  addWarehouse: (w: Warehouse) => void;
  updateWarehouse: (w: Warehouse) => void;
  deleteWarehouse: (id: string) => void;

  addLocation: (l: StorageLocation) => void;
  updateLocation: (l: StorageLocation) => void;
  deleteLocation: (id: string) => void;

  // Generic Update Helpers for Docs (simplifies boilerplate)
  updateDocument: (type: 'transfers' | 'counts' | 'reservations' | 'receipts' | 'adjustments', doc: any) => void;
  deleteDocument: (type: 'transfers' | 'counts' | 'reservations' | 'receipts' | 'adjustments', id: string) => void;

  restoreStockData: (data: any) => void;
}

export const useStockStore = create<StockState>()(
  persist(
    (set) => ({
      warehouses: INITIAL_WAREHOUSES,
      locations: INITIAL_LOCATIONS,
      transfers: INITIAL_TRANSFERS,
      counts: INITIAL_COUNTS,
      reservations: INITIAL_RESERVATIONS,
      receipts: INITIAL_RECEIPTS,
      adjustments: INITIAL_ADJUSTMENTS,

      addWarehouse: (w) => set((state) => ({ warehouses: [...state.warehouses, w] })),
      updateWarehouse: (w) => set((state) => ({ warehouses: state.warehouses.map(x => x.id === w.id ? w : x) })),
      deleteWarehouse: (id) => set((state) => ({ warehouses: state.warehouses.filter(x => x.id !== id) })),

      addLocation: (l) => set((state) => ({ locations: [...state.locations, l] })),
      updateLocation: (l) => set((state) => ({ locations: state.locations.map(x => x.id === l.id ? l : x) })),
      deleteLocation: (id) => set((state) => ({ locations: state.locations.filter(x => x.id !== id) })),

      updateDocument: (type, doc) => set((state) => {
        const list = state[type] as any[];
        const exists = list.some(x => x.id === doc.id);
        const newList = exists ? list.map(x => x.id === doc.id ? doc : x) : [doc, ...list];
        return { [type]: newList } as any;
      }),

      deleteDocument: (type, id) => set((state) => {
        const list = state[type] as any[];
        return { [type]: list.filter(x => x.id !== id) } as any;
      }),

      restoreStockData: (data) => set((state) => ({
        ...state,
        warehouses: data.warehouses || state.warehouses,
        locations: data.locations || state.locations,
        transfers: data.transfers || state.transfers,
        counts: data.counts || state.counts,
        reservations: data.reservations || state.reservations,
        receipts: data.receipts || state.receipts,
        adjustments: data.adjustments || state.adjustments
      }))
    }),
    {
      name: 'bm_stock_store',
    }
  )
);
