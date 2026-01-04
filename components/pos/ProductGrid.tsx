
import React, { useState, useMemo } from 'react';
import { Product, Category } from '../../types';
import { Search, Box, ScanBarcode, LayoutGrid, List, Plus } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';

interface ProductGridProps {
  products: Product[];
  onScanClick: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onScan: (code: string) => void; 
  onProductSelect: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ 
  products, onScanClick, searchTerm, setSearchTerm, onScan, onProductSelect
}) => {
  const { formatPrice } = useGlobal();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const searchLower = searchTerm.toLowerCase();
      const matchesMain = p.name.toLowerCase().includes(searchLower) || p.sku?.toLowerCase().includes(searchLower) || p.barcode?.includes(searchLower);
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesMain && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  return (
    <div className="flex flex-col h-full bg-white animate-fade-in">
      <div className="p-4 space-y-4 border-b border-slate-100">
        <div className="flex gap-2">
          <div className="relative flex-1 group">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-construction-orange transition-colors w-5 h-5" />
             <input
               type="text"
               placeholder="Find materials..."
               className="w-full pl-10 pr-4 py-3 bg-slate-100 border-2 border-transparent rounded-xl focus:border-construction-orange focus:bg-white outline-none font-bold text-slate-800 transition-all placeholder:text-slate-400 text-sm md:text-base"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <button onClick={onScanClick} className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all shrink-0">
             <ScanBarcode className="w-6 h-6" />
          </button>
          <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl shrink-0">
             <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}><LayoutGrid className="w-5 h-5"/></button>
             <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}><List className="w-5 h-5"/></button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <button 
            onClick={() => setSelectedCategory('all')} 
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${selectedCategory === 'all' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}
          >
            All Items
          </button>
          {Object.values(Category).map(cat => (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat)} 
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${selectedCategory === cat ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 custom-scrollbar bg-slate-50/50">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 pb-20">
            {filteredProducts.map((product) => (
              <div key={product.id} onClick={() => onProductSelect(product)} className="bg-white rounded-2xl border border-slate-100 p-3 md:p-4 hover:border-construction-orange hover:shadow-lg transition-all cursor-pointer group flex flex-col active:scale-95">
                <div className="aspect-square bg-slate-50 rounded-xl mb-3 overflow-hidden flex items-center justify-center relative">
                   {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/> : <Box className="w-8 h-8 text-slate-300"/>}
                   <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest shadow-sm ${product.stock <= (product.minStock||10) ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-800'}`}>
                      {product.stock} {product.unit}
                   </div>
                </div>
                <h4 className="font-bold text-slate-800 text-xs md:text-sm uppercase tracking-tight line-clamp-2 mb-2 leading-snug min-h-[2.5em]">{product.name}</h4>
                <div className="mt-auto pt-2 flex items-center justify-between border-t border-slate-50">
                   <div className="font-black text-slate-900 text-sm md:text-base">{formatPrice(product.price)}</div>
                   <div className="w-7 h-7 md:w-8 md:h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center group-hover:bg-construction-orange transition-colors shadow-sm">
                      <Plus className="w-4 h-4"/>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
           <div className="space-y-2 pb-20">
              {filteredProducts.map(p => (
                 <div key={p.id} onClick={() => onProductSelect(p)} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl hover:border-construction-orange hover:shadow-sm transition-all cursor-pointer active:bg-slate-50">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center shrink-0 border border-slate-100">
                       {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover"/> : <Box className="w-5 h-5 text-slate-300"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="font-bold text-slate-800 text-sm uppercase tracking-tight truncate">{p.name}</h4>
                       <div className="flex items-center text-[10px] text-slate-500 font-medium mt-0.5">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded mr-2">{p.sku}</span>
                          <span>Stock: {p.stock} {p.unit}</span>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="font-black text-slate-900 text-sm">{formatPrice(p.price)}</p>
                       <span className="text-[10px] text-construction-orange font-bold uppercase tracking-wider">Add</span>
                    </div>
                 </div>
              ))}
           </div>
        )}
        
        {filteredProducts.length === 0 && (
           <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Box className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-sm">No items found</p>
           </div>
        )}
      </div>
    </div>
  );
};
