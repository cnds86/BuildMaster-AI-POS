
import React, { useState } from 'react';
import { Product, StockItem } from '../../../types';
import { Plus, Trash2, Search, Package } from 'lucide-react';

interface StockItemsTableProps {
  items: any[];
  setItems: (items: any[]) => void;
  products: Product[];
  isReadOnly: boolean;
  activeTab: string;
  sourceWarehouseId?: string; // Passed to check available stock
}

export const StockItemsTable: React.FC<StockItemsTableProps> = ({ 
  items, setItems, products, isReadOnly, activeTab, sourceWarehouseId 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleAddItem = (p: Product) => {
    const newItem: StockItem = {
      productId: p.id,
      productName: p.name,
      unit: p.unit,
      quantity: 1
    };
    setItems([...(items || []), newItem]);
    setSearchTerm('');
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // Helper to get stock in source warehouse
  const getSourceStock = (productId: string) => {
    if (!sourceWarehouseId) return null;
    const p = products.find(prod => prod.id === productId);
    const whStock = p?.warehouseInventory?.find(inv => inv.warehouseId === sourceWarehouseId);
    return whStock ? whStock.quantity : 0;
  };

  const filteredSuggestions = products.filter(p => {
    const s = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || p.barcode.includes(s);
  }).slice(0, 5);

  return (
    <div className="border-t border-slate-100 pt-4">
       <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-slate-700">Movement Items</h4>
       </div>

       {/* Searchable Add Bar */}
       {!isReadOnly && (
         <div className="relative mb-6">
            <div className="relative">
               <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
               <input 
                  type="text"
                  placeholder="Search item to add (Name, SKU, Barcode)..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
            {searchTerm && (
               <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl mt-1 shadow-xl z-20 overflow-hidden">
                  {filteredSuggestions.length > 0 ? filteredSuggestions.map(p => (
                     <div 
                        key={p.id}
                        onClick={() => handleAddItem(p)}
                        className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center"
                     >
                        <div>
                           <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                           <p className="text-[10px] text-slate-500 font-mono">{p.sku}</p>
                        </div>
                        <div className="text-right">
                           <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600 uppercase">
                              {p.unit}
                           </span>
                        </div>
                     </div>
                  )) : (
                     <div className="p-4 text-center text-slate-400 text-sm">No products found</div>
                  )}
               </div>
            )}
         </div>
       )}

       <div className="space-y-3">
          {items?.map((item: any, idx: number) => {
             const available = getSourceStock(item.productId);
             const isOver = activeTab === 'transfer' && available !== null && item.quantity > available;

             return (
                <div key={idx} className={`flex flex-col md:flex-row gap-3 items-start md:items-center p-3 rounded-xl border transition-all ${isOver ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                   <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">{item.productName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                         <span className="text-[10px] text-slate-400 font-mono">ID: {item.productId.slice(-6)}</span>
                         {activeTab === 'transfer' && sourceWarehouseId && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isOver ? 'bg-red-200 text-red-800' : 'bg-blue-50 text-blue-700'}`}>
                               Available in Source: {available}
                            </span>
                         )}
                      </div>
                   </div>
                   
                   <div className="flex gap-3 w-full md:w-auto items-center shrink-0">
                      {activeTab === 'count' ? (
                         <div className="flex-1 md:w-32">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Actual Count</label>
                            <input 
                               disabled={isReadOnly}
                               type="number" 
                               value={item.countedQuantity !== undefined ? item.countedQuantity : ''} 
                               onChange={e => handleUpdateItem(idx, 'countedQuantity', parseFloat(e.target.value))} 
                               className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100 font-bold"
                               placeholder="Count"
                            />
                         </div>
                      ) : (
                         <div className="flex-1 md:w-32">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Move Qty</label>
                            <input 
                               disabled={isReadOnly}
                               type="number" 
                               min="0.001"
                               value={item.quantity || ''} 
                               onChange={e => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value))} 
                               className={`w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-100 font-bold ${isOver ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-200'}`}
                               placeholder="Qty"
                            />
                         </div>
                      )}

                      <div className="flex flex-col items-center justify-center h-full pt-4">
                         <span className="text-[10px] font-bold text-slate-400 uppercase">{item.unit}</span>
                      </div>
                      
                      {!isReadOnly && (
                          <div className="pt-4">
                             <button type="button" onClick={() => handleRemoveItem(idx)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
                          </div>
                      )}
                   </div>
                </div>
             );
          })}
          {(!items || items.length === 0) && (
             <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <Package className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm italic">Search and select items to move.</p>
             </div>
          )}
       </div>
    </div>
  );
};
