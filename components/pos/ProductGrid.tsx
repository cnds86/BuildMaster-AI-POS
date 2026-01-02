
import React, { useState, useMemo } from 'react';
import { Product, Category } from '../../types';
import { Search, Box, ScanBarcode, LayoutGrid, List, Plus, Tag } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';
import { useCartStore } from '../../store/useCartStore';

interface ProductGridProps {
  products: Product[];
  onScanClick: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onScan: (code: string) => void; 
  onProductSelect: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ 
  products, 
  onScanClick,
  searchTerm,
  setSearchTerm,
  onScan,
  onProductSelect
}) => {
  const { formatPrice, t } = useGlobal();
  const addToCart = useCartStore((state) => state.addToCart);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const searchLower = searchTerm.toLowerCase();
      const matchesMain = 
        p.name.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower) ||
        p.barcode?.includes(searchLower);
      
      const matchesVariant = p.variants && p.variants.some(v => 
        v.code.toLowerCase().includes(searchLower) || 
        v.barcode.includes(searchLower)
      );
      
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return (matchesMain || matchesVariant) && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) return;
    onScan(searchTerm);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search & Filter Bar - Style A */}
      <div className="px-6 pb-4 pt-0 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleFormSubmit} className="relative flex-1 flex gap-3">
            <div className="relative flex-1 group">
               <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-slate-800 transition-colors" />
               <input
                 id="pos-search-input"
                 type="text"
                 placeholder={t('pos.scanPlaceholder')}
                 className="w-full pl-12 pr-4 py-3.5 border-none rounded-xl bg-slate-100 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 autoFocus
               />
            </div>
            <button type="button" onClick={onScanClick} className="bg-slate-100 text-slate-600 px-4 rounded-xl hover:bg-slate-200 transition-colors">
               <ScanBarcode className="w-6 h-6" />
            </button>
          </form>

          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 items-center self-end md:self-auto h-[52px]">
             <button 
                onClick={() => setViewMode('list')} 
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                title="List View"
             >
                <List className="w-5 h-5" />
             </button>
             <button 
                onClick={() => setViewMode('grid')} 
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                title="Grid View"
             >
                <LayoutGrid className="w-5 h-5" />
             </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
          <button 
            onClick={() => setSelectedCategory('all')} 
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
          >
            {t('pos.allItems')}
          </button>
          {Object.values(Category).map(cat => (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat)} 
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 md:pb-6 custom-scrollbar bg-white">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 mt-10">
            <div className="bg-slate-50 p-6 rounded-full mb-4">
               <Box className="w-12 h-12 text-slate-300" />
            </div>
            <p className="font-medium">No products found.</p>
            <p className="text-sm">Try adjusting your search or category.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
               const hasVariants = product.variants && product.variants.length > 0;
               const stock = product.stock;
               const isLowStock = stock <= (product.minStock || 0);

               return (
                <div 
                  key={product.id} 
                  onClick={() => onProductSelect(product)} 
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:border-slate-200 transition-all cursor-pointer flex flex-col group relative h-full"
                >
                  <div className="h-40 bg-slate-50 relative flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <Box className="w-12 h-12 text-slate-200" />
                    )}
                    
                    <span className={`absolute top-3 right-3 px-2 py-1 rounded-md text-[10px] font-bold shadow-sm backdrop-blur-md ${isLowStock ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-800'}`}>
                      {stock} {product.unit}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <div className="mb-2">
                        <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">
                           {product.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">{product.sku}</p>
                    </div>
                    
                    <div className="mt-auto pt-2">
                      {hasVariants ? (
                        <div className="flex items-center justify-between">
                           <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              {product.variants!.length} Variants
                           </div>
                           <Plus className="w-5 h-5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                           <div className="bg-slate-900 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
                              {formatPrice(product.price)}
                           </div>
                           <Plus className="w-5 h-5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
               );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase sticky top-0 z-10">
                   <tr>
                      <th className="p-4 w-16 pl-6">Img</th>
                      <th className="p-4">Item Details</th>
                      <th className="p-4 text-right">Price</th>
                      <th className="p-4 text-center">Stock</th>
                      <th className="p-4 text-right w-32 pr-6">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                   {filteredProducts.map(product => {
                      return (
                         <tr 
                            key={product.id} 
                            className="hover:bg-slate-50 transition-colors cursor-pointer group"
                            onClick={() => onProductSelect(product)}
                         >
                            <td className="p-3 pl-6">
                               <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                  {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover"/> : <Box className="w-5 h-5 text-slate-300"/>}
                               </div>
                            </td>
                            <td className="p-3">
                               <div className="font-bold text-slate-800">{product.name}</div>
                               <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-slate-400 font-mono">{product.sku}</span>
                               </div>
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900 text-base">
                               {product.variants && product.variants.length > 0 ? 'Multiple' : formatPrice(product.price)}
                            </td>
                            <td className="p-3 text-center">
                               <span className={`text-xs font-bold px-2 py-1 rounded-full ${product.stock > (product.minStock||0) ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-700'}`}>
                                  {product.stock} {product.unit}
                               </span>
                            </td>
                            <td className="p-3 text-right pr-6">
                               <button className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                  <Plus className="w-5 h-5" />
                                </button>
                            </td>
                         </tr>
                      );
                   })}
                </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
};
