
import React, { useState, useEffect } from 'react';
import { Product, ProductVariant, UnitDefinition, CategoryItem, Warehouse, InventoryAnalysisResult, Sale, Branch } from '../types';
import { Search, Plus, Edit2, Trash2, X, Check, Layers, Box, ArrowRight, ArrowLeftRight, RefreshCw, Info, Building2, AlertTriangle, Bell, Sparkles, Loader2, TrendingUp, AlertCircle, PackagePlus, Scale, DollarSign, Store, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { analyzeInventory } from '../services/geminiService';
import { useGlobal } from '../context/GlobalContext';

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

export const Inventory: React.FC<InventoryProps> = ({ products, units, categories, warehouses = [], sales, onUpdateProduct, onDeleteProduct, onAddProduct }) => {
  const { branches, settings, t } = useGlobal();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = settings.defaultItemsPerPage || 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'physical' | 'pricing' | 'variants'>('general');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<InventoryAnalysisResult | null>(null);
  const [activeAiTab, setActiveAiTab] = useState<'reorder' | 'new' | 'bundles'>('reorder');
  
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    price: 0,
    stock: 0,
    minStock: 20,
    unit: '',
    physical: { weight: 0, width: 0, height: 0, depth: 0 },
    branchPrices: []
  });
  
  const [variants, setVariants] = useState<Partial<ProductVariant>[]>([]);

  const getFlattenedCategories = () => {
    const options: { id: string; name: string; level: number }[] = [];
    const buildOptions = (parentId: string | null, level: number) => {
      const children = categories.filter(c => c.parentId === parentId);
      children.forEach(c => {
        options.push({ id: c.id, name: c.name, level });
        buildOptions(c.id, level + 1);
      });
    };
    buildOptions(null, 0);
    return options;
  };

  const categoryOptions = getFlattenedCategories();

  const getCategoryName = (idOrName: string) => {
    const cat = categories.find(c => c.id === idOrName);
    return cat ? cat.name : idOrName; 
  };

  const filteredProducts = products.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(searchLower) || 
      p.sku?.toLowerCase().includes(searchLower) || 
      p.barcode?.includes(searchLower) ||
      (p.variants && p.variants.some(v => 
        v.code.toLowerCase().includes(searchLower) || 
        v.barcode.includes(searchLower)
      ));
    
    const pCatName = getCategoryName(p.category);
    const filterCatName = filterCategory === 'all' ? 'all' : getCategoryName(filterCategory);
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory || pCatName === filterCatName;
    
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const unitsByCategory = units.reduce((acc, unit) => {
    if (!acc[unit.category]) acc[unit.category] = [];
    acc[unit.category].push(unit);
    return acc;
  }, {} as Record<string, UnitDefinition[]>);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setActiveTab('general');
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      category: categoryOptions[0]?.id || '',
      price: 0,
      stock: 0,
      minStock: 20,
      unit: units[0]?.symbol || 'pc',
      physical: { weight: 0, width: 0, height: 0, depth: 0 },
      branchPrices: []
    });
    setVariants([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingId(product.id);
    setActiveTab('general');
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      category: product.category,
      price: product.price,
      stock: product.stock,
      minStock: product.minStock || 20,
      unit: product.unit,
      physical: product.physical || { weight: 0, width: 0, height: 0, depth: 0 },
      branchPrices: product.branchPrices || []
    });
    setVariants(product.variants ? product.variants.map(v => ({...v})) : []);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isAiModalOpen && !aiResult && !aiLoading) {
      const performAnalysis = async () => {
        setAiLoading(true);
        const result = await analyzeInventory(products, sales);
        setAiResult(result);
        setAiLoading(false);
      };
      performAnalysis();
    }
  }, [isAiModalOpen, products, sales, aiResult, aiLoading]);

  const handleOpenAiInsights = () => setIsAiModalOpen(true);

  const handleAddSuggestedProduct = (suggestion: any) => {
    setIsAiModalOpen(false);
    setEditingId(null);
    setActiveTab('general');
    
    const matchedCat = categories.find(c => c.name.toLowerCase().includes(suggestion.categoryName?.toLowerCase() || ''))?.id || '';
    const unitSearch = suggestion.suggestedUnit?.toLowerCase();
    let matchedUnit = units.find(u => u.symbol.toLowerCase() === unitSearch || u.name.toLowerCase() === unitSearch)?.symbol;
    if (!matchedUnit && unitSearch === 'set') matchedUnit = 'set'; 
    if (!matchedUnit) matchedUnit = 'pc';

    let productName = suggestion.name || suggestion.bundleName;
    if (suggestion.components && Array.isArray(suggestion.components) && suggestion.components.length > 0) {
       productName = `${productName} (Includes: ${suggestion.components.join(', ')})`;
    }

    setFormData({
      name: productName,
      sku: '',
      barcode: '',
      category: matchedCat,
      price: suggestion.estimatedPrice,
      stock: 0,
      minStock: 20,
      unit: matchedUnit,
      physical: { weight: 0, width: 0, height: 0, depth: 0 },
      branchPrices: []
    });
    setVariants([]);
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNum = ['price', 'stock', 'minStock'].includes(name);
    
    setFormData(prev => ({
      ...prev,
      [name]: isNum ? (parseFloat(value) || 0) : value
    }));

    if (name === 'price') {
      const newMainPrice = parseFloat(value) || 0;
      setVariants(prev => prev.map(v => {
         const factor = v.conversionFactor || 1;
         return { ...v, price: factor !== 0 ? newMainPrice / factor : 0 };
      }));
    }
  };

  const handlePhysicalChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      physical: {
        ...prev.physical,
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const handleBranchPriceChange = (branchId: string, priceStr: string) => {
    const price = parseFloat(priceStr);
    setFormData(prev => {
      const currentPrices = prev.branchPrices ? [...prev.branchPrices] : [];
      const index = currentPrices.findIndex(bp => bp.branchId === branchId);
      
      if (index > -1) {
        if (!priceStr) {
           currentPrices.splice(index, 1);
        } else {
           currentPrices[index].price = price;
        }
      } else if (priceStr) {
        currentPrices.push({ branchId, price });
      }
      return { ...prev, branchPrices: currentPrices };
    });
  };

  const generateVariantCodes = (index: number) => {
    const suffix = (index + 1).toString().padStart(3, '0');
    const skuBase = formData.sku || 'SKU';
    return { code: `${skuBase}-${suffix}`, barcode: formData.barcode ? `${formData.barcode}${suffix}` : '' };
  };

  const handleAddVariant = () => {
    const { code, barcode } = generateVariantCodes(variants.length);
    setVariants(prev => [...prev, {
      id: `v-${Date.now()}`,
      name: '', 
      code,
      barcode,
      conversionFactor: 1, 
      price: formData.price
    }]);
  };

  const handleRemoveVariant = (index: number) => setVariants(prev => prev.filter((_, i) => i !== index));

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: any) => {
    setVariants(prev => {
      const newVariants = [...prev];
      let updatedVariant = { ...newVariants[index], [field]: value };
      
      if (field === 'name') {
        const mainUnitDef = units.find(u => u.symbol === formData.unit);
        const variantUnitDef = units.find(u => u.symbol === value);
        if (mainUnitDef && variantUnitDef && mainUnitDef.category === variantUnitDef.category) {
          const factor = mainUnitDef.baseFactor / variantUnitDef.baseFactor;
          updatedVariant.conversionFactor = factor;
          updatedVariant.price = (formData.price || 0) / factor;
        }
      }
      if (field === 'price' || field === 'conversionFactor') {
        updatedVariant[field] = parseFloat(value) || 0;
      }
      newVariants[index] = updatedVariant;
      return newVariants;
    });
  };

  const handleVariantRelationChange = (index: number, ratio: number, mode: 'sub' | 'bundle') => {
    const factor = mode === 'sub' ? ratio : (1 / ratio);
    setVariants(prev => {
      const newVariants = [...prev];
      newVariants[index] = { 
        ...newVariants[index], 
        conversionFactor: factor,
        price: factor !== 0 ? ((formData.price || 0) / factor) : 0
      };
      return newVariants;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.unit) {
      const productData: Product = {
        id: editingId || `P-${Date.now()}`,
        name: formData.name!,
        category: formData.category || 'Uncategorized',
        price: formData.price || 0,
        stock: formData.stock || 0,
        minStock: formData.minStock || 20,
        unit: formData.unit!,
        sku: formData.sku || '',
        barcode: formData.barcode || '',
        physical: formData.physical,
        branchPrices: formData.branchPrices,
        variants: variants.length > 0 ? variants as ProductVariant[] : undefined,
        warehouseInventory: editingId 
          ? products.find(p => p.id === editingId)?.warehouseInventory 
          : [{ warehouseId: 'wh1', quantity: formData.stock || 0 }]
      };
      
      if (editingId) onUpdateProduct(productData);
      else onAddProduct(productData);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('inventory.title')}</h2>
          <p className="text-slate-500">{t('inventory.subtitle')}</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleOpenAiInsights}
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium shadow-sm"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {t('inventory.aiInsights')}
          </button>
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center justify-center px-4 py-2 bg-construction-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('inventory.addProduct')}
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('inventory.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700 bg-white"
        >
          <option value="all">{t('inventory.allCategories')}</option>
          {categoryOptions.map(cat => (
             <option key={cat.id} value={cat.id}>
                {'\u00A0'.repeat(cat.level * 3)}{cat.name}
             </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('inventory.productName')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('inventory.sku')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('inventory.category')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">{t('inventory.price')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">{t('inventory.stock')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.map((product) => {
                const isLowStock = product.stock < (product.minStock || 20);
                return (
                  <tr key={product.id} className={`hover:bg-slate-50 transition-colors group ${isLowStock ? 'bg-red-50 border-l-4 border-red-500' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{product.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">ID: {product.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="mb-2">
                         <div className="flex items-center text-xs">
                           <span className="w-10 text-slate-400 font-semibold uppercase">{product.unit}</span>
                           <span className="font-mono bg-slate-100 px-1.5 rounded text-slate-600 mr-2">{product.sku}</span>
                           <span className="font-mono text-slate-500">{product.barcode}</span>
                         </div>
                      </div>
                      {product.variants?.map((v) => (
                        <div key={v.id} className="flex items-center text-xs pl-2 border-l-2 border-construction-orange/30 mb-1">
                           <span className="w-12 text-construction-orange font-semibold uppercase truncate" title={v.name}>{v.name}</span>
                           <span className="font-mono bg-orange-50 px-1.5 rounded text-orange-700 mr-2">{v.code}</span>
                           <span className="font-mono text-orange-600">{v.barcode}</span>
                         </div>
                      ))}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                        {getCategoryName(product.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                       <div className="text-sm">${product.price.toFixed(2)} <span className="text-slate-400 text-xs">/{product.unit}</span></div>
                       {product.branchPrices && product.branchPrices.length > 0 && (
                         <div className="text-[10px] text-blue-600 mt-1 flex items-center justify-end">
                           <Store className="w-3 h-3 mr-1" />
                           Multi-price
                         </div>
                       )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <div className={`font-bold flex items-center justify-end ${isLowStock ? 'text-red-600' : 'text-slate-700'}`}>
                          {isLowStock && (
                            <div className="flex items-center mr-2 bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide shadow-sm">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Low
                            </div>
                          )}
                          {product.stock} <span className="text-xs font-normal text-slate-500 ml-1">{product.unit}s</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Min: {product.minStock || 20}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenEditModal(product)}
                          className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No products found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredProducts.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredProducts.length)}</span> of <span className="font-medium">{filteredProducts.length}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                     p = currentPage - 2 + i;
                  }
                  if (p > totalPages) return null;
                  
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === p 
                          ? 'bg-construction-orange text-white' 
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">AI Inventory Intelligence</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Powered by Gemini AI Analysis</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 relative">
              {aiLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                    <Loader2 className="w-16 h-16 text-purple-600 animate-spin relative z-10" />
                  </div>
                  <h4 className="mt-6 text-lg font-semibold text-slate-700">Analyzing Sales & Stock Patterns...</h4>
                  <p className="text-slate-500 text-sm mt-2 max-w-md text-center">
                    Reviewing inventory levels, sales velocity, and historical trends to generate actionable insights.
                  </p>
                </div>
              ) : !aiResult ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-slate-500">Analysis could not be generated. Please try again later.</p>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex border-b border-slate-200 bg-white shrink-0">
                    <button
                      onClick={() => setActiveAiTab('reorder')}
                      className={`flex-1 py-4 text-sm font-medium flex items-center justify-center transition-all ${
                        activeAiTab === 'reorder' 
                          ? 'border-b-2 border-red-500 text-red-600 bg-red-50/50' 
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Restock Alerts ({aiResult.reorders.length})
                    </button>
                    <button
                      onClick={() => setActiveAiTab('new')}
                      className={`flex-1 py-4 text-sm font-medium flex items-center justify-center transition-all ${
                        activeAiTab === 'new' 
                          ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50/50' 
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      New Product Ideas ({aiResult.newProducts.length})
                    </button>
                    <button
                      onClick={() => setActiveAiTab('bundles')}
                      className={`flex-1 py-4 text-sm font-medium flex items-center justify-center transition-all ${
                        activeAiTab === 'bundles' 
                          ? 'border-b-2 border-purple-500 text-purple-600 bg-purple-50/50' 
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Layers className="w-4 h-4 mr-2" />
                      Smart Bundles ({aiResult.bundles.length})
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                    
                    {activeAiTab === 'reorder' && (
                      <div className="space-y-4 animate-fade-in">
                        {aiResult.reorders.length === 0 ? (
                          <div className="text-center py-10 text-slate-500 bg-white rounded-xl border border-slate-200">
                            <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
                            <p className="font-medium">Inventory looks healthy!</p>
                            <p className="text-sm text-slate-400">No critical stock shortages detected.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {aiResult.reorders.map((item, idx) => (
                              <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start space-x-3">
                                  <div className={`p-2 rounded-lg mt-1 ${item.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                    <AlertTriangle className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center">
                                      <h4 className="font-bold text-slate-800">{item.productName}</h4>
                                      <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                                        item.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                      }`}>
                                        {item.priority} Priority
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">{item.reasoning}</p>
                                    <div className="flex items-center mt-2 text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded w-fit">
                                      <span>Current: {item.currentStock}</span>
                                      <ArrowRight className="w-3 h-3 mx-2 text-slate-400" />
                                      <span className="font-bold text-slate-800">Suggested Order: +{item.suggestedReorderQty}</span>
                                    </div>
                                  </div>
                                </div>
                                <button className="shrink-0 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors">
                                  Create PO
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeAiTab === 'new' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        {aiResult.newProducts.map((item, idx) => (
                          <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                            <div className="flex items-start justify-between mb-2">
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <PackagePlus className="w-5 h-5" />
                              </div>
                              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium">
                                {item.categoryName}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-lg mb-1">{item.name}</h4>
                            <p className="text-sm text-slate-500 mb-4 flex-1">{item.reasoning}</p>
                            
                            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                              <div className="text-sm font-bold text-slate-700">
                                Est. ${item.estimatedPrice} <span className="text-xs font-normal text-slate-400">/ {item.suggestedUnit}</span>
                              </div>
                              <button 
                                onClick={() => handleAddSuggestedProduct(item)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Create Product
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeAiTab === 'bundles' && (
                      <div className="space-y-4 animate-fade-in">
                        {aiResult.bundles.map((bundle, idx) => (
                          <div key={idx} className="bg-gradient-to-br from-white to-purple-50 p-5 rounded-xl border border-purple-100 shadow-sm">
                            <div className="flex flex-col md:flex-row gap-6">
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <div className="p-1.5 bg-purple-100 text-purple-600 rounded-md mr-2">
                                    <ShoppingBag className="w-4 h-4" />
                                  </div>
                                  <h4 className="font-bold text-purple-900 text-lg">{bundle.bundleName}</h4>
                                </div>
                                <p className="text-sm text-purple-800/70 mb-3 italic">"{bundle.reasoning}"</p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {bundle.components.map((comp, cIdx) => (
                                    <span key={cIdx} className="bg-white border border-purple-200 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                                      {comp}
                                    </span>
                                  ))}
                                </div>
                                <div className="text-xs text-slate-500">
                                  <span className="font-semibold">Target:</span> {bundle.targetAudience}
                                </div>
                              </div>
                              <div className="flex flex-col justify-center items-end border-l border-purple-200 pl-6 border-dashed">
                                <div className="text-2xl font-bold text-slate-800 mb-1">${bundle.estimatedPrice}</div>
                                <div className="text-xs text-slate-400 mb-3">Target Price</div>
                                <button 
                                  onClick={() => handleAddSuggestedProduct(bundle)}
                                  className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-sm whitespace-nowrap"
                                >
                                  Create Bundle
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-xl font-bold text-slate-800">
                {editingId ? t('common.edit') : t('common.add')} Product
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex border-b border-slate-200 bg-white">
               {[
                 { id: 'general', label: 'General Info', icon: Box },
                 { id: 'physical', label: 'Physical & Units', icon: Scale },
                 { id: 'pricing', label: 'Pricing & Branches', icon: DollarSign },
                 { id: 'variants', label: 'Variants', icon: Layers },
               ].map(tab => {
                 const Icon = tab.icon;
                 return (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                       activeTab === tab.id 
                         ? 'border-b-2 border-construction-orange text-construction-orange bg-orange-50/50' 
                         : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                     }`}
                   >
                     <Icon className="w-4 h-4 mr-2" />
                     {tab.label}
                   </button>
                 );
               })}
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {/* Tabs Content Implementation (Simplified for brevity, similar structure as before but using state) */}
              {activeTab === 'general' && (
                <div className="space-y-6 animate-fade-in">
                   <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.productName')} *</label>
                          <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.category')} *</label>
                          <select
                            name="category"
                            required
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                          >
                             <option value="">Select</option>
                             {categoryOptions.map(cat => (
                               <option key={cat.id} value={cat.id}>
                                  {'\u00A0'.repeat(cat.level * 3)}{cat.name}
                               </option>
                             ))}
                          </select>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.sku')}</label>
                           <input
                            type="text"
                            name="sku"
                            value={formData.sku}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono"
                          />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Barcode</label>
                           <input
                            type="text"
                            name="barcode"
                            value={formData.barcode}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono"
                          />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">{t('inventory.stock')}</label>
                           <input
                            type="number"
                            name="stock"
                            min="0"
                            value={formData.stock}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Min Stock</label>
                           <input
                            type="number"
                            name="minStock"
                            min="0"
                            value={formData.minStock}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                   </div>
                </div>
              )}

              {/* Other tabs remain largely the same, just wrapped in the form context */}
              {activeTab === 'physical' && (
                <div className="space-y-6 animate-fade-in">
                   <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-800 mb-4 flex items-center">
                         <Scale className="w-5 h-5 mr-2 text-slate-500" />
                         Unit Configuration
                      </h4>
                      <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Main Unit *</label>
                         <select
                            name="unit"
                            required
                            value={formData.unit}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                          >
                            <option value="">Select Unit</option>
                            {Object.entries(unitsByCategory).map(([cat, catUnits]) => (
                              <optgroup key={cat} label={cat}>
                                {(catUnits as UnitDefinition[]).map(u => (
                                  <option key={u.id} value={u.symbol}>
                                    {u.name} ({u.symbol})
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'pricing' && (
                <div className="space-y-6 animate-fade-in">
                   <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <div className="mb-6">
                         <label className="block text-sm font-bold text-slate-800 mb-2">{t('inventory.price')}</label>
                         <div className="relative max-w-xs">
                            <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                            <input
                              type="number"
                              name="price"
                              required
                              min="0"
                              step="0.01"
                              value={formData.price}
                              onChange={handleInputChange}
                              className="w-full pl-8 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-lg font-bold text-slate-800"
                            />
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'variants' && (
                <div className="space-y-6 animate-fade-in">
                   <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-800">Product Variants</h4>
                        <button 
                          type="button" 
                          onClick={handleAddVariant}
                          className="text-sm flex items-center text-primary-600 font-medium hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4 mr-1" /> {t('common.add')} Variant
                        </button>
                      </div>
                      
                      {variants.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
                          No variants added.
                        </div>
                      ) : (
                        <div className="space-y-4">
                           {variants.map((variant, index) => {
                              const factor = variant.conversionFactor || 1;
                              const isBundle = factor > 0 && factor < 1;
                              const displayRatio = isBundle ? Math.round(1/factor) : factor;

                              return (
                                <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group">
                                   <button 
                                      type="button"
                                      onClick={() => handleRemoveVariant(index)}
                                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                       <div>
                                          <label className="block text-xs font-medium text-slate-500 mb-1">Variant Unit</label>
                                          <select
                                            value={variant.name}
                                            onChange={e => handleVariantChange(index, 'name', e.target.value)}
                                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm bg-white"
                                          >
                                            <option value="">Select</option>
                                            {Object.entries(unitsByCategory).map(([cat, catUnits]) => (
                                              <optgroup key={cat} label={cat}>
                                                {(catUnits as UnitDefinition[]).map(u => (
                                                  <option key={u.id} value={u.symbol}>{u.name} ({u.symbol})</option>
                                                ))}
                                              </optgroup>
                                            ))}
                                          </select>
                                       </div>
                                       <div>
                                          <label className="block text-xs font-medium text-slate-500 mb-1">Price</label>
                                          <input
                                            type="number"
                                            value={variant.price}
                                            onChange={e => {
                                               const newVars = [...variants];
                                               newVars[index].price = parseFloat(e.target.value) || 0;
                                               setVariants(newVars);
                                            }}
                                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm"
                                          />
                                       </div>
                                    </div>
                                    <div className="bg-white p-3 rounded border border-slate-200 flex items-center text-sm">
                                       <span className="text-slate-500 mr-2">Ratio:</span>
                                       <select
                                          value={isBundle ? 'bundle' : 'sub'}
                                          onChange={(e) => handleVariantRelationChange(index, displayRatio, e.target.value as 'bundle' | 'sub')}
                                          className="px-2 py-1 text-xs border rounded bg-slate-50 mr-2"
                                        >
                                          <option value="sub">Sub-unit</option>
                                          <option value="bundle">Bundle</option>
                                        </select>
                                        <input 
                                          type="number" 
                                          min="1"
                                          value={displayRatio}
                                          onChange={(e) => handleVariantRelationChange(index, parseFloat(e.target.value) || 1, isBundle ? 'bundle' : 'sub')}
                                          className="w-16 px-1 py-0.5 border rounded text-center font-bold mx-1"
                                        />
                                    </div>
                                </div>
                              );
                           })}
                        </div>
                      )}
                   </div>
                </div>
              )}

            </form>

            <div className="p-4 border-t border-slate-100 flex justify-end items-center bg-white shrink-0 space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-5 py-2 bg-construction-orange text-white font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-sm flex items-center"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {t('common.save')}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
