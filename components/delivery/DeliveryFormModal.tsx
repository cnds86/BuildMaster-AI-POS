import React, { useState, useEffect } from 'react';
import { X, Truck, MapPin, Calendar, User, Phone, FileText } from 'lucide-react';
import { DeliveryOrder, Sale } from '../../types';
import { useDeliveryStore } from '../../store/useDeliveryStore';

interface DeliveryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (delivery: DeliveryOrder) => void;
  sale?: Sale | null;
}

export const DeliveryFormModal: React.FC<DeliveryFormModalProps> = ({ isOpen, onClose, onSubmit, sale }) => {
  const { vehicles, drivers } = useDeliveryStore();
  
  const [formData, setFormData] = useState<Partial<DeliveryOrder>>({
    customerName: sale?.customerName || '',
    customerPhone: '',
    deliveryAddress: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'Pending',
    estimatedWeight: 0,
    vehicleId: '',
    driverId: ''
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.deliveryAddress || !formData.scheduledDate) {
      alert('Please fill in all required fields.');
      return;
    }

    const newDelivery: DeliveryOrder = {
      id: `DEL-${Date.now()}`,
      saleId: sale?.id || '',
      customerName: formData.customerName,
      customerPhone: formData.customerPhone || '',
      deliveryAddress: formData.deliveryAddress,
      status: 'Pending',
      scheduledDate: new Date(formData.scheduledDate).toISOString(),
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedWeight: formData.estimatedWeight,
      vehicleId: formData.vehicleId || undefined,
      driverId: formData.driverId || undefined
    };

    onSubmit(newDelivery);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <Truck className="w-5 h-5 mr-2 text-indigo-600" />
            Schedule Delivery
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {sale && (
            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4 border border-blue-100">
              <span className="font-bold">Linked Sale:</span> {sale.id}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Customer Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Delivery Address *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea 
                required
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Scheduled Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Est. Weight (kg)</label>
              <div className="relative">
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={formData.estimatedWeight || ''}
                  onChange={(e) => setFormData({...formData, estimatedWeight: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Assign Vehicle</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.vehicleId || ''}
                onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
              >
                <option value="">-- Unassigned --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plateNumber} ({v.type})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Assign Driver</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.driverId || ''}
                onChange={(e) => setFormData({...formData, driverId: e.target.value})}
              >
                <option value="">-- Unassigned --</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Notes / Instructions</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea 
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[60px]"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 shrink-0">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm"
            >
              Schedule Delivery
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
