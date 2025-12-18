
import React from 'react';
import { Warehouse } from '../../../types';

interface StockHeaderFieldsProps {
  activeTab: 'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment';
  formData: any;
  setFormData: (data: any) => void;
  warehouses: Warehouse[];
  isReadOnly: boolean;
}

export const StockHeaderFields: React.FC<StockHeaderFieldsProps> = ({
  activeTab, formData, setFormData, warehouses, isReadOnly
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
            <input 
              type="date" 
              disabled={isReadOnly}
              required 
              value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''} 
              onChange={e => setFormData({...formData, date: e.target.value})} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500" 
            />
         </div>
         <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ref No</label>
            <input 
              type="text" 
              disabled={isReadOnly}
              value={formData.referenceNo} 
              onChange={e => setFormData({...formData, referenceNo: e.target.value})} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500" 
              placeholder="Auto-generated if empty" 
            />
         </div>
      </div>

      {/* Dynamic Fields based on Type */}
      {activeTab === 'transfer' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Source Warehouse *</label>
               <select 
                  disabled={isReadOnly}
                  required 
                  value={formData.sourceWarehouseId} 
                  onChange={e => setFormData({...formData, sourceWarehouseId: e.target.value})} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100 disabled:text-slate-500"
               >
                  <option value="">Select Source</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Target Warehouse *</label>
               <select 
                  disabled={isReadOnly}
                  required 
                  value={formData.targetWarehouseId} 
                  onChange={e => setFormData({...formData, targetWarehouseId: e.target.value})} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100 disabled:text-slate-500"
               >
                  <option value="">Select Target</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
               </select>
            </div>
         </div>
      )}

      {(activeTab === 'adjustment' || activeTab === 'count' || activeTab === 'receipt' || activeTab === 'reservation') && (
         <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse *</label>
            <select 
              disabled={isReadOnly}
              required 
              value={formData.warehouseId} 
              onChange={e => setFormData({...formData, warehouseId: e.target.value})} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100 disabled:text-slate-500"
            >
               <option value="">Select Warehouse</option>
               {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
         </div>
      )}

      {activeTab === 'receipt' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name *</label>
               <input 
                  disabled={isReadOnly}
                  type="text" 
                  required 
                  value={formData.vendorName} 
                  onChange={e => setFormData({...formData, vendorName: e.target.value})} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500" 
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Invoice No</label>
               <input 
                  disabled={isReadOnly}
                  type="text" 
                  value={formData.vendorInvoiceNo} 
                  onChange={e => setFormData({...formData, vendorInvoiceNo: e.target.value})} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500" 
               />
            </div>
         </div>
      )}

      {activeTab === 'reservation' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name *</label>
               <input 
                  disabled={isReadOnly}
                  type="text" 
                  required 
                  value={formData.customerName} 
                  onChange={e => setFormData({...formData, customerName: e.target.value})} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500" 
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date *</label>
               <input 
                  disabled={isReadOnly}
                  type="date" 
                  required 
                  value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : ''} 
                  onChange={e => setFormData({...formData, expiryDate: e.target.value})} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500" 
               />
            </div>
         </div>
      )}

      {activeTab === 'count' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Counter Name *</label>
               <input 
                  disabled={isReadOnly}
                  type="text" 
                  required 
                  value={formData.counterName} 
                  onChange={e => setFormData({...formData, counterName: e.target.value})} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500" 
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
               <input 
                  disabled={isReadOnly}
                  type="text" 
                  value={formData.reason} 
                  onChange={e => setFormData({...formData, reason: e.target.value})} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500" 
               />
            </div>
         </div>
      )}

      {activeTab === 'adjustment' && (
         <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
            <input 
              disabled={isReadOnly}
              type="text" 
              required 
              value={formData.reason} 
              onChange={e => setFormData({...formData, reason: e.target.value})} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500" 
            />
         </div>
      )}
    </div>
  );
};
