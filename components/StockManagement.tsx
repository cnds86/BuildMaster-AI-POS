import React, { useState } from 'react';
import { 
  Warehouse, Product, StockTransfer, StockCount, StockReservation, StockReceipt, StockAdjustment, 
  DocumentStatus, StockItem 
} from '../types';
import { 
  Plus, Edit2, Trash2, ArrowRightLeft, 
  CheckSquare, CalendarClock, Truck, SlidersHorizontal, 
  X, CheckCircle, FileText, PlayCircle, AlertCircle
} from 'lucide-react';

interface StockManagementProps {
  warehouses: Warehouse[];
  products: Product[];
  transfers: StockTransfer[];
  counts: StockCount[];
  reservations: StockReservation[];
  receipts: StockReceipt[];
  adjustments: StockAdjustment[];
  defaultItemsPerPage: number;
  onUpdateTransfer: (t: StockTransfer) => void;
  onDeleteTransfer: (id: string) => void;
  onUpdateCount: (c: StockCount) => void;
  onDeleteCount: (id: string) => void;
  onUpdateReservation: (r: StockReservation) => void;
  onDeleteReservation: (id: string) => void;
  onUpdateReceipt: (r: StockReceipt) => void;
  onDeleteReceipt: (id: string) => void;
  onUpdateAdjustment: (a: StockAdjustment) => void;
  onDeleteAdjustment: (id: string) => void;
  onStatusChange: (type: 'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment', id: string, status: DocumentStatus) => void;
}

