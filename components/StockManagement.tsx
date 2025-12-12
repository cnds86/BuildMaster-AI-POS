import React, { useState, useEffect } from 'react';
import { 
  Warehouse, 
  Product, 
  StockTransfer, 
  StockCount, 
  StockReservation, 
  StockReceipt, 
  StockAdjustment, 
  StockItem, 
  StockCountItem,
  StockReceiptItem,
  DocumentStatus 
} from '../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  Archive, 
  ArrowRightLeft, 
  CheckSquare, 
  CalendarClock, 
  Truck, 
  SlidersHorizontal,
  Search, 
  Calendar, 
  User, 
  FileText, 
  ArrowRight,
  MapPin,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface StockManagementProps {
  warehouses: Warehouse[];
  products: Product[];
  transfers: StockTransfer[];
  counts: StockCount[];
  reservations: StockReservation[];
  receipts: StockReceipt[];
  adjustments: StockAdjustment[];
  defaultItemsPerPage?: number;
  
  onUpdateTransfer: (t: StockTransfer) => void;
  onUpdateCount: (c: StockCount) => void;
  onUpdateReservation: (r: StockReservation) => void;
  onUpdateReceipt: (r: StockReceipt) => void;
  onUpdateAdjustment: (a: StockAdjustment) => void;
  
  onDeleteTransfer: (id: string) => void;
  onDeleteCount: (id: string) => void;
  onDeleteReservation: (id: string) => void;
  onDeleteReceipt: (id: string) => void;
  onDeleteAdjustment: (id: string) => void;

  onStatusChange: (type: 'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment', id: string, status: DocumentStatus) => void;
}

type TabType = 'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment';

