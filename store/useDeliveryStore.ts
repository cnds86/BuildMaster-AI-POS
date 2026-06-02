import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DeliveryOrder, Vehicle, Driver, DeliveryStatus } from '../types';

interface DeliveryState {
  deliveries: DeliveryOrder[];
  vehicles: Vehicle[];
  drivers: Driver[];
  loading: boolean;
  error: string | null;

  // Load from API
  fetchAll: () => Promise<void>;
  fetchVehicles: () => Promise<void>;
  fetchDrivers: () => Promise<void>;

  // Delivery Actions
  addDelivery: (delivery: DeliveryOrder) => Promise<void>;
  updateDelivery: (delivery: DeliveryOrder) => Promise<void>;
  updateDeliveryStatus: (id: string, status: DeliveryStatus) => Promise<void>;
  deleteDelivery: (id: string) => Promise<void>;

  // Vehicle Actions
  addVehicle: (vehicle: Vehicle) => Promise<void>;
  updateVehicle: (vehicle: Vehicle) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;

  // Driver Actions
  addDriver: (driver: Driver) => Promise<void>;
  updateDriver: (driver: Driver) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;
}

const API = '/api';

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Map DB snake_case → frontend camelCase
function mapVehicle(v: any): Vehicle {
  return {
    id: v.id,
    plateNumber: v.plate_number,
    type: v.vehicle_type,
    capacityWeight: v.capacity_weight ?? 0,
    capacityVolume: v.capacity_volume ?? undefined,
    status: v.status ?? 'Available',
    branchId: v.branch_id ?? '',
  };
}

function mapDriver(d: any): Driver {
  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    licenseNumber: d.license_plate ?? '',
    status: d.status ?? 'Available',
    branchId: d.branch_id ?? '',
  };
}

function mapDeliveryOrder(d: any): DeliveryOrder {
  return {
    id: d.id,
    saleId: d.sale_id ?? '',
    customerName: d.customer_name ?? '',
    customerPhone: d.customer_phone ?? '',
    deliveryAddress: d.delivery_address ?? '',
    status: d.status ?? 'Pending',
    scheduledDate: d.scheduled_date ?? d.created_at,
    vehicleId: d.vehicle_id ?? undefined,
    driverId: d.driver_id ?? undefined,
    notes: d.notes ?? undefined,
    createdAt: d.created_at ? new Date(d.created_at).toISOString() : new Date().toISOString(),
    updatedAt: d.updated_at ? new Date(d.updated_at).toISOString() : new Date().toISOString(),
    completedAt: d.delivered_at ? new Date(d.delivered_at).toISOString() : undefined,
    estimatedWeight: d.estimated_weight ?? undefined,
  };
}

