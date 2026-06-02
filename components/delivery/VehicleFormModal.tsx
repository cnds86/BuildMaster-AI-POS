import React, { useState, useEffect } from 'react';
import { X, Truck, Hash, Settings } from 'lucide-react';
import { Vehicle } from '../../types';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (vehicle: Vehicle) => void;
}

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    plateNumber: '',
    type: 'Truck',
    capacityWeight: 1000,
    status: 'Available',
    branchId: 'BR-001'
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
    if (!formData.plateNumber || !formData.type || !formData.capacityWeight) {
      alert('Please fill in all required fields.');
      return;
    }

    const newVehicle: Vehicle = {
      id: `VEH-${Date.now()}`,
      plateNumber: formData.plateNumber,
      type: formData.type as Vehicle['type'],
      capacityWeight: formData.capacityWeight,
      status: formData.status || 'Available',
      branchId: formData.branchId || 'BR-001'
    };

    onSubmit(newVehicle);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <Truck className="w-5 h-5 mr-2 text-indigo-600" />
            Add New Vehicle
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Plate Number *</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                required
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
                value={formData.plateNumber}
                onChange={(e) => setFormData({...formData, plateNumber: e.target.value.toUpperCase()})}
                placeholder="e.g., 1กข 1234"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Vehicle Type *</label>
            <div className="relative">
              <Settings className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                required
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as Vehicle['type']})}
              >
                <option value="Truck">Truck</option>
                <option value="Pickup">Pickup</option>
                <option value="Van">Van</option>
                <option value="Motorcycle">Motorcycle</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Capacity (kg) *</label>
            <div className="relative">
              <input 
                type="number" 
                required
                min="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={formData.capacityWeight || ''}
                onChange={(e) => setFormData({...formData, capacityWeight: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Status</label>
            <select 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as Vehicle['status']})}
            >
              <option value="Available">Available</option>
              <option value="In Use">In Use</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
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
              Save Vehicle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
