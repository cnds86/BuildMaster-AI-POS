import React, { useEffect, useRef } from 'react';
import { Truck, Users, Package, CheckCircle, Plus, Search, Trash2 } from 'lucide-react';
import { useConfirm } from '@/components/common/Confirm';
import { useDeliveryStore } from '../../store/useDeliveryStore';
import { useSystemStore } from '../../store/useSystemStore';
import { DeliveryOrder, DeliveryStatus, Sale } from '../../types';
import { DeliveryFormModal } from './DeliveryFormModal';
import { VehicleFormModal } from './VehicleFormModal';
import { DriverFormModal } from './DriverFormModal';

interface Props {
  /** Optional sale to pre-fill when opening the "New Delivery" modal */
  preselectedSale?: Sale | null;
  onRequestOpenNewDelivery?: (open: () => void) => void;
}

export const DeliveryDashboard: React.FC<Props> = ({ preselectedSale, onRequestOpenNewDelivery }) => {
  const {
    deliveries, vehicles, drivers, loading, error,
    fetchAll,
    updateDeliveryStatus,
    addVehicle, addDriver,
    deleteVehicle, deleteDriver, deleteDelivery,
  } = useDeliveryStore();
  const { settings } = useSystemStore();

  useEffect(() => {
    fetchAll();
  }, []);

  const [activeTab, setActiveTab] = React.useState<'deliveries' | 'fleet'>('deliveries');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<DeliveryStatus | 'All'>('All');

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = React.useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = React.useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = React.useState(false);
  const [activeSale, setActiveSale] = React.useState<Sale | null>(preselectedSale ?? null);

  // Allow parent to trigger modal open
  const openDeliveryModal = React.useCallback(() => {
    setActiveSale(preselectedSale ?? null);
    setIsDeliveryModalOpen(true);
  }, [preselectedSale]);

  useEffect(() => {
    if (onRequestOpenNewDelivery) onRequestOpenNewDelivery(openDeliveryModal);
  }, [onRequestOpenNewDelivery, openDeliveryModal]);

  useEffect(() => {
    if (preselectedSale) {
      setActiveSale(preselectedSale);
      setIsDeliveryModalOpen(true);
    }
  }, [preselectedSale]);

  const handleDeliveryFormSubmit = async (delivery: DeliveryOrder) => {
    try {
      await useDeliveryStore.getState().addDelivery(delivery);
      setIsDeliveryModalOpen(false);
      setActiveSale(null);
    } catch {
      alert('Failed to create delivery. Is the backend running?');
    }
  };

  const filteredDeliveries = deliveries.filter(d => {
    const matchesSearch =
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Transit': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'Failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'Cancelled': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleStatusChange = async (id: string, status: DeliveryStatus) => {
    try {
      await updateDeliveryStatus(id, status);
    } catch {
      alert('Failed to update status. Is the backend running?');
    }
  };

  const confirm = useConfirm();

  const handleDeleteDelivery = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Delivery Order',
      message: 'This delivery order will be permanently removed. This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteDelivery(id);
    } catch {
      alert('Failed to delete delivery.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          ⚠️ {error} — showing cached data
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Delivery & Fleet Management</h1>
          <p className="text-slate-500">
            {loading ? 'Loading...' : `${deliveries.length} orders, ${vehicles.length} vehicles, ${drivers.length} drivers`}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setActiveSale(null); setIsDeliveryModalOpen(true); }}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> New Delivery
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg mr-4">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Pending</p>
            <h3 className="text-2xl font-bold text-slate-800">{deliveries.filter(d => d.status === 'Pending').length}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg mr-4">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">In Transit</p>
            <h3 className="text-2xl font-bold text-slate-800">{deliveries.filter(d => d.status === 'In Transit').length}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg mr-4">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Delivered Today</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {deliveries.filter(d => d.status === 'Delivered' && d.completedAt &&
                new Date(d.completedAt).toDateString() === new Date().toDateString()).length}
            </h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg mr-4">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Available Drivers</p>
            <h3 className="text-2xl font-bold text-slate-800">{drivers.filter(d => d.status === 'Available').length} / {drivers.length}</h3>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 flex">
          <button
            onClick={() => setActiveTab('deliveries')}
            className={`px-6 py-4 font-medium text-sm transition-colors ${activeTab === 'deliveries' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Delivery Orders
          </button>
          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-6 py-4 font-medium text-sm transition-colors ${activeTab === 'fleet' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Fleet & Drivers
          </button>
        </div>

        {loading && (
          <div className="p-8 text-center text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2" />
            Loading...
          </div>
        )}

        {!loading && activeTab === 'deliveries' && (
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer or order ID..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as DeliveryStatus | 'All')}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 font-medium">Order ID</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Address</th>
                    <th className="px-4 py-3 font-medium">Schedule</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Fleet</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDeliveries.length > 0 ? filteredDeliveries.map(delivery => {
                    const vehicle = vehicles.find(v => v.id === delivery.vehicleId);
                    const driver = drivers.find(d => d.id === delivery.driverId);

                    return (
                      <tr key={delivery.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-slate-900">{delivery.id}</div>
                          {delivery.saleId && (
                            <div className="text-xs text-indigo-600 font-medium mt-0.5">Sale: {delivery.saleId}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-slate-900">{delivery.customerName}</div>
                          <div className="text-xs text-slate-500">{delivery.customerPhone}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate" title={delivery.deliveryAddress}>
                          {delivery.deliveryAddress}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {delivery.scheduledDate
                            ? new Date(delivery.scheduledDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : <span className="text-slate-400 italic">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(delivery.status)}`}>
                            {delivery.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {vehicle && driver ? (
                            <div>
                              <div className="text-sm font-medium text-slate-900">{vehicle.plateNumber}</div>
                              <div className="text-xs text-slate-500">{driver.name}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <select
                              className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                              value={delivery.status}
                              onChange={(e) => handleStatusChange(delivery.id, e.target.value as DeliveryStatus)}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Scheduled">Scheduled</option>
                              <option value="In Transit">In Transit</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Failed">Failed</option>
                            </select>
                            <button
                              onClick={() => handleDeleteDelivery(delivery.id)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No deliveries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && activeTab === 'fleet' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Vehicles */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-indigo-600" /> Vehicles
                </h3>
                <button
                  onClick={() => setIsVehicleModalOpen(true)}
                  className="text-sm text-indigo-600 font-medium hover:text-indigo-800"
                >
                  + Add Vehicle
                </button>
              </div>
              <div className="space-y-3">
                {vehicles.length === 0 && (
                  <p className="text-slate-400 text-sm italic">No vehicles yet.</p>
                )}
                {vehicles.map(vehicle => (
                  <div key={vehicle.id} className="p-4 border border-slate-200 rounded-xl flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
                        <Truck className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{vehicle.plateNumber}</h4>
                        <p className="text-xs text-slate-500">{vehicle.type} • Max {vehicle.capacityWeight}kg</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        vehicle.status === 'Available' ? 'bg-green-100 text-green-700' :
                        vehicle.status === 'In Use' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {vehicle.status}
                      </span>
                      <button
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Delete Vehicle',
                            message: `Permanently remove vehicle ${vehicle.plateNumber}?`,
                            confirmText: 'Delete',
                            variant: 'danger',
                          });
                          if (!ok) return;
                          try { await deleteVehicle(vehicle.id); } catch { alert('Failed to delete vehicle.'); }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drivers */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-indigo-600" /> Drivers
                </h3>
                <button
                  onClick={() => setIsDriverModalOpen(true)}
                  className="text-sm text-indigo-600 font-medium hover:text-indigo-800"
                >
                  + Add Driver
                </button>
              </div>
              <div className="space-y-3">
                {drivers.length === 0 && (
                  <p className="text-slate-400 text-sm italic">No drivers yet.</p>
                )}
                {drivers.map(driver => (
                  <div key={driver.id} className="p-4 border border-slate-200 rounded-xl flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold shrink-0">
                        {driver.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{driver.name}</h4>
                        <p className="text-xs text-slate-500">{driver.phone} • {driver.licenseNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        driver.status === 'Available' ? 'bg-green-100 text-green-700' :
                        driver.status === 'On Delivery' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {driver.status}
                      </span>
                      <button
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Delete Driver',
                            message: `Permanently remove driver ${driver.name}?`,
                            confirmText: 'Delete',
                            variant: 'danger',
                          });
                          if (!ok) return;
                          try { await deleteDriver(driver.id); } catch { alert('Failed to delete driver.'); }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <DeliveryFormModal
        isOpen={isDeliveryModalOpen}
        onClose={() => { setIsDeliveryModalOpen(false); setActiveSale(null); }}
        onSubmit={handleDeliveryFormSubmit}
        sale={activeSale}
      />

      <VehicleFormModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onSubmit={async (vehicle) => {
          try {
            await addVehicle(vehicle);
            setIsVehicleModalOpen(false);
          } catch {
            alert('Failed to add vehicle. Is the backend running?');
          }
        }}
      />

      <DriverFormModal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        onSubmit={async (driver) => {
          try {
            await addDriver(driver);
            setIsDriverModalOpen(false);
          } catch {
            alert('Failed to add driver. Is the backend running?');
          }
        }}
      />
    </div>
  );
};
