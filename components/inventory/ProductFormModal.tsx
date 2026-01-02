
import React, { useState, useRef, useEffect } from 'react';
import { Product, ProductVariant, UnitDefinition, CategoryItem } from '../../types';
import { Box, Scale, DollarSign, Layers, X, Check } from 'lucide-react';
import { GeneralTab } from './product-form/GeneralTab';
import { PhysicalTab } from './product-form/PhysicalTab';
import { PricingTab } from './product-form/PricingTab';
import { VariantsTab } from './product-form/VariantsTab';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Product) => void;
  initialData?: Product;
  categories: CategoryItem[];
  units: UnitDefinition[];
  currencySymbol: string;
}

const MAX_FILE_SIZE_MB = 5;

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen, onClose, onSubmit, initialData, categories, units, currencySymbol
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'physical' | 'pricing' | 'variants'>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', sku: '', barcode: '', category: '', price: 0, costPrice: 0,
    stock: 0, minStock: 20, unit: '', physical: { weight: 0, width: 0, height: 0, depth: 0 },
    branchPrices: [], imageUrl: ''
  });
  
  const [variants, setVariants] = useState<Partial<ProductVariant>[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
      setVariants(initialData.variants ? initialData.variants.map(v => ({...v})) : []);
    } else {
      setFormData({
        name: '', sku: '', barcode: '', category: categories[0]?.id || '', price: 0, costPrice: 0,
        stock: 0, minStock: 20, unit: units[0]?.symbol || 'pc',
        physical: { weight: 0, width: 0, height: 0, depth: 0 }, branchPrices: [], imageUrl: ''
      });
      setVariants([]);
    }
    setActiveTab('general');
  }, [initialData, isOpen, categories, units]);

  if (!isOpen) return null;

  // Flatten categories for dropdown
  const categoryOptions: { id: string; name: string; level: number }[] = [];
  const buildCatOptions = (parentId: string | null, level: number) => {
    categories.filter(c => c.parentId === parentId).forEach(c => {
      categoryOptions.push({ id: c.id, name: c.name, level });
      buildCatOptions(c.id, level + 1);
    });
  };
  buildCatOptions(null, 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNum = ['price', 'costPrice', 'stock', 'minStock'].includes(name);
    
    setFormData(prev => ({ ...prev, [name]: isNum ? (parseFloat(value) || 0) : value }));
  };

  const handlePhysicalChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev, physical: { ...prev.physical, [field]: parseFloat(value) || 0 }
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`File size exceeds ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  // Variant Logic
  const handleAddVariant = () => {
    const suffix = (variants.length + 1).toString().padStart(3, '0');
    setVariants(prev => [...prev, {
      id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: '', 
      code: `${formData.sku || 'SKU'}-${suffix}`, 
      barcode: '',
      price: formData.price, 
      costPrice: formData.costPrice,
      stock: 0
    }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.unit) {
      
      // Calculate total stock if variants exist
      let finalStock = formData.stock || 0;
      if (variants.length > 0) {
         finalStock = variants.reduce((acc, v) => acc + (v.stock || 0), 0);
      }

      const productData: Product = {
        ...initialData,
        ...formData as Product,
        stock: finalStock,
        id: initialData?.id || `P-${Date.now()}`,
        variants: variants.length > 0 ? variants as ProductVariant[] : undefined,
        warehouseInventory: initialData?.warehouseInventory || [{ warehouseId: 'wh1', quantity: finalStock }],
      };
      onSubmit(productData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="text-xl font-bold text-slate-800">{initialData ? 'Edit' : 'Add'} Product</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
        </div>
        
        <div className="flex border-b border-slate-200 bg-white overflow-x-auto no-scrollbar">
           {[
             { id: 'general', label: 'General Info', icon: Box },
             { id: 'physical', label: 'Physical Attributes', icon: Scale },
             { id: 'pricing', label: 'Pricing', icon: DollarSign },
             { id: 'variants', label: 'Variants', icon: Layers },
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex-1 flex items-center justify-center px-6 py-5 text-lg font-semibold transition-all whitespace-nowrap min-w-fit outline-none focus:outline-none select-none ${
                 activeTab === tab.id ? 'border-b-4 border-construction-orange text-construction-orange bg-orange-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-b-4 border-transparent'
               }`}
             >
               <tab.icon className="w-6 h-6 mr-3" />
               {tab.label}
             </button>
           ))}
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {activeTab === 'general' && (
            <GeneralTab 
              formData={formData} 
              setFormData={setFormData} 
              handleInputChange={handleInputChange} 
              categoryOptions={categoryOptions} 
              units={units}
              fileInputRef={fileInputRef}
              handleImageUpload={handleImageUpload}
            />
          )}

          {activeTab === 'physical' && (
             <PhysicalTab formData={formData} handlePhysicalChange={handlePhysicalChange} />
          )}

          {activeTab === 'pricing' && (
            <PricingTab formData={formData} handleInputChange={handleInputChange} currencySymbol={currencySymbol} />
          )}

          {activeTab === 'variants' && (
            <VariantsTab 
              variants={variants} 
              setVariants={setVariants} 
              handleAddVariant={handleAddVariant} 
              currencySymbol={currencySymbol}
            />
          )}
        </form>

        <div className="p-4 border-t border-slate-100 flex justify-end space-x-3 bg-white shrink-0">
            <button onClick={onClose} className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="button" onClick={handleSubmit} className="px-5 py-2 bg-construction-orange text-white font-medium rounded-lg hover:bg-orange-600 shadow-sm flex items-center"><Check className="w-4 h-4 mr-2" /> Save</button>
        </div>
      </div>
    </div>
  );
};
