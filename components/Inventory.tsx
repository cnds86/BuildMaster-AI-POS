
import React, { useState, useEffect } from 'react';
import { Product, Category, ProductVariant, UnitDefinition, CategoryItem, Warehouse } from '../types';
import { Search, Plus, Edit2, Trash2, X, Check, Layers, Box, ArrowRight, ArrowLeftRight, RefreshCw, Info, Building2, AlertTriangle, Bell } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  units: UnitDefinition[];
  categories: CategoryItem[];
  warehouses?: Warehouse[];
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddProduct: (product: Product) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ products, units, categories, warehouses = [], onUpdateProduct, onDeleteProduct, onAddProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Add/Edit Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    price: 0,
    stock: 0,
    minStock: 20,
    unit: ''
  });
  
  // Variants State
  const [variants, setVariants] = useState<Partial<ProductVariant>[]>([]);

  // Helpers for Categories
  // 1. Flatten tree for select dropdown with indentation
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

  // 2. Get display name for a category ID (or return value if not found)
  const getCategoryName = (idOrName: string) => {
    const cat = categories.find(c => c.id === idOrName);
    return cat ? cat.name : idOrName; // Fallback to raw string if not an ID
  };

  const getWarehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || id;

  // Filter logic
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
    
    // Check if product category matches filter (either by ID or by Name for legacy data)
    const pCatName = getCategoryName(p.category);
    const filterCatName = filterCategory === 'all' ? 'all' : getCategoryName(filterCategory);

    // Simplistic match: if filter is 'all' OR IDs match OR Names match
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory || pCatName === filterCatName;
    
    return matchesSearch && matchesCategory;
  });

  // Group units by category for the dropdown
  const unitsByCategory = units.reduce((acc, unit) => {
    if (!acc[unit.category]) acc[unit.category] = [];
    acc[unit.category].push(unit);
    return acc;
  }, {} as Record<string, UnitDefinition[]>);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      category: categoryOptions[0]?.id || '',
      price: 0,
      stock: 0,
      minStock: 20,
      unit: units[0]?.symbol || 'pc'
    });
    setVariants([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      category: product.category,
      price: product.price,
      stock: product.stock,
      minStock: product.minStock || 20,
      unit: product.unit
    });
    setVariants(product.variants ? product.variants.map(v => ({...v})) : []);
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newValue = name === 'price' || name === 'stock' || name === 'minStock' ? parseFloat(value) || 0 : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // If Main Price changes, update all variants' prices based on their factors
    if (name === 'price') {
      const newMainPrice = typeof newValue === 'number' ? newValue : 0;
      setVariants(prev => prev.map(v => {
         const factor = v.conversionFactor || 1;
         // Price = Main / Factor (because Factor = how many variants in 1 main)
         return {
          ...v,
          price: factor !== 0 ? newMainPrice / factor : 0
        };
      }));
    }
  };

  const generateVariantCodes = (index: number) => {
    const suffix = (index + 1).toString().padStart(3, '0');
    // Logic: Append suffix directly (e.g. 885001 + 001 = 885001001) or with separator if alphanumeric
    const mainSku = formData.sku || '';
    const mainBarcode = formData.barcode || '';

    // If main SKU is empty, generic placeholder
    const skuBase = mainSku ? mainSku : 'SKU';
    // SKU often has dashes, so we append -001
    const newSku = `${skuBase}-${suffix}`;

    // Barcode usually just concatenates
    const newBarcode = mainBarcode ? `${mainBarcode}${suffix}` : '';

    return { code: newSku, barcode: newBarcode };
  };

  const handleAddVariant = () => {
    const nextIndex = variants.length;
    const { code, barcode } = generateVariantCodes(nextIndex);

    setVariants(prev => [
      ...prev,
      {
        id: `v-${Date.now()}`,
        name: '', 
        code: code,
        barcode: barcode,
        conversionFactor: 1, 
        price: formData.price // Default to main price
      }
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: any) => {
    setVariants(prev => {
      const newVariants = [...prev];
      let updatedVariant = { ...newVariants[index], [field]: value };
      
      // Auto-calculate Factor & Price if Unit (name) changes
      if (field === 'name') {
        const mainUnitSymbol = formData.unit;
        const variantUnitSymbol = value;

        const mainUnitDef = units.find(u => u.symbol === mainUnitSymbol);
        const variantUnitDef = units.find(u => u.symbol === variantUnitSymbol);

        // Calculate ratio only if both units are found and in same category (or Quantity)
        if (mainUnitDef && variantUnitDef) {
          if (mainUnitDef.category === variantUnitDef.category) {
            // Factor = How many Variants fit in 1 Main Unit
            const factor = mainUnitDef.baseFactor / variantUnitDef.baseFactor;
            updatedVariant.conversionFactor = factor;
            
            // Auto Calculate Price: Price = Main / Factor
            updatedVariant.price = (formData.price || 0) / factor;
          }
        }
      }

      // Ensure number types
      if (field === 'price' || field === 'conversionFactor') {
        updatedVariant[field] = parseFloat(value) || 0;
      }

      newVariants[index] = updatedVariant;
      return newVariants;
    });
  };

  // Mode: 'sub' (Main > Variant) OR 'bundle' (Variant > Main)
  const handleVariantRelationChange = (index: number, ratio: number, mode: 'sub' | 'bundle') => {
    // If 'sub' (1 Main = X Variant), Factor = X. (e.g. 1 Box = 12 Pc. Factor = 12).
    // If 'bundle' (1 Variant = Y Main). Factor = 1/Y. (e.g. 1 Pack = 6 Bottle. Factor = 1/6).
    const factor = mode === 'sub' ? ratio : (1 / ratio);
    
    setVariants(prev => {
      const newVariants = [...prev];
      // Update factor AND price
      const calculatedPrice = factor !== 0 ? ((formData.price || 0) / factor) : 0;
      
      newVariants[index] = { 
        ...newVariants[index], 
        conversionFactor: factor,
        price: calculatedPrice
      };
      return newVariants;
    });
  };

  // Regenerate codes for a specific variant based on current Main settings
  const refreshVariantCodes = (index: number) => {
    const { code, barcode } = generateVariantCodes(index);
    setVariants(prev => {
      const newVariants = [...prev];
      newVariants[index] = { ...newVariants[index], code, barcode };
      return newVariants;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.unit) {
      const productData: Product = {
        id: editingId || `P-${Date.now()}`,
        name: formData.name,
        category: formData.category || 'Uncategorized',
        price: formData.price || 0,
        stock: formData.stock || 0,
        minStock: formData.minStock || 20,
        unit: formData.unit,
        sku: formData.sku || '',
        barcode: formData.barcode || '',
        variants: variants.length > 0 ? variants as ProductVariant[] : undefined,
        // Preserve existing warehouse inventory if editing, else default
        warehouseInventory: editingId 
          ? products.find(p => p.id === editingId)?.warehouseInventory 
          : [{ warehouseId: 'wh1', quantity: formData.stock || 0 }]
      };
      
      if (editingId) {
        onUpdateProduct(productData);
      } else {
        onAddProduct(productData);
      }
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2>
          <p className="text-slate-500">Manage stock, pricing, and product variants.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center justify-center px-4 py-2 bg-construction-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Name, SKU, Barcode, or Variant Code..."
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
          <option value="all">All Categories</option>
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
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU / Barcode</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Price</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Stock</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => {
                const isLowStock = product.stock < (product.minStock || 20);

                return (
                  <tr key={product.id} className={`hover:bg-slate-50 transition-colors group ${isLowStock ? 'bg-red-50 border-l-4 border-red-500' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{product.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">ID: {product.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      {/* Main Unit Codes */}
                      <div className="mb-2">
                         <div className="flex items-center text-xs">
                           <span className="w-10 text-slate-400 font-semibold uppercase">{product.unit}</span>
                           <span className="font-mono bg-slate-100 px-1.5 rounded text-slate-600 mr-2">{product.sku}</span>
                           <span className="font-mono text-slate-500">{product.barcode}</span>
                         </div>
                      </div>
                      {/* Variant Codes */}
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
                       {product.variants?.map((v) => (
                          <div key={v.id} className="text-xs text-slate-500 mt-1">
                            ${v.price.toFixed(2)} /{v.name}
                          </div>
                       ))}
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
                        
                        {/* Warehouse Breakdown */}
                        {product.warehouseInventory && product.warehouseInventory.length > 0 && (
                          <div className="mt-1 text-[10px] text-slate-400 flex flex-col items-end space-y-0.5">
                             {product.warehouseInventory.filter(inv => inv.quantity !== 0).map(inv => (
                               <div key={inv.warehouseId} className="flex items-center">
                                 <Building2 className="w-3 h-3 mr-1 opacity-50" />
                                 <span>{getWarehouseName(inv.warehouseId)}: <span className="font-semibold text-slate-600">{inv.quantity}</span></span>
                               </div>
                             ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Variant Ratios */}
                      {product.variants?.map((v) => {
                        const isBundle = v.conversionFactor > 0 && v.conversionFactor < 1;
                        const ratio = isBundle ? Math.round(1/v.conversionFactor) : v.conversionFactor;
                        return (
                          <div key={v.id} className="text-xs text-slate-500 mt-1 flex items-center justify-end">
                             {isBundle ? (
                                <>
                                  <span className="bg-orange-50 text-orange-700 px-1 rounded mr-1">1 {v.name}</span>
                                  <ArrowLeftRight className="w-3 h-3 mx-1 opacity-50" />
                                  <span className="bg-slate-100 px-1 rounded">{ratio} {product.unit}s</span>
                                </>
                             ) : (
                                <>
                                  <span className="bg-slate-100 px-1 rounded mr-1">1 {product.unit}</span>
                                  <ArrowRight className="w-3 h-3 mx-1 opacity-50" />
                                  <span className="bg-orange-50 text-orange-700 px-1 rounded">{ratio} {v.name}s</span>
                                </>
                             )}
                          </div>
                        )
                      })}
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
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center">
                  <Box className="w-4 h-4 mr-2" />
                  Main Product Details
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g. Portland Cement Type 1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                       <option value="">Select Category</option>
                       {categoryOptions.map(cat => (
                         <option key={cat.id} value={cat.id}>
                            {'\u00A0'.repeat(cat.level * 3)}{cat.name}
                         </option>
                       ))}
                    </select>
                  </div>
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
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Price per {units.find(u => u.symbol === formData.unit)?.name || formData.unit || 'Unit'} *
                    </label>
                    <input
                      type="number"
                      name="price"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">
                       Total Stock ({units.find(u => u.symbol === formData.unit)?.name || formData.unit || 'Units'})
                     </label>
                    <input
                      type="number"
                      name="stock"
                      min="0"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Main SKU</label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                      placeholder="e.g. 123456789"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Main Barcode</label>
                    <input
                      type="text"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                      placeholder="Scan box barcode"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                      Minimum Stock <span className="ml-2 text-xs text-slate-400 font-normal">(Alert Threshold)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="minStock"
                        min="0"
                        value={formData.minStock}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g. 20"
                      />
                      <Bell className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Variants Section */}
              <div className="border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center">
                      <Layers className="w-4 h-4 mr-2" />
                      Product Variants / Units
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">Codes are auto-generated from Main SKU/Barcode + sequence (e.g. 001). Prices auto-calculate.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddVariant}
                    className="text-sm flex items-center text-primary-600 font-medium hover:text-primary-700"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Variant
                  </button>
                </div>
                
                {variants.length === 0 ? (
                  <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 text-sm">
                    No variants added. Click "Add Variant" to add sub-units (e.g., Bottles inside a Pack) or variations.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {variants.map((variant, index) => {
                      // Logic for Smart Conversion Display
                      const factor = variant.conversionFactor || 1;
                      const isBundle = factor > 0 && factor < 1;
                      const displayRatio = isBundle ? Math.round(1/factor) : factor;
                      
                      return (
                        <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in relative group">
                          <button 
                            type="button"
                            onClick={() => handleRemoveVariant(index)}
                            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                             {/* Variant Unit Selector */}
                             <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-slate-500 mb-1">Variant Unit</label>
                              <select
                                value={variant.name}
                                onChange={e => handleVariantChange(index, 'name', e.target.value)}
                                className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-primary-500 bg-white"
                              >
                                <option value="">Select</option>
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

                            {/* Smart Conversion Relationship */}
                            <div className="md:col-span-4 bg-white p-2 rounded border border-slate-200">
                               <label className="block text-xs font-medium text-slate-400 mb-1">Relationship / Ratio</label>
                               <div className="flex items-center space-x-2">
                                  <select
                                    value={isBundle ? 'bundle' : 'sub'}
                                    onChange={(e) => handleVariantRelationChange(index, displayRatio, e.target.value as 'bundle' | 'sub')}
                                    className="px-2 py-1 text-xs border border-slate-300 rounded bg-slate-50 min-w-[100px]"
                                  >
                                    <option value="sub">Sub-unit (Smaller)</option>
                                    <option value="bundle">Bundle (Larger)</option>
                                  </select>
                                  
                                  {isBundle ? (
                                    <div className="flex items-center text-xs whitespace-nowrap">
                                      <span className="font-semibold text-orange-600">1 {variant.name || 'Var'}</span>
                                      <span className="mx-1 text-slate-400">=</span>
                                      <input 
                                        type="number" 
                                        min="1"
                                        value={displayRatio}
                                        onChange={(e) => handleVariantRelationChange(index, parseFloat(e.target.value) || 1, 'bundle')}
                                        className="w-16 px-1 py-0.5 border border-slate-300 rounded text-center mx-1 font-bold"
                                      />
                                      <span className="text-slate-600">{formData.unit || 'Main'}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center text-xs whitespace-nowrap">
                                      <span className="font-semibold text-slate-600">1 {formData.unit || 'Main'}</span>
                                      <span className="mx-1 text-slate-400">=</span>
                                      <input 
                                        type="number" 
                                        min="1"
                                        value={displayRatio}
                                        onChange={(e) => handleVariantRelationChange(index, parseFloat(e.target.value) || 1, 'sub')}
                                        className="w-16 px-1 py-0.5 border border-slate-300 rounded text-center mx-1 font-bold"
                                      />
                                      <span className="text-orange-600">{variant.name || 'Var'}</span>
                                    </div>
                                  )}
                               </div>
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center justify-between group/label">
                                Price (Auto)
                                <div className="relative group/tooltip">
                                  <Info className="w-3 h-3 text-slate-400 cursor-help" />
                                  <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
                                    Price is auto-calculated based on relationship (Main Price / Factor). You can manually override it here.
                                  </div>
                                </div>
                              </label>
                              <div className="relative">
                                <span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={variant.price}
                                  onChange={e => {
                                    // Manual Price Override - Updates only the price field without affecting conversion logic
                                    const val = parseFloat(e.target.value) || 0;
                                    setVariants(prev => {
                                      const newVars = [...prev];
                                      newVars[index] = { ...newVars[index], price: val };
                                      return newVars;
                                    });
                                  }}
                                  className="w-full pl-5 px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-primary-500 bg-orange-50/50 focus:bg-white"
                                />
                              </div>
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-slate-500 mb-1 flex justify-between">
                                SKU 
                                <button type="button" onClick={() => refreshVariantCodes(index)} title="Regenerate from Main SKU" className="text-primary-600 hover:text-primary-800">
                                  <RefreshCw className="w-3 h-3" />
                                </button>
                              </label>
                              <input
                                type="text"
                                value={variant.code}
                                onChange={e => handleVariantChange(index, 'code', e.target.value)}
                                className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm font-mono focus:ring-1 focus:ring-primary-500 bg-slate-50"
                                placeholder="MainSKU-001"
                              />
                            </div>
                            
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-slate-500 mb-1 flex justify-between">
                                Barcode
                                <button type="button" onClick={() => refreshVariantCodes(index)} title="Regenerate from Main Barcode" className="text-primary-600 hover:text-primary-800">
                                  <RefreshCw className="w-3 h-3" />
                                </button>
                              </label>
                              <input
                                type="text"
                                value={variant.barcode}
                                onChange={e => handleVariantChange(index, 'barcode', e.target.value)}
                                className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm font-mono focus:ring-1 focus:ring-primary-500 bg-slate-50"
                                placeholder="MainBar001"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-construction-orange text-white font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-sm flex items-center"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {editingId ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
