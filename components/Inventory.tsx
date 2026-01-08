
import React, { useState, useRef } from 'react';
import { Product, UnitDefinition, CategoryItem, Warehouse, Sale } from '../types';
import { Search, Plus, Sparkles, Download, Upload, ScanBarcode, LayoutGrid, List } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { BarcodeScanner } from './BarcodeScanner';
import { useInventoryStore } from '../store/useInventoryStore';

// Sub-components
import { InventoryList } from './inventory/InventoryList';
import { ProductFormModal } from './inventory/ProductFormModal';
import { ImportModal } from './inventory/ImportModal';
import { InventoryAiModal } from './inventory/InventoryAiModal';
import { LabelPrintModal } from './inventory/LabelPrintModal';

interface InventoryProps {
  products: Product[];
  units: UnitDefinition[];
  categories: CategoryItem[];
  warehouses?: Warehouse[];
  sales: Sale[];
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddProduct: (product: Product) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ sales }) => {
  const { settings, t, formatPrice, customerLevels, branches } = useGlobal(); // Access branches here
  
  // Store Access
  const products = useInventoryStore((state) => state.products);
  const units = useInventoryStore((state) => state.units);
  const categories = useInventoryStore((state) => state.categories);
  const attributes = useInventoryStore((state) => state.attributes);
  const addProduct = useInventoryStore((state) => state.addProduct);
  const updateProduct = useInventoryStore((state) => state.updateProduct);
  const deleteProduct = useInventoryStore((state) => state.deleteProduct);

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  
  const [labelProduct, setLabelProduct] = useState<Product | null>(null);

  // --- Filtering ---
  const getCategoryName = (idOrName: string) => {
    const cat = categories.find(c => c.id === idOrName);
    return cat ? cat.name : idOrName; 
  };

  const filteredProducts = products.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(searchLower) || 
      p.sku?.toLowerCase().includes(searchLower) || 
      p.barcode?.includes(searchLower);
    
    const pCatName = getCategoryName(p.category);
    const filterCatName = filterCategory === 'all' ? 'all' : getCategoryName(filterCategory);
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory || pCatName === filterCatName;
    
    return matchesSearch && matchesCategory;
  });

  // --- Handlers ---
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(undefined);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (product: Product) => {
    if (editingProduct) updateProduct(product);
    else addProduct(product);
  };

  const handleImport = (importedProducts: Partial<Product>[], action: 'Create' | 'Update') => {
    importedProducts.forEach(p => {
       const newProduct = {
          ...p,
          id: p.id || `P-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          category: p.category || categories[0]?.id || 'Uncategorized',
          unit: p.unit || 'pc',
          warehouseInventory: [{ warehouseId: 'wh1', quantity: p.stock || 0 }]
       } as Product;
       
       if (action === 'Update') updateProduct(newProduct);
       else addProduct(newProduct);
    });
  };

  const handleScan = (code: string) => {
    setSearchTerm(code);
    setIsScannerOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Category', 'Price', 'Stock', 'SKU'];
    const csvContent = [
      headers.join(','),
      ...filteredProducts.map(p => [p.id, `"${p.name}"`, getCategoryName(p.category), p.price, p.stock, p.sku].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_export.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative pb-20 md:pb-0">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('inventory.title')}</h2>
          <p className="text-slate-500">{t('inventory.subtitle')}</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          <button onClick={handleExportCSV} className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-sm shadow-sm whitespace-nowrap transition-colors">
            <Download className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Export</span>
          </button>
          <button onClick={() => setIsImportOpen(true)} className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-sm shadow-sm whitespace-nowrap transition-colors">
            <Upload className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Import</span>
          </button>
          <button onClick={() => setIsAiOpen(true)} className="flex items-center px-4 py-2 bg-violet-50 text-violet-700 border border-violet-100 rounded-xl hover:bg-violet-100 font-bold text-sm transition-colors whitespace-nowrap">
            <Sparkles className="w-4 h-4 mr-2" /> {t('inventory.aiInsights')}
          </button>
          <button onClick={handleAdd} className="hidden md:flex items-center px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold text-sm shadow-md whitespace-nowrap transition-colors">
            <Plus className="w-4 h-4 mr-2" /> {t('inventory.addProduct')}
          </button>
        </div>
      </div>

      {/* Search & Filter - Style A */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 flex gap-2">
          <div className="relative flex-1">
             <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
             <input
               type="text"
               placeholder={t('inventory.searchPlaceholder')}
               className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all font-medium"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <button onClick={() => setIsScannerOpen(true)} className="px-4 py-2 bg-slate-100 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors">
             <ScanBarcode className="w-6 h-6" />
          </button>
        </div>
        <div className="flex gap-2">
          <div className="relative">
             <select 
               value={filterCategory} 
               onChange={(e) => setFilterCategory(e.target.value)} 
               className="appearance-none w-full md:w-48 pl-4 pr-10 py-3 bg-slate-100 border-none rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 cursor-pointer"
             >
               <option value="all">{t('inventory.allCategories')}</option>
               {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
             </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
               <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
             </div>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl">
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
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col relative">
        <InventoryList 
          products={filteredProducts} 
          categories={categories} 
          formatPrice={formatPrice} 
          viewMode={viewMode}
          onEdit={handleEdit} 
          onDelete={deleteProduct} 
          onPrintLabel={(p) => setLabelProduct(p)} 
        />
      </div>

      {/* Mobile FAB */}
      <button onClick={handleAdd} className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center z-40 hover:bg-slate-800 active:scale-95 transition-all">
          <Plus className="w-8 h-8" />
      </button>

      {/* Modals */}
      <BarcodeScanner isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={handleScan} />
      
      <ProductFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSubmit={handleFormSubmit} 
        initialData={editingProduct} 
        categories={categories} 
        units={units}
        attributes={attributes}
        currencySymbol={settings.currencySymbol}
        customerLevels={customerLevels || []} 
        branches={branches}
      />

      <ImportModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImport={handleImport}
        currencySymbol={settings.currencySymbol}
        formatPrice={formatPrice}
      />

      <InventoryAiModal 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
        products={products} 
        sales={sales} 
        formatPrice={formatPrice} 
      />

      {labelProduct && (
        <LabelPrintModal 
          isOpen={!!labelProduct} 
          onClose={() => setLabelProduct(null)} 
          product={labelProduct} 
          formatPrice={formatPrice} 
        />
      )}
    </div>
  );
};