export const useDeliveryStore = create<DeliveryState>()(
  persist(
    (set, get) => ({
      deliveries: [],
      vehicles: [],
      drivers: [],
      loading: false,
      error: null,

      fetchAll: async () => {
        set({ loading: true, error: null });
        try {
          const [deliveriesRes, vehiclesRes, driversRes] = await Promise.all([
            apiFetch('/deliveries'),
            apiFetch('/vehicles'),
            apiFetch('/drivers'),
          ]);
          set({
            deliveries: (deliveriesRes.deliveries || []).map(mapDeliveryOrder),
            vehicles: (vehiclesRes.vehicles || []).map(mapVehicle),
            drivers: (driversRes.drivers || []).map(mapDriver),
            loading: false,
          });
        } catch (err: any) {
          set({ error: err.message, loading: false });
        }
      },

      fetchVehicles: async () => {
        try {
          const { vehicles } = await apiFetch('/vehicles');
          set({ vehicles: (vehicles || []).map(mapVehicle) });
        } catch {}
      },

      fetchDrivers: async () => {
        try {
          const { drivers } = await apiFetch('/drivers');
          set({ drivers: (drivers || []).map(mapDriver) });
        } catch {}
      },

      addDelivery: async (delivery) => {
        const { deliveries } = get();
        try {
          const { delivery: created } = await apiFetch('/deliveries', {
            method: 'POST',
            body: JSON.stringify({
              saleId: delivery.saleId,
              customerName: delivery.customerName,
              customerPhone: delivery.customerPhone,
              deliveryAddress: delivery.deliveryAddress,
              scheduledDate: delivery.scheduledDate,
              estimatedWeight: delivery.estimatedWeight || null,
              vehicleId: delivery.vehicleId || null,
              driverId: delivery.driverId || null,
              notes: delivery.notes || null,
            }),
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: DeliveryOrder = mapDeliveryOrder(created);
          set({ deliveries: [mapped, ...deliveries] });
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        }
      },

      updateDelivery: async (delivery) => {
        const { deliveries } = get();
        try {
          const { delivery: updated } = await apiFetch(`/deliveries/${delivery.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              status: delivery.status,
              vehicleId: delivery.vehicleId || null,
              driverId: delivery.driverId || null,
              notes: delivery.notes,
              deliveryAddress: delivery.deliveryAddress,
            }),
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: DeliveryOrder = mapDeliveryOrder(updated);
          set({ deliveries: deliveries.map(d => d.id === updated.id ? mapped : d) });
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        }
      },

      updateDeliveryStatus: async (id, status) => {
        const { deliveries } = get();
        try {
          const { delivery: updated } = await apiFetch(`/deliveries/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: DeliveryOrder = mapDeliveryOrder(updated);
          set({ deliveries: deliveries.map(d => d.id === id ? mapped : d) });
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        }
      },

      deleteDelivery: async (id) => {
        const { deliveries } = get();
        await apiFetch(`/deliveries/${id}`, { method: 'DELETE' });
        set({ deliveries: deliveries.filter(d => d.id !== id) });
      },

      addVehicle: async (vehicle) => {
        const { vehicles } = get();
        const { vehicle: created } = await apiFetch('/vehicles', {
          method: 'POST',
          body: JSON.stringify({
            plateNumber: vehicle.plateNumber,
            type: vehicle.type,
            capacityWeight: vehicle.capacityWeight,
            capacityVolume: vehicle.capacityVolume || null,
            branchId: vehicle.branchId,
          }),
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: Vehicle = mapVehicle(created);
        set({ vehicles: [...vehicles, mapped] });
      },

      updateVehicle: async (vehicle) => {
        const { vehicles } = get();
        const { vehicle: updated } = await apiFetch(`/vehicles/${vehicle.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            plateNumber: vehicle.plateNumber,
            type: vehicle.type,
            capacityWeight: vehicle.capacityWeight,
            capacityVolume: vehicle.capacityVolume || null,
            status: vehicle.status,
          }),
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: Vehicle = mapVehicle(updated);
        set({ vehicles: vehicles.map(v => v.id === updated.id ? mapped : v) });
      },

      deleteVehicle: async (id) => {
        const { vehicles } = get();
        await apiFetch(`/vehicles/${id}`, { method: 'DELETE' });
        set({ vehicles: vehicles.filter(v => v.id !== id) });
      },

      addDriver: async (driver) => {
        const { drivers } = get();
        const { driver: created } = await apiFetch('/drivers', {
          method: 'POST',
          body: JSON.stringify({
            name: driver.name,
            phone: driver.phone,
            licenseNumber: driver.licenseNumber,
            branchId: driver.branchId,
          }),
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: Driver = mapDriver(created);
        set({ drivers: [...drivers, mapped] });
      },

      updateDriver: async (driver) => {
        const { drivers } = get();
        const { driver: updated } = await apiFetch(`/drivers/${driver.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: driver.name,
            phone: driver.phone,
            licenseNumber: driver.licenseNumber,
            status: driver.status,
          }),
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: Driver = mapDriver(updated);
        set({ drivers: drivers.map(d => d.id === updated.id ? mapped : d) });
      },

      deleteDriver: async (id) => {
        const { drivers } = get();
        await apiFetch(`/drivers/${id}`, { method: 'DELETE' });
        set({ drivers: drivers.filter(d => d.id !== id) });
      },
    }),
    {
      name: 'mahaxay-delivery-storage',
      partialize: (state) => ({
        // Only persist local fallback cache — API is source of truth
        deliveries: state.deliveries,
        vehicles: state.vehicles,
        drivers: state.drivers,
      }),
    }
  )
);
