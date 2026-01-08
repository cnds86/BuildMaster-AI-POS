
import React, { useState, useMemo } from 'react';
import { Product, Category } from '../../types';
import { Search, Box, ScanBarcode, LayoutGrid, List, Plus, Layers, Package } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';

interface ProductGridProps {
  products: (Product & { displayPrice?: number })[]; 
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const searchLower = searchTerm.toLowerCase();
      const matchesMain = 
        p.name.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower) ||
        p.barcode?.includes(searchLower);
      
      // Search inside variants too
      const matchesVariant = p.variants && p.variants.some(v => 
        v.code.toLowerCase().includes(searchLower) || 
        v.barcode.includes(searchLower) ||
        v.name.toLowerCase().includes(searchLower)
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
      {/* Search & Filter Bar */}
      <div className="px-4 md:px-6 pb-4 pt-2 space-y-3 bg-white z-10">
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleFormSubmit} className="relative flex-1 flex gap-2">
            <div className="relative flex-1 group">
               <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-slate-800 transition-colors" />
               <input
                 id="pos-search-input"
                 type="text"
                 placeholder={t('pos.scanPlaceholder')}
                 className="w-full pl-12 pr-4 py-3 border-none rounded-xl bg-slate-100 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all text-sm md:text-base"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 autoFocus
               />
            </div>
            <button type="button" onClick={onScanClick} className="bg-slate-100 text-slate-600 px-3 md:px-4 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center">
               <ScanBarcode className="w-6 h-6" />
            </button>
          </form>

          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 items-center self-end md:self-auto h-[48px] md:h-[52px]">
             <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all flex-1 md:flex-none flex justify-center ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
                <List className="w-5 h-5" />
             </button>
             <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all flex-1 md:flex-none flex justify-center ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
                <LayoutGrid className="w-5 h-5" />
             </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <button onClick={() => setSelectedCategory('all')} className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}>
            {t('pos.allItems')}
          </button>
          {Object.values(Category).map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-24 md:pb-6 custom-scrollbar bg-white">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 mt-10">
            <div className="bg-slate-50 p-6 rounded-full mb-4">
               <Box className="w-12 h-12 text-slate-300" />
            </div>
            <p className="font-medium">No products found.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {filteredProducts.map((product) => {
               // Logic to detect if product has options (Variants OR Units)
               const hasVariants = product.variants && product.variants.length > 0;
               const stock = product.stock;
               const isLowStock = stock <= (product.minStock || 0);

               // Price Logic: If has variants, show Lowest Price
               let displayPrice = product.displayPrice !== undefined ? product.displayPrice : product.price;
               if (hasVariants && product.displayPrice === undefined) {
                  const prices = product.variants!.map(v => v.price);
                  displayPrice = Math.min(...prices, product.price);
               }
               
               // Check if pricing is overridden by Customer Level (Tier Price)
               const isTierPrice = product.displayPrice !== undefined && product.displayPrice !== product.price;

               return (
                <div 
                  key={product.id} 
                  onClick={() => onProductSelect(product)} 
                  className="bg-white rounded-xl md:rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:border-slate-200 transition-all cursor-pointer flex flex-col group relative h-full shadow-sm"
                >
                  <div className="h-32 md:h-40 bg-slate-50 relative flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <Box className="w-10 h-10 md:w-12 md:h-12 text-slate-200" />
                    )}
                    
                    <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-bold shadow-sm backdrop-blur-md ${isLowStock ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-800'}`}>
                      {stock} {product.unit}
                    </span>
                  </div>

                  <div className="p-3 md:p-4 flex-1 flex flex-col">
                    <div className="mb-2">
                        <h3 className="font-bold text-slate-900 text-xs md:text-sm leading-tight line-clamp-2 min-h-[2.5em]">
                           {product.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono hidden md:block">{product.sku}</p>
                    </div>
                    
                    <div className="mt-auto pt-2">
                      <div className="flex items-center justify-between">
                         <div className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold shadow-sm flex items-center ${isTierPrice ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : hasVariants ? 'bg-slate-100 text-slate-700' : 'bg-slate-900 text-white'}`}>
                            {hasVariants && !isTierPrice && <span className="text-[9px] mr-1 text-slate-500 font-normal">From</span>}
                            {formatPrice(displayPrice)}
                         </div>
                         {hasVariants ? (
                            <Layers className="w-4 h-4 md:w-5 md:h-5 text-blue-500 group-hover:text-blue-700 transition-colors" />
                         ) : (
                            <Plus className="w-4 h-4 md:w-5 md:h-5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                         )}
                      </div>
                      {hasVariants && <p className="text-[10px] text-blue-600 mt-1 text-right font-medium">{product.variants!.length} Options</p>}
                    </div>
                  </div>
                </div>
               );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
             {/* List view implementation... (similar logic) */}
             <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-slate-100 text-sm">
                   {filteredProducts.map(product => {
                      const hasVariants = product.variants && product.variants.length > 0;
                      let displayPrice = product.displayPrice !== undefined ? product.displayPrice : product.price;
                      if (hasVariants && product.displayPrice === undefined) {
                          const prices = product.variants!.map(v => v.price);
                          displayPrice = Math.min(...prices, product.price);
                      }
                      
                      return (
                         <tr key={product.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onProductSelect(product)}>
                            <td className="p-3 pl-4 flex items-center">
                               <div className="w-10 h-10 rounded-lg bg-slate-100 mr-3 flex items-center justify-center">
                                  {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover rounded-lg"/> : <Box className="w-5 h-5 text-slate-300"/>}
                               </div>
                               <div>
                                  <div className="font-bold text-slate-800">{product.name}</div>
                                  <div className="text-[10px] text-slate-400">{product.sku}</div>
                               </div>
                            </td>
                            <td className="p-3 text-right">
                               <div className="font-bold text-slate-900">
                                  {hasVariants && <span className="text-[10px] font-normal text-slate-500 mr-1">From</span>}
                                  {formatPrice(displayPrice)}
                               </div>
                               {hasVariants && <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded">Has Options</span>}
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
