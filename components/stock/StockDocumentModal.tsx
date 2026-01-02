
import React, { useState, useEffect } from 'react';
import { Warehouse, Product } from '../../types';
import { Edit2, Plus, X, AlertCircle, CheckCircle, PlayCircle } from 'lucide-react';
import { StockHeaderFields } from './document-form/StockHeaderFields';
import { StockItemsTable } from './document-form/StockItemsTable';

interface StockDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment';
  editingId: string | null;
  initialData: any;
  warehouses: Warehouse[];
  products: Product[];
  onSave: (data: any) => void;
  onComplete: (data: any) => void;
}

export const StockDocumentModal: React.FC<StockDocumentModalProps> = ({
  isOpen, onClose, activeTab, editingId, initialData, warehouses, products, onSave, onComplete
}) => {
  const [formData, setFormData] = useState<any>(initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(initialData);
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isReadOnly = formData.status !== 'Draft';

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

  const handleSaveClick = () => {
    const err = validateForm();
    if (err) {
      setError(err);
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-fade-in">
        <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="text-lg md:text-xl font-bold text-slate-800 uppercase flex items-center">
            {editingId ? <Edit2 className="w-5 h-5 mr-2 text-blue-500" /> : <Plus className="w-5 h-5 mr-2 text-green-500" />}
            {editingId ? 'Edit' : 'New'} {activeTab}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 space-y-4">
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <StockHeaderFields 
              activeTab={activeTab}
              formData={formData}
              setFormData={setFormData}
              warehouses={warehouses}
              isReadOnly={isReadOnly}
            />

            <StockItemsTable 
              items={formData.items}
              setItems={(items) => setFormData({...formData, items})}
              products={products}
              isReadOnly={isReadOnly}
              activeTab={activeTab}
              sourceWarehouseId={formData.sourceWarehouseId || formData.warehouseId}
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
          >
            {isReadOnly ? 'Close' : 'Cancel'}
          </button>
          
          {formData.status === 'Draft' && (
             <button
                type="button"
                onClick={handleSaveClick}
                className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
             >
                Save Draft
             </button>
          )}

          {formData.status === 'Approved' && (
             <button
                type="button"
                onClick={() => onComplete(formData)}
                className="flex items-center px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
             >
                <PlayCircle className="w-4 h-4 mr-2" />
                Complete
             </button>
          )}

          {(formData.status === 'Completed' || formData.status === 'Cancelled') && (
             <span className={`flex items-center font-bold px-4 py-2 ${formData.status === 'Completed' ? 'text-green-600 bg-green-50 rounded-lg' : 'text-red-600 bg-red-50 rounded-lg'}`}>
                {formData.status === 'Completed' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />} 
                {formData.status}
             </span>
          )}
        </div>
      </div>
    </div>
  );
};
