
import React, { useState, useEffect } from 'react';
import { Product, Customer, CartItem } from '../../types';
import { X, Plus, Trash2, Save, AlertCircle, Search } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';

interface BackOfficeSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  onProcessSale: (
    items: CartItem[], 
    total: number, 
    customerId?: string, 
    discountAmount?: number, 
    subtotal?: number,
    paymentMethod?: 'cash' | 'card' | 'transfer' | 'qr' | 'credit',
    amountReceived?: number,
    change?: number,
    pointsRedeemed?: number,
    source?: 'pos' | 'back-office'
  ) => Promise<any>;
}

export const BackOfficeSaleModal: React.FC<BackOfficeSaleModalProps> = ({
  isOpen,
  onClose,
  products,
  customers,
  onProcessSale
}) => {
  const { formatPrice } = useGlobal();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'credit'>('cash');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Item adding state
  const [searchProduct, setSearchProduct] = useState('');
  const [qtyInput, setQtyInput] = useState(1);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setSelectedCustomerId('');
      setSelectedItems([]);
      setPaymentMethod('cash');
      setError(null);
      setSearchProduct('');
      setQtyInput(1);
    }
  }, [isOpen]);

  const handleAddItem = (product: Product) => {
    // Check if already exists
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
    setSearchProduct(''); // Clear search to allow quick adding next item
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };

  const calculateTotal = () => {
    return selectedItems.reduce((acc, item) => acc + (item.sellPrice * item.quantity), 0);
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      setError("Please add at least one product.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const total = calculateTotal();

    try {
      // Calling processSale with 'back-office' source to trigger strict stock check
      await onProcessSale(
        selectedItems,
        total,
        selectedCustomerId || undefined,
        0, // discount
        total, // subtotal
        paymentMethod,
        total, // amountReceived (assume full payment unless credit)
        0, // change
        0, // points
        'back-office' // <--- CRITICAL: This flags strict stock check
      );
      
      onClose();
      alert("Sale created successfully!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create sale");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Updated Search Logic: Includes Barcode check
  const filteredProducts = products.filter(p => {
    const searchLower = searchProduct.toLowerCase();
    return (
      p.name.toLowerCase().includes(searchLower) || 
      p.sku?.toLowerCase().includes(searchLower) ||
      p.barcode?.toLowerCase().includes(searchLower)
    );
  }).slice(0, 5); // Limit suggestions

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">New Back Office Sale</h3>
            <p className="text-xs text-slate-500">Create invoice / wholesale order (Strict Stock Check)</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Transaction Failed</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Customer & Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-black mb-1">Customer</label>
              <select 
                value={selectedCustomerId} 
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
              >
                <option value="">Walk-in Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-1">Payment Method</label>
              <select 
                value={paymentMethod} 
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
              >
                <option value="cash">Cash</option>
                <option value="transfer">Bank Transfer</option>
                <option value="card">Credit Card</option>
                <option value="credit">Credit / Debt ( ติดหนี้ )</option>
              </select>
            </div>
          </div>

          {/* Product Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-sm font-bold text-black mb-2">Add Products</label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by Name, SKU, or Barcode..." 
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-black placeholder:text-slate-400"
                  value={searchProduct}
                  onChange={e => setSearchProduct(e.target.value)}
                />
                {/* Autocomplete Dropdown */}
                {searchProduct && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 shadow-lg rounded-lg mt-1 z-10 max-h-48 overflow-y-auto">
                    {filteredProducts.length > 0 ? filteredProducts.map(p => (
                      <div 
                        key={p.id} 
                        className="p-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                        onClick={() => handleAddItem(p)}
                      >
                        <div>
                          <p className="text-sm font-bold text-black">{p.name}</p>
                          <p className="text-xs text-black">{p.sku} | Barcode: {p.barcode || '-'} | Stock: {p.stock}</p>
                        </div>
                        <span className="text-sm font-bold text-blue-600">{formatPrice(p.price)}</span>
                      </div>
                    )) : (
                      <div className="p-3 text-sm text-slate-400 text-center">No products found</div>
                    )}
                  </div>
                )}
              </div>
              <input 
                type="number" 
                min="1" 
                value={qtyInput}
                onChange={e => setQtyInput(parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center text-black font-bold"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-black font-bold border-b">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3 text-right">Price</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">No items added to invoice.</td>
                  </tr>
                ) : (
                  selectedItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3">
                        <div className="font-bold text-black">{item.name}</div>
                        <div className="text-xs text-black">{item.sku}</div>
                      </td>
                      <td className="p-3 text-right text-black">{formatPrice(item.sellPrice)}</td>
                      <td className="p-3 text-center text-black">{item.quantity}</td>
                      <td className="p-3 text-right font-bold text-black">{formatPrice(item.sellPrice * item.quantity)}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t">
                <tr>
                  <td colSpan={3} className="p-3 text-right text-black">Grand Total:</td>
                  <td className="p-3 text-right text-lg text-black">{formatPrice(calculateTotal())}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg border border-slate-200"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || selectedItems.length === 0}
            className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Processing...' : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Confirm Sale
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
