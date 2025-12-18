
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Customer, CartItem, Quotation, SystemSettings } from '../../types';
import { X, Plus, Save, AlertCircle, Search, Calendar, FileText, Trash2, User, Calculator } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';

interface QuotationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  settings: SystemSettings;
  initialData?: Quotation | null;
  onSubmit: (quotationData: any) => void;
}

export const QuotationFormModal: React.FC<QuotationFormModalProps> = ({
  isOpen,
  onClose,
  products,
  customers,
  settings,
  initialData,
  onSubmit
}) => {
  const { formatPrice } = useGlobal();
  
  // Header State
  const [customerId, setCustomerId] = useState<string>('');
  const [validUntil, setValidUntil] = useState('');
  const [note, setNote] = useState('');
  
  // Items State
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  
  // Financial State
  const [discountInput, setDiscountInput] = useState<number>(0);
  
  // UI State
  const [error, setError] = useState<string | null>(null);
  const [searchProduct, setSearchProduct] = useState('');
  const [qtyInput, setQtyInput] = useState(1);

  // Initialize form
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCustomerId(initialData.customerId || '');
        setSelectedItems(initialData.items.map(item => ({...item}))); // Deep copy
        setValidUntil(new Date(initialData.validUntil).toISOString().split('T')[0]);
        setNote(initialData.note || '');
        setDiscountInput(initialData.discountAmount || 0);
      } else {
        setCustomerId('');
        setSelectedItems([]);
        setDiscountInput(0);
        // Default 7 days validity
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setValidUntil(nextWeek.toISOString().split('T')[0]);
        setNote('');
      }
      setError(null);
      setSearchProduct('');
      setQtyInput(1);
    }
  }, [isOpen, initialData]);

  // Calculations
  const subtotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + (item.sellPrice * item.quantity), 0);
  }, [selectedItems]);

  const taxAmount = useMemo(() => {
    if (!settings.tax.enabled) return 0;
    
    // Taxable amount is after discount
    const taxable = Math.max(0, subtotal - discountInput);
    const rate = settings.tax.rate / 100;

    if (settings.tax.calculationMode === 'excluded') {
       return taxable * rate;
    } else {
       // Included: Tax = Price - (Price / (1 + Rate))
       return taxable - (taxable / (1 + rate));
    }
  }, [subtotal, discountInput, settings.tax]);

  const total = useMemo(() => {
    const afterDiscount = Math.max(0, subtotal - discountInput);
    
    if (settings.tax.enabled && settings.tax.calculationMode === 'excluded') {
       return afterDiscount + taxAmount;
    }
    return afterDiscount;
  }, [subtotal, discountInput, taxAmount, settings.tax]);

  // Handlers
  const handleAddItem = (product: Product) => {
    const existingIdx = selectedItems.findIndex(i => i.id === product.id);
    
    if (existingIdx >= 0) {
      const newItems = [...selectedItems];
      newItems[existingIdx].quantity += qtyInput;
      setSelectedItems(newItems);
    } else {
      const newItem: CartItem = {
        ...product,
        quantity: qtyInput,
        sellPrice: product.price,
        sellUnit: product.unit,
        sellConversionFactor: 1
      };
      setSelectedItems([...selectedItems, newItem]);
    }
    setQtyInput(1);
    setSearchProduct('');
  };

  const handleUpdateItem = (index: number, field: 'quantity' | 'sellPrice', value: number) => {
    const newItems = [...selectedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setSelectedItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setError("Please add at least one product.");
      return;
    }
    if (!validUntil) {
      setError("Please select a validity date.");
      return;
    }

    onSubmit({
      items: selectedItems,
      customerId,
      validUntil,
      note,
      subtotal,
      discountAmount: discountInput,
      taxAmount,
      total
    });
  };

  if (!isOpen) return null;

  const filteredProducts = products.filter(p => {
    const searchLower = searchProduct.toLowerCase();
    return (
      p.name.toLowerCase().includes(searchLower) || 
      p.sku?.toLowerCase().includes(searchLower) ||
      p.barcode?.toLowerCase().includes(searchLower)
    );
  }).slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <FileText className="w-6 h-6" />
             </div>
             <div>
                <h3 className="text-xl font-bold text-slate-800">{initialData ? 'Edit Quotation' : 'New Quotation'}</h3>
                <p className="text-xs text-slate-500">{initialData ? `Ref: ${initialData.referenceNo}` : 'Drafting new estimate'}</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
             <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start shadow-sm">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Validation Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Form Header Fields */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center">
                 <User className="w-4 h-4 mr-1.5 text-slate-400" /> Customer
              </label>
              <select 
                value={customerId} 
                onChange={e => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white transition-shadow"
              >
                <option value="">Select Customer (Optional)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center">
                 <Calendar className="w-4 h-4 mr-1.5 text-slate-400" /> Valid Until
              </label>
              <input 
                type="date"
                value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
               <div className="px-4 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 text-sm font-bold uppercase tracking-wide">
                  {initialData ? initialData.status : 'DRAFT'}
               </div>
            </div>
          </div>

          {/* Product Selection */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center">
               <Search className="w-4 h-4 mr-2 text-slate-500" /> Add Products
            </h4>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="Scan barcode or search product name..." 
                  className="w-full pl-4 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={searchProduct}
                  onChange={e => setSearchProduct(e.target.value)}
                />
                {searchProduct && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 shadow-xl rounded-lg mt-1 z-20 max-h-60 overflow-y-auto">
                    {filteredProducts.length > 0 ? filteredProducts.map(p => (
                      <div 
                        key={p.id} 
                        className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 transition-colors"
                        onClick={() => handleAddItem(p)}
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{p.sku} • Stock: {p.stock}</p>
                        </div>
                        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{formatPrice(p.price)}</span>
                      </div>
                    )) : (
                      <div className="p-4 text-sm text-slate-400 text-center italic">No products found</div>
                    )}
                  </div>
                )}
              </div>
              <input 
                type="number" 
                min="1" 
                value={qtyInput}
                onChange={e => setQtyInput(parseInt(e.target.value) || 1)}
                className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-center font-bold"
                placeholder="Qty"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4 w-12 text-center">#</th>
                  <th className="p-4">Product Description</th>
                  <th className="p-4 w-32 text-right">Unit Price</th>
                  <th className="p-4 w-24 text-center">Qty</th>
                  <th className="p-4 w-32 text-right">Total</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                       No items added to quotation yet.
                    </td>
                  </tr>
                ) : (
                  selectedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{item.sku}</div>
                      </td>
                      <td className="p-4 text-right">
                         <input 
                           type="number" 
                           min="0"
                           value={item.sellPrice}
                           onChange={e => handleUpdateItem(idx, 'sellPrice', parseFloat(e.target.value))}
                           className="w-24 px-2 py-1 border border-slate-200 rounded text-right text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                         />
                      </td>
                      <td className="p-4 text-center">
                         <input 
                           type="number" 
                           min="1"
                           value={item.quantity}
                           onChange={e => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value))}
                           className="w-20 px-2 py-1 border border-slate-200 rounded text-center text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                        />
                      </td>
                      <td className="p-4 text-right font-bold text-slate-800">{formatPrice(item.sellPrice * item.quantity)}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleRemoveItem(idx)} className="text-slate-300 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
             {/* Notes */}
             <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">Terms & Notes</label>
                <textarea 
                   value={note}
                   onChange={e => setNote(e.target.value)}
                   className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 h-32 resize-none text-sm bg-white"
                   placeholder="e.g. Price valid for 7 days. 50% deposit required."
                />
             </div>

             {/* Totals Calculation */}
             <div className="w-full md:w-80 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 h-fit">
                <div className="flex justify-between text-sm text-slate-600">
                   <span>Subtotal</span>
                   <span className="font-bold">{formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm text-slate-600">
                   <span className="flex items-center">Discount <Calculator className="w-3 h-3 ml-1 text-slate-400" /></span>
                   <input 
                      type="number"
                      min="0"
                      value={discountInput}
                      onChange={e => setDiscountInput(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-slate-200 rounded text-right text-sm focus:ring-1 focus:ring-green-500 text-green-600 font-bold"
                   />
                </div>

                {settings.tax.enabled && (
                   <div className="flex justify-between text-sm text-slate-500">
                      <span>Tax ({settings.tax.rate}%)</span>
                      <span>{formatPrice(taxAmount)}</span>
                   </div>
                )}

                <div className="border-t border-slate-100 my-2 pt-3 flex justify-between items-end">
                   <span className="font-bold text-lg text-slate-800">Total</span>
                   <span className="font-bold text-2xl text-blue-700">{formatPrice(total)}</span>
                </div>
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {initialData ? 'Update Quotation' : 'Save Quotation'}
          </button>
        </div>
      </div>
    </div>
  );
};
