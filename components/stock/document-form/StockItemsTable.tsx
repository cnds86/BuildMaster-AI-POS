
import React from 'react';
import { Product, StockItem } from '../../../types';
import { Plus, Trash2 } from 'lucide-react';

interface StockItemsTableProps {
  items: any[];
  setItems: (items: any[]) => void;
  products: Product[];
  isReadOnly: boolean;
  activeTab: string;
}

export const StockItemsTable: React.FC<StockItemsTableProps> = ({ 
  items, setItems, products, isReadOnly, activeTab 
}) => {
  
  const handleAddItem = () => {
    if (!products.length) return;
    const p = products[0];
    const newItem: StockItem = {
      productId: p.id,
      productName: p.name,
      unit: p.unit,
      quantity: 1
    };
    setItems([...(items || []), newItem]);
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (field === 'productId') {
        const p = products.find(prod => prod.id === value);
        if (p) {
            newItems[index] = { ...newItems[index], productId: p.id, productName: p.name, unit: p.unit };
        }
    } else {
        newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  return (
    <div className="border-t border-slate-100 pt-4">
       <div className="flex justify-between items-center mb-2">
          <h4 className="font-bold text-slate-700">Items</h4>
          {!isReadOnly && (
            <button type="button" onClick={handleAddItem} className="text-sm text-blue-600 hover:underline flex items-center font-medium bg-blue-50 px-3 py-1.5 rounded-lg"><Plus className="w-4 h-4 mr-1"/> Add Item</button>
          )}
       </div>
       <div className="space-y-3">
          {items?.map((item: any, idx: number) => (
             <div key={idx} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <select 
                   disabled={isReadOnly}
                   value={item.productId} 
                   onChange={e => handleUpdateItem(idx, 'productId', e.target.value)} 
                   className="w-full md:flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:bg-slate-100"
                >
                   {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                </select>
                
                <div className="flex gap-2 w-full md:w-auto items-center">
                   {activeTab === 'count' ? (
                      <div className="flex-1 md:w-24">
                         <input 
                            disabled={isReadOnly}
                            type="number" 
                            value={item.countedQuantity !== undefined ? item.countedQuantity : ''} 
                            onChange={e => handleUpdateItem(idx, 'countedQuantity', parseFloat(e.target.value))} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100 font-medium"
                            placeholder="Count"
                         />
                      </div>
                   ) : (
                      <div className="flex-1 md:w-24">
                         <input 
                            disabled={isReadOnly}
                            type="number" 
                            value={item.quantity || 0} 
                            onChange={e => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value))} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100 font-medium"
                            placeholder="Qty"
                         />
                      </div>
                   )}
                   
                   {!isReadOnly && (
                       <button type="button" onClick={() => handleRemoveItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200"><Trash2 className="w-4 h-4"/></button>
                   )}
                </div>
             </div>
          ))}
          {(!items || items.length === 0) && (
             <div className="text-center py-8 text-slate-400 text-sm italic border-2 border-dashed border-slate-100 rounded-lg">No items added yet.</div>
          )}
       </div>
    </div>
  );
};