export const StockManagement: React.FC<StockManagementProps> = ({
  warehouses, products, transfers, counts, reservations, receipts, adjustments, defaultItemsPerPage,
  onUpdateTransfer, onDeleteTransfer,
  onUpdateCount, onDeleteCount,
  onUpdateReservation, onDeleteReservation,
  onUpdateReceipt, onDeleteReceipt,
  onUpdateAdjustment, onDeleteAdjustment,
  onStatusChange
}) => {
  const [activeTab, setActiveTab] = useState<'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment'>('transfer');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({}); 
  const [error, setError] = useState<string | null>(null);

  // Helper to init form based on tab
  const initForm = () => {
    const common = {
      referenceNo: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Draft',
      items: []
    };

    switch(activeTab) {
      case 'transfer': return { ...common, sourceWarehouseId: '', targetWarehouseId: '' };
      case 'count': return { ...common, warehouseId: '', counterName: '', reason: '' };
      case 'reservation': return { ...common, warehouseId: '', customerName: '', expiryDate: '' };
      case 'receipt': return { ...common, warehouseId: '', vendorName: '', vendorInvoiceNo: '', totalCost: 0 };
      case 'adjustment': return { ...common, warehouseId: '', reason: '' };
    }
  };

  const handleOpenModal = (item?: any) => {
    setError(null);
    if (item) {
      setEditingId(item.id);
      setFormData({ ...item });
    } else {
      setEditingId(null);
      setFormData(initForm());
    }
    setIsModalOpen(true);
  };

  const validateForm = () => {
    if (!formData.date) return 'Date is required';
    
    if (activeTab === 'transfer') {
        if (!formData.sourceWarehouseId) return 'Source Warehouse is required';
        if (!formData.targetWarehouseId) return 'Target Warehouse is required';
        if (formData.sourceWarehouseId === formData.targetWarehouseId) return 'Source and Target warehouses cannot be the same';
    }
    
    if (['adjustment', 'count', 'receipt', 'reservation'].includes(activeTab)) {
        if (!formData.warehouseId) return 'Warehouse is required';
    }
    
    if (activeTab === 'receipt' && !formData.vendorName) return 'Vendor Name is required';
    
    if (activeTab === 'reservation') {
        if (!formData.customerName) return 'Customer Name is required';
        if (!formData.expiryDate) return 'Expiry Date is required';
    }
    
    if (activeTab === 'count' && !formData.counterName) return 'Counter Name is required';
    
    if (activeTab === 'adjustment' && !formData.reason) return 'Reason is required';
    
    return null;
  };

  const handleSave = () => {
    // 1. Validate
    setError(null);
    const validationError = validateForm();
    if (validationError) {
        setError(validationError);
        return;
    }

    const id = editingId || (activeTab === 'transfer' ? `TR-${Date.now()}` : 
                             activeTab === 'count' ? `SC-${Date.now()}` :
                             activeTab === 'reservation' ? `RS-${Date.now()}` :
                             activeTab === 'receipt' ? `RC-${Date.now()}` :
                             `AD-${Date.now()}`);
    
    // Always save as Draft initially or preserve existing status if editing
    const currentStatus = formData.status === 'Completed' || formData.status === 'Approved' ? formData.status : 'Draft';
    const payload = { ...formData, id, status: currentStatus };

    // Auto-generate Ref No if missing
    if (!payload.referenceNo) {
        payload.referenceNo = `${activeTab.toUpperCase().slice(0,2)}-${new Date().getFullYear()}${new Date().getMonth()+1}-${Math.floor(Math.random()*1000)}`;
    }

    switch (activeTab) {
      case 'transfer': onUpdateTransfer(payload); break;
      case 'count': onUpdateCount(payload); break;
      case 'reservation': onUpdateReservation(payload); break;
      case 'receipt': onUpdateReceipt(payload); break;
      case 'adjustment': onUpdateAdjustment(payload); break;
    }
    setIsModalOpen(false);
  };

  const handleComplete = (item: any) => {
    if (window.confirm('Confirm completion? This will update stock levels permanently.')) {
      onStatusChange(activeTab, item.id, 'Completed');
    }
  };

  const getList = () => {
    switch(activeTab) {
      case 'transfer': return transfers;
      case 'count': return counts;
      case 'reservation': return reservations;
      case 'receipt': return receipts;
      case 'adjustment': return adjustments;
      default: return [];
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this document?')) return;
    switch(activeTab) {
      case 'transfer': onDeleteTransfer(id); break;
      case 'count': onDeleteCount(id); break;
      case 'reservation': onDeleteReservation(id); break;
      case 'receipt': onDeleteReceipt(id); break;
      case 'adjustment': onDeleteAdjustment(id); break;
    }
  };

  // Simplified Item Management inside Modal
  const handleAddItem = () => {
    if (!products.length) return;
    const p = products[0];
    const newItem: StockItem = {
      productId: p.id,
      productName: p.name,
      unit: p.unit,
      quantity: 1
    };
    setFormData({ ...formData, items: [...(formData.items || []), newItem] });
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    if (field === 'productId') {
        const p = products.find(prod => prod.id === value);
        if (p) {
            newItems[index] = { ...newItems[index], productId: p.id, productName: p.name, unit: p.unit };
        }
    } else {
        newItems[index] = { ...newItems[index], [field]: value };
    }
    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const isReadOnly = formData.status !== 'Draft';

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Stock Management</h2>
          <p className="text-slate-500">Manage stock movements, counts, and adjustments.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center px-4 py-2 bg-construction-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
          <Plus className="w-4 h-4 mr-2" />
          Create Document
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
        {[
          { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft },
          { id: 'receipt', label: 'Receipt (In)', icon: Truck },
          { id: 'adjustment', label: 'Adjustment', icon: SlidersHorizontal },
          { id: 'count', label: 'Count (Audit)', icon: CheckSquare },
          { id: 'reservation', label: 'Reservation', icon: CalendarClock },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Ref No / Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Items</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {getList().map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{item.referenceNo}</div>
                    <div className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {activeTab === 'transfer' && `From: ${warehouses.find(w => w.id === item.sourceWarehouseId)?.name} To: ${warehouses.find(w => w.id === item.targetWarehouseId)?.name}`}
                    {activeTab === 'receipt' && `Vendor: ${item.vendorName} (Ref: ${item.vendorInvoiceNo})`}
                    {activeTab === 'adjustment' && `Reason: ${item.reason} @ ${warehouses.find(w => w.id === item.warehouseId)?.name}`}
                    {activeTab === 'count' && `Counter: ${item.counterName} @ ${warehouses.find(w => w.id === item.warehouseId)?.name}`}
                    {activeTab === 'reservation' && `Customer: ${item.customerName} (Exp: ${new Date(item.expiryDate).toLocaleDateString()})`}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">
                      {item.items?.length || 0} items
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      item.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                      item.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                      item.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2 items-center">
                      {/* Workflow Actions */}
                      {item.status === 'Approved' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleComplete(item);
                          }}
                          className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs font-bold shadow-sm"
                          title="Execute and Update Stock"
                        >
                          <PlayCircle className="w-3 h-3 mr-1" /> Complete
                        </button>
                      )}

                      <button onClick={(e) => { e.stopPropagation(); handleOpenModal(item); }} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded">
                        {item.status === 'Draft' ? <Edit2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </button>

                      {(item.status === 'Draft' || item.status === 'Approved') && (
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - High Z-Index to avoid overlap issues */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-xl font-bold text-slate-800 uppercase">
                {editingId ? 'Edit' : 'New'} {activeTab}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
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
                   <div className="grid grid-cols-2 gap-4">
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
                   <div className="grid grid-cols-2 gap-4">
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
                   <div className="grid grid-cols-2 gap-4">
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
                   <div className="grid grid-cols-2 gap-4">
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

                <div className="border-t border-slate-100 pt-4">
                   <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-slate-700">Items</h4>
                      {!isReadOnly && (
                        <button type="button" onClick={handleAddItem} className="text-sm text-blue-600 hover:underline flex items-center"><Plus className="w-4 h-4 mr-1"/> Add Item</button>
                      )}
                   </div>
                   <div className="space-y-2">
                      {formData.items?.map((item: any, idx: number) => (
                         <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded border border-slate-200">
                            <select 
                               disabled={isReadOnly}
                               value={item.productId} 
                               onChange={e => handleUpdateItem(idx, 'productId', e.target.value)} 
                               className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm bg-white disabled:bg-slate-100"
                            >
                               {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                            </select>
                            
                            {activeTab === 'count' ? (
                               <input 
                                  disabled={isReadOnly}
                                  type="number" 
                                  value={item.countedQuantity || 0} 
                                  onChange={e => handleUpdateItem(idx, 'countedQuantity', parseFloat(e.target.value))} 
                                  className="w-24 px-2 py-1 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                                  placeholder="Counted"
                               />
                            ) : (
                               <input 
                                  disabled={isReadOnly}
                                  type="number" 
                                  value={item.quantity || 0} 
                                  onChange={e => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value))} 
                                  className="w-24 px-2 py-1 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                                  placeholder="Qty"
                               />
                            )}
                            
                            {!isReadOnly && (
                                <button type="button" onClick={() => handleRemoveItem(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                            )}
                         </div>
                      ))}
                      {(!formData.items || formData.items.length === 0) && (
                         <div className="text-center py-4 text-slate-400 text-sm italic">No items added.</div>
                      )}
                   </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {isReadOnly ? 'Close' : 'Cancel'}
                </button>
                
                {formData.status === 'Draft' && (
                   <button
                      type="button"
                      onClick={handleSave}
                      className="px-6 py-2 bg-construction-orange text-white font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
                   >
                      Save Draft
                   </button>
                )}

                {/* Show Complete button if status is Approved */}
                {formData.status === 'Approved' && (
                   <button
                      type="button"
                      onClick={() => {
                        handleComplete(formData);
                        setIsModalOpen(false);
                      }}
                      className="flex items-center px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                   >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Complete
                   </button>
                )}

                {(formData.status === 'Completed' || formData.status === 'Cancelled') && (
                   <span className={`flex items-center font-medium px-4 ${formData.status === 'Completed' ? 'text-green-600' : 'text-red-600'}`}>
                      {formData.status === 'Completed' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />} 
                      {formData.status}
                   </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};