export const StockManagement: React.FC<StockManagementProps> = ({
  warehouses,
  products,
  transfers,
  counts,
  reservations,
  receipts,
  adjustments,
  defaultItemsPerPage = 10,
  onUpdateTransfer,
  onUpdateCount,
  onUpdateReservation,
  onUpdateReceipt,
  onUpdateAdjustment,
  onDeleteTransfer,
  onDeleteCount,
  onDeleteReservation,
  onDeleteReceipt,
  onDeleteAdjustment,
  onStatusChange
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('transfer');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Generic form state to handle all types
  const [formData, setFormData] = useState<any>({});
  
  // Temporary state for adding items to the document
  const [tempItem, setTempItem] = useState<{
    productId: string;
    quantity: number;
    countedQuantity?: number; // for Count
    costPrice?: number; // for Receipt
  }>({ productId: '', quantity: 1, countedQuantity: 0, costPrice: 0 });

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const getWarehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || id;

  // List Data Logic with Pagination
  const getList = () => {
    let list: any[] = [];
    switch (activeTab) {
      case 'transfer': list = transfers; break;
      case 'count': list = counts; break;
      case 'reservation': list = reservations; break;
      case 'receipt': list = receipts; break;
      case 'adjustment': list = adjustments; break;
    }
    return list; // Return full list for pagination slice
  };

  const currentList = getList();
  const totalPages = Math.ceil(currentList.length / defaultItemsPerPage);
  const startIndex = (currentPage - 1) * defaultItemsPerPage;
  const paginatedList = currentList.slice(startIndex, startIndex + defaultItemsPerPage);

  const handleOpenModal = (item?: any) => {
    setEditingId(item?.id || null);
    setTempItem({ productId: '', quantity: 1, countedQuantity: 0, costPrice: 0 });

    if (item) {
      setFormData({ ...item });
    } else {
      // Default Initial State based on Tab
      const base = {
        id: '', // Generated on save
        date: new Date().toISOString().split('T')[0],
        status: 'Draft',
        items: [],
        referenceNo: ''
      };

      switch (activeTab) {
        case 'transfer':
          setFormData({ ...base, sourceWarehouseId: '', targetWarehouseId: '' });
          break;
        case 'count':
          setFormData({ ...base, warehouseId: '', counterName: '', reason: '' });
          break;
        case 'reservation':
          setFormData({ ...base, warehouseId: '', customerName: '', expiryDate: '' });
          break;
        case 'receipt':
          setFormData({ ...base, warehouseId: '', vendorName: '', vendorInvoiceNo: '', totalCost: 0 });
          break;
        case 'adjustment':
          setFormData({ ...base, warehouseId: '', reason: '' });
          break;
      }
    }
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    if (!tempItem.productId || tempItem.quantity === 0) return;
    
    const product = products.find(p => p.id === tempItem.productId);
    if (!product) return;

    let newItem: any = {
      productId: product.id,
      productName: product.name,
      unit: product.unit,
      quantity: tempItem.quantity
    };

    if (activeTab === 'count') {
      // Find current system stock for the selected warehouse
      const whId = formData.warehouseId;
      const sysQty = product.warehouseInventory?.find(w => w.warehouseId === whId)?.quantity || 0;
      
      newItem = {
        ...newItem,
        quantity: sysQty,
        systemQuantity: sysQty,
        countedQuantity: tempItem.countedQuantity || 0,
        diff: (tempItem.countedQuantity || 0) - sysQty
      } as StockCountItem;
    } else if (activeTab === 'receipt') {
      newItem = {
        ...newItem,
        costPrice: tempItem.costPrice || 0
      } as StockReceiptItem;
    }

    setFormData({
      ...formData,
      items: [...(formData.items || []), newItem]
    });
    
    // Reset temp item but keep warehouse if needed
    setTempItem({ ...tempItem, productId: '', quantity: 1, countedQuantity: 0 });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...(formData.items || [])];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingId || (activeTab === 'transfer' ? `TR-${Date.now()}` : 
                             activeTab === 'count' ? `SC-${Date.now()}` :
                             activeTab === 'reservation' ? `RS-${Date.now()}` :
                             activeTab === 'receipt' ? `RC-${Date.now()}` :
                             `AD-${Date.now()}`);
    
    const payload = { ...formData, id };

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

  const getDeleteHandler = (id: string) => {
    switch (activeTab) {
      case 'transfer': onDeleteTransfer(id); break;
      case 'count': onDeleteCount(id); break;
      case 'reservation': onDeleteReservation(id); break;
      case 'receipt': onDeleteReceipt(id); break;
      case 'adjustment': onDeleteAdjustment(id); break;
    }
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'transfer', label: 'Transfers', icon: ArrowRightLeft },
    { id: 'count', label: 'Stock Counts', icon: CheckSquare },
    { id: 'reservation', label: 'Reservations', icon: CalendarClock },
    { id: 'receipt', label: 'Goods Receipt', icon: Truck },
    { id: 'adjustment', label: 'Adjustments', icon: SlidersHorizontal },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Stock Management</h2>
          <p className="text-slate-500">Manage inventory movements and audits.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center px-4 py-2 bg-construction-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 rounded-t-lg font-medium transition-colors whitespace-nowrap ${
                isActive 
                  ? 'bg-white text-primary-600 border-b-2 border-primary-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reference / Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Items</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400">
                    No documents found.
                  </td>
                </tr>
              ) : (
                paginatedList.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{item.referenceNo}</div>
                      <div className="text-xs text-slate-500 flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {activeTab === 'transfer' && (
                        <div className="flex items-center space-x-2">
                           <span>{getWarehouseName(item.sourceWarehouseId)}</span>
                           <ArrowRight className="w-4 h-4 text-slate-400" />
                           <span>{getWarehouseName(item.targetWarehouseId)}</span>
                        </div>
                      )}
                      {activeTab === 'count' && (
                        <div>
                          <div>Warehouse: {getWarehouseName(item.warehouseId)}</div>
                          <div className="text-xs text-slate-400">By: {item.counterName}</div>
                        </div>
                      )}
                      {activeTab === 'reservation' && (
                        <div>
                           <div>Customer: {item.customerName}</div>
                           <div className="text-xs text-red-400">Exp: {item.expiryDate}</div>
                        </div>
                      )}
                      {activeTab === 'receipt' && (
                        <div>
                           <div>Vendor: {item.vendorName}</div>
                           <div className="text-xs text-slate-400">Inv: {item.vendorInvoiceNo}</div>
                        </div>
                      )}
                      {activeTab === 'adjustment' && (
                        <div>
                           <div>Warehouse: {getWarehouseName(item.warehouseId)}</div>
                           <div className="text-xs text-slate-400">{item.reason}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">
                        {item.items?.length || 0} items
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                        item.status === 'Draft' ? 'bg-slate-100 text-slate-600' :
                        item.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                        item.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end space-x-2">
                         <button 
                            onClick={() => handleOpenModal(item)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded"
                         >
                           <Edit2 className="w-4 h-4" />
                         </button>
                         <button 
                            onClick={() => {
                               if (confirm('Delete this document?')) getDeleteHandler(item.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {currentList.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + defaultItemsPerPage, currentList.length)}</span> of <span className="font-medium">{currentList.length}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <span className="text-sm font-medium text-slate-600">Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl shrink-0">
              <h3 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Document' : 'New Document'} - {tabs.find(t => t.id === activeTab)?.label}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* Header Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reference No.</label>
                    <input
                      type="text"
                      placeholder="Auto-generated"
                      value={formData.referenceNo || ''}
                      onChange={e => setFormData({ ...formData, referenceNo: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-slate-50"
                    />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                     <div className="px-3 py-2 bg-slate-100 rounded-lg text-slate-600 font-bold border border-slate-200">
                       {formData.status}
                     </div>
                  </div>
                </div>

                {/* Specific Fields per Tab */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                   {activeTab === 'transfer' && (
                     <>
                       <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Source Warehouse</label>
                         <select
                           required
                           value={formData.sourceWarehouseId}
                           onChange={e => setFormData({ ...formData, sourceWarehouseId: e.target.value })}
                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                         >
                           <option value="">Select Source</option>
                           {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                         </select>
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Target Warehouse</label>
                         <select
                           required
                           value={formData.targetWarehouseId}
                           onChange={e => setFormData({ ...formData, targetWarehouseId: e.target.value })}
                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                         >
                           <option value="">Select Target</option>
                           {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                         </select>
                       </div>
                     </>
                   )}

                   {(activeTab === 'count' || activeTab === 'adjustment' || activeTab === 'receipt' || activeTab === 'reservation') && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse</label>
                         <select
                           required
                           value={formData.warehouseId}
                           onChange={e => setFormData({ ...formData, warehouseId: e.target.value })}
                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                         >
                           <option value="">Select Warehouse</option>
                           {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                         </select>
                      </div>
                   )}
                   
                   {activeTab === 'count' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Counter Name</label>
                          <input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.counterName} onChange={e => setFormData({...formData, counterName: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                           <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                           <input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
                        </div>
                      </>
                   )}

                   {activeTab === 'reservation' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                          <input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                          <input type="date" className="w-full px-3 py-2 border rounded-lg" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
                        </div>
                      </>
                   )}

                   {activeTab === 'receipt' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name</label>
                          <input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.vendorName} onChange={e => setFormData({...formData, vendorName: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Invoice No</label>
                          <input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.vendorInvoiceNo} onChange={e => setFormData({...formData, vendorInvoiceNo: e.target.value})} />
                        </div>
                      </>
                   )}
                   
                   {activeTab === 'adjustment' && (
                      <div className="md:col-span-2">
                         <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Adjustment</label>
                         <input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="e.g. Damaged goods, Found inventory" />
                      </div>
                   )}
                </div>

                {/* Items Section */}
                <div>
                   <h4 className="font-bold text-slate-800 mb-2">Line Items</h4>
                   {/* Add Item Row */}
                   {formData.status === 'Draft' && (
                     <div className="flex flex-col md:flex-row gap-2 items-end mb-4 bg-slate-50 p-3 rounded-lg border border-dashed border-slate-300">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>
                          <select
                            value={tempItem.productId}
                            onChange={e => setTempItem({ ...tempItem, productId: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                          >
                             <option value="">Select Product</option>
                             {products.map(p => {
                               // For Source Warehouse in Transfer, show current stock
                               let stockDisplay = `${p.stock} ${p.unit}`;
                               if (activeTab === 'transfer' && formData.sourceWarehouseId) {
                                  const whStock = p.warehouseInventory?.find(w => w.warehouseId === formData.sourceWarehouseId)?.quantity || 0;
                                  stockDisplay = `${whStock} ${p.unit} in source`;
                               }
                               return (
                                 <option key={p.id} value={p.id}>{p.name} ({p.sku}) - {stockDisplay}</option>
                               );
                             })}
                          </select>
                        </div>
                        
                        {activeTab === 'count' ? (
                          <div className="w-32">
                             <label className="block text-xs font-medium text-slate-500 mb-1">Counted Qty</label>
                             <input
                               type="number"
                               value={tempItem.countedQuantity}
                               onChange={e => setTempItem({ ...tempItem, countedQuantity: parseFloat(e.target.value) })}
                               className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                             />
                          </div>
                        ) : (
                           <div className="w-32">
                             <label className="block text-xs font-medium text-slate-500 mb-1">{activeTab === 'adjustment' ? '+/- Qty' : 'Quantity'}</label>
                             <input
                               type="number"
                               value={tempItem.quantity}
                               onChange={e => {
                                 const val = parseFloat(e.target.value);
                                 setTempItem({ ...tempItem, quantity: val });
                               }}
                               max={activeTab === 'transfer' && formData.sourceWarehouseId ? 
                                 (products.find(p => p.id === tempItem.productId)?.warehouseInventory?.find(w => w.warehouseId === formData.sourceWarehouseId)?.quantity || undefined) 
                                 : undefined}
                               className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                             />
                           </div>
                        )}

                        {activeTab === 'receipt' && (
                           <div className="w-32">
                             <label className="block text-xs font-medium text-slate-500 mb-1">Cost / Unit</label>
                             <input
                               type="number"
                               value={tempItem.costPrice}
                               onChange={e => setTempItem({ ...tempItem, costPrice: parseFloat(e.target.value) })}
                               className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                             />
                           </div>
                        )}

                        <button 
                          type="button" 
                          onClick={handleAddItem}
                          disabled={!tempItem.productId}
                          className="px-4 py-2 bg-slate-800 text-white rounded text-sm font-medium hover:bg-slate-900 disabled:opacity-50"
                        >
                          Add
                        </button>
                     </div>
                   )}

                   {/* Items Table */}
                   <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 text-slate-600">
                         <tr>
                            <th className="px-3 py-2 rounded-l-lg">Product</th>
                            <th className="px-3 py-2 text-right">Quantity</th>
                            {activeTab === 'count' && <th className="px-3 py-2 text-right">System Qty</th>}
                            {activeTab === 'count' && <th className="px-3 py-2 text-right">Diff</th>}
                            {activeTab === 'receipt' && <th className="px-3 py-2 text-right">Cost</th>}
                            {formData.status === 'Draft' && <th className="px-3 py-2 rounded-r-lg w-10"></th>}
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {formData.items?.map((item: any, idx: number) => (
                            <tr key={idx}>
                               <td className="px-3 py-2">{item.productName} <span className="text-xs text-slate-400">({item.unit})</span></td>
                               <td className="px-3 py-2 text-right font-bold">
                                  {activeTab === 'count' ? item.countedQuantity : item.quantity}
                               </td>
                               {activeTab === 'count' && (
                                 <>
                                   <td className="px-3 py-2 text-right text-slate-500">{item.systemQuantity}</td>
                                   <td className={`px-3 py-2 text-right font-bold ${item.diff < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                      {item.diff > 0 ? '+' : ''}{item.diff}
                                   </td>
                                 </>
                               )}
                               {activeTab === 'receipt' && (
                                  <td className="px-3 py-2 text-right">${item.costPrice}</td>
                               )}
                               {formData.status === 'Draft' && (
                                 <td className="px-3 py-2 text-center">
                                    <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600">
                                       <X className="w-4 h-4" />
                                    </button>
                                 </td>
                               )}
                            </tr>
                         ))}
                         {(!formData.items || formData.items.length === 0) && (
                            <tr>
                               <td colSpan={6} className="text-center py-4 text-slate-400 italic">No items added yet.</td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>

              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end items-center bg-slate-50 shrink-0 space-x-3">
                   {/* Actions based on Status */}
                   {formData.status === 'Draft' ? (
                     <>
                        <button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 bg-construction-orange text-white font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-sm flex items-center"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </button>
                     </>
                   ) : (
                     <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
                      >
                        Close
                      </button>
                   )}
                   
                   {formData.status === 'Approved' && (activeTab === 'transfer' || activeTab === 'receipt') && (
                      <button
                        type="button"
                        onClick={() => {
                           onStatusChange(activeTab, formData.id, 'Completed');
                           setIsModalOpen(false);
                        }}
                        className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center"
                     >
                        <Archive className="w-4 h-4 mr-2" />
                        Complete
                     </button>
                   )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};