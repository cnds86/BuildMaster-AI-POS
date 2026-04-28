import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DeliveryOrder, Vehicle, Driver, DeliveryStatus } from '../types';

interface DeliveryState {
  deliveries: DeliveryOrder[];
  vehicles: Vehicle[];
  drivers: Driver[];
  
  // Delivery Actions
  addDelivery: (delivery: DeliveryOrder) => void;
  updateDelivery: (delivery: DeliveryOrder) => void;
  updateDeliveryStatus: (id: string, status: DeliveryStatus) => void;
  deleteDelivery: (id: string) => void;
  
  // Vehicle Actions
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  deleteVehicle: (id: string) => void;
  
  // Driver Actions
  addDriver: (driver: Driver) => void;
  updateDriver: (driver: Driver) => void;
  deleteDriver: (id: string) => void;
}

export const useDeliveryStore = create<DeliveryState>()(
  persist(
    (set) => ({
      deliveries: [],
      vehicles: [
        { id: 'v1', plateNumber: 'กท 1234', type: 'Truck', capacityWeight: 5000, status: 'Available', branchId: 'b1' },
        { id: 'v2', plateNumber: 'ขข 5678', type: 'Pickup', capacityWeight: 1500, status: 'Available', branchId: 'b1' }
      ],
      drivers: [
        { id: 'd1', name: 'Somchai Delivery', phone: '0812345678', licenseNumber: 'DL-12345', status: 'Available', branchId: 'b1' },
        { id: 'd2', name: 'Somsak Fast', phone: '0898765432', licenseNumber: 'DL-67890', status: 'Available', branchId: 'b1' }
      ],

      addDelivery: (delivery) => set((state) => ({ deliveries: [...state.deliveries, delivery] })),
      updateDelivery: (delivery) => set((state) => ({
        deliveries: state.deliveries.map((d) => d.id === delivery.id ? delivery : d)
      })),
      updateDeliveryStatus: (id, status) => set((state) => ({
        deliveries: state.deliveries.map((d) => {
          if (d.id === id) {
            const updates: Partial<DeliveryOrder> = { status, updatedAt: new Date().toISOString() };
            if (status === 'Delivered') updates.completedAt = new Date().toISOString();
            return { ...d, ...updates };
          }
          return d;
        })
      })),
      deleteDelivery: (id) => set((state) => ({
        deliveries: state.deliveries.filter((d) => d.id !== id)
      })),

      addVehicle: (vehicle) => set((state) => ({ vehicles: [...state.vehicles, vehicle] })),
      updateVehicle: (vehicle) => set((state) => ({
        vehicles: state.vehicles.map((v) => v.id === vehicle.id ? vehicle : v)
      })),
      deleteVehicle: (id) => set((state) => ({
        vehicles: state.vehicles.filter((v) => v.id !== id)
      })),

      addDriver: (driver) => set((state) => ({ drivers: [...state.drivers, driver] })),
      updateDriver: (driver) => set((state) => ({
        drivers: state.drivers.map((d) => d.id === driver.id ? driver : d)
      })),
      deleteDriver: (id) => set((state) => ({
        drivers: state.drivers.filter((d) => d.id !== id)
      })),
    }),
    {
      name: 'mahaxay-delivery-storage',
    }
  )
);
