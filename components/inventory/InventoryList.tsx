
import React, { useState, useMemo, useEffect } from 'react';
import { Product, CategoryItem } from '../../types';
import { AlertTriangle, Box, Edit2, Tag, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from '../ux';

interface InventoryListProps {
  products: Product[];
  categories: CategoryItem[];
  formatPrice: (price: number) => string;
  viewMode: 'list' | 'grid';
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onPrintLabel: (product: Product) => void;
}

const ITEMS_PER_PAGE = 20;

export const InventoryList: React.FC<InventoryListProps> = ({ 
  products, 
  categories, 
  formatPrice, 
  viewMode,
  onEdit, 
  onDelete, 
  onPrintLabel 
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when products change (e.g. filter changes)
  useEffect(() => {
    setCurrentPage(1);
  }, [products]);

  const getCategoryName = (idOrName: string) => {
    const cat = categories.find(c => c.id === idOrName);
    return cat ? cat.name : idOrName; 
  };

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return products.slice(start, start + ITEMS_PER_PAGE);
  }, [products, currentPage]);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1">
        <EmptyState
          icon={Box}
          title="No products match your filters"
          description="Try clearing the search or category filter to see all inventory items."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {/* LIST VIEW (TABLE) */}
        {viewMode === 'list' && (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap pl-8">Product Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">SKU / Code</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.map((product) => {
                const isLowStock = product.stock < (product.minStock || 20);
                return (
                  <tr key={product.id} className={`hover:bg-slate-50 transition-colors group ${isLowStock ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap pl-8">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-100">
                           {product.imageUrl ? (
                             <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                           ) : (
                             <Box className="w-5 h-5 text-slate-300" />
                           )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 truncate max-w-[200px]" title={product.name}>{product.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {product.id.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="mb-1">
                         <div className="flex items-center text-xs">
                           <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 mr-2 border border-slate-200">{product.sku}</span>
                         </div>
                      </div>
                      {product.variants?.slice(0, 2).map((v) => (
                        <div key={v.id} className="text-[10px] text-slate-500 ml-1 truncate max-w-[150px]">
                           • {v.name}
                        </div>
                      ))}
                      {product.variants && product.variants.length > 2 && <div className="text-[10px] text-slate-400 ml-1">+{product.variants.length - 2} more</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-600 rounded-full">
                        {getCategoryName(product.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                       <div className="text-sm font-bold text-slate-900">{formatPrice(product.price)}</div>
                       <div className="text-[10px] text-slate-400 uppercase">{product.unit}</div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <div className={`font-bold flex items-center justify-end ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}>
                          {isLowStock && (
                            <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />
                          )}
                          {product.stock}
                        </div>
                        <span className="text-[10px] text-slate-400">Min: {product.minStock || 20}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap pr-8">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => onPrintLabel(product)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Print Label"
                        >
                          <Tag className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onEdit(product)}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDelete(product.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* GRID VIEW (CARDS) */}
        {viewMode === 'grid' && (
          <div className="p-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
               {paginatedProducts.map((product) => {
                  const isLowStock = product.stock < (product.minStock || 20);
                  return (
                     <div 
                        key={product.id}
                        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative flex flex-col group hover:shadow-md transition-all hover:border-slate-300"
                     >
                        <div className="p-4 flex gap-4 items-start">
                           {/* Image */}
                           <div className="w-16 h-16 bg-slate-50 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center relative">
                              {product.imageUrl ? (
                                 <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                 <Box className="w-6 h-6 text-slate-300" />
                              )}
                           </div>
                           
                           {/* Content */}
                           <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-slate-900 text-sm truncate" title={product.name}>{product.name}</h3>
                              <p className="text-xs text-slate-500 truncate mt-0.5">{getCategoryName(product.category)}</p>
                              <div className="flex items-center gap-2 mt-2">
                                 <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">{product.sku}</span>
                                 {isLowStock && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Low Stock</span>}
                              </div>
                           </div>
                        </div>

                        <div className="px-4 pb-3 flex justify-between items-end mt-auto">
                           <div>
                              <span className="text-lg font-bold text-slate-900">{formatPrice(product.price)}</span>
                              <span className="text-xs text-slate-400 ml-1">/{product.unit}</span>
                           </div>
                           <div className={`text-sm font-bold ${isLowStock ? 'text-red-600' : 'text-slate-600'}`}>
                              {product.stock} available
                           </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="grid grid-cols-3 border-t border-slate-100 divide-x divide-slate-100 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                              onClick={() => onPrintLabel(product)}
                              className="py-3 flex items-center justify-center text-slate-500 hover:bg-white text-xs font-bold hover:text-blue-600 transition-colors"
                           >
                              <Tag className="w-3.5 h-3.5 mr-1.5" /> Label
                           </button>
                           <button 
                              onClick={() => onEdit(product)}
                              className="py-3 flex items-center justify-center text-slate-500 hover:bg-white text-xs font-bold hover:text-slate-900 transition-colors"
                           >
                              <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                           </button>
                           <button 
                              onClick={() => onDelete(product.id)}
                              className="py-3 flex items-center justify-center text-slate-500 hover:bg-white text-xs font-bold hover:text-red-600 transition-colors"
                           >
                              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Del
                           </button>
                        </div>
                     </div>
                  );
               })}
             </div>
          </div>
        )}
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-100 bg-white flex justify-between items-center z-10 shrink-0">
           <button 
             onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
             disabled={currentPage === 1}
             className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center text-sm font-medium"
           >
             <ChevronLeft className="w-4 h-4 mr-1" /> Previous
           </button>
           
           <span className="text-sm font-medium text-slate-600">
              Page {currentPage} of {totalPages}
              <span className="text-slate-400 ml-2 text-xs">({products.length} items)</span>
           </span>

           <button 
             onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
             disabled={currentPage === totalPages}
             className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center text-sm font-medium"
           >
             Next <ChevronRight className="w-4 h-4 ml-1" />
           </button>
        </div>
      )}
    </div>
  );
};
