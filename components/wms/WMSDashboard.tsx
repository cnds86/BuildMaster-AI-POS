import React, { useState } from 'react';
import { Warehouse, Package, MapPin, Truck, Clock, AlertTriangle, Plus, Search, ClipboardList, ArrowDownUp, Box } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';

type WMSView = 'overview' | 'transfers' | 'counts' | 'adjustments' | 'reservations';

export const WMSDashboard: React.FC = () => {
  const {
    warehouses, locations, products, transfers, counts, adjustments, reservations
  } = useGlobal();

  const [activeView, setActiveView] = useState<WMSView>('overview');

  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const lowStockCount = products.filter(p => (p.stock || 0) < 10).length;
  const pendingTransfers = transfers.filter(t => t.status === 'pending').length;
  const pendingCounts = counts.filter(c => c.status === 'pending').length;

  const views: { id: WMSView; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <Warehouse className="w-4 h-4" /> },
    { id: 'transfers', label: 'Transfers', icon: <ArrowDownUp className="w-4 h-4" />, count: pendingTransfers },
    { id: 'counts', label: 'Stock Counts', icon: <ClipboardList className="w-4 h-4" />, count: pendingCounts },
    { id: 'adjustments', label: 'Adjustments', icon: <Box className="w-4 h-4" /> },
    { id: 'reservations', label: 'Reservations', icon: <Package className="w-4 h-4" /> },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg mr-4">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Total Products</p>
                  <h3 className="text-2xl font-bold text-slate-800">{products.length}</h3>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center">
                <div className="p-3 bg-green-50 text-green-600 rounded-lg mr-4">
                  <Warehouse className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Total Stock</p>
                  <h3 className="text-2xl font-bold text-slate-800">{totalStock.toLocaleString()}</h3>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center">
                <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg mr-4">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Low Stock Items</p>
                  <h3 className="text-2xl font-bold text-slate-800">{lowStockCount}</h3>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg mr-4">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Warehouses</p>
                  <h3 className="text-2xl font-bold text-slate-800">{warehouses.length}</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Warehouses</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {warehouses.map(w => (
                  <div key={w.id} className="border border-slate-200 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-800">{w.name}</h4>
                    <p className="text-sm text-slate-500">{w.location || 'No location'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'transfers':
        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Stock Transfers</h3>
            <p className="text-slate-500">Transfer management coming soon. {pendingTransfers} pending transfers.</p>
          </div>
        );

      case 'counts':
        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Stock Counts</h3>
            <p className="text-slate-500">Stock count management coming soon. {pendingCounts} pending counts.</p>
          </div>
        );

      case 'adjustments':
        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Stock Adjustments</h3>
            <p className="text-slate-500">Stock adjustment management coming soon.</p>
          </div>
        );

      case 'reservations':
        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Reservations</h3>
            <p className="text-slate-500">Reservation management coming soon.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Warehouse Management (WMS)</h1>
          <p className="text-slate-500">Manage stock, transfers, and inventory locations</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {views.map(v => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id)}
            className={`flex items-center px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeView === v.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {v.icon}
            <span className="ml-2">{v.label}</span>
            {v.count !== undefined && v.count > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">{v.count}</span>
            )}
          </button>
        ))}
      </div>

      {renderContent()}
    </div>
  );
};
