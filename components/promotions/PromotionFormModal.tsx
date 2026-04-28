
import React, { useState, useRef, useEffect } from 'react';
import { Promotion, PromotionType, Product } from '../../types';
import { X, Upload, Trash2, Check, Loader2, Tag } from 'lucide-react';
import { processAndResizeImage } from '../../lib/utils';
import { useGlobal } from '../../context/GlobalContext';

interface PromotionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (promo: Partial<Promotion>) => void;
  initialData: Partial<Promotion>;
}

export const PromotionFormModal: React.FC<PromotionFormModalProps> = ({ 
  isOpen, onClose, onSubmit, initialData 
}) => {
  const { products } = useGlobal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<Partial<Promotion>>({
    title: '',
    description: '',
    imageUrl: '',
    isActive: true,
    type: undefined,
    value: 0,
    minOrderAmount: 0,
    validProductIds: [],
    buyQuantity: 0,
    getQuantity: 0,
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    setFormData(initialData);
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return; // Wait, imageUrl was required, but now let's make title required instead.
    onSubmit(formData);
    onClose();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    setIsProcessing(true);
    try {
      // Promotions might need higher quality, e.g. 1000px
      const resized = await processAndResizeImage(file, 1000, 0.85);
      setFormData(prev => ({ ...prev, imageUrl: resized }));
    } catch (err) {
      alert('Failed to process image');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProductToggle = (productId: string) => {
    setFormData(prev => {
      const ids = prev.validProductIds || [];
      if (ids.includes(productId)) {
        return { ...prev, validProductIds: ids.filter(id => id !== productId) };
      } else {
        return { ...prev, validProductIds: [...ids, productId] };
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl shrink-0">
          <h3 className="text-xl font-bold text-slate-800">
            {initialData.id ? 'Edit Promotion' : 'Add New Promotion'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-6">
          <form id="promotionForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-bold border-b pb-2 text-slate-700">Basic Information</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Summer Sale 50% Off"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Information for cashiers / customers"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Promotion Image (Optional, for Customer Display)</label>
                
                {!formData.imageUrl ? (
                  <div 
                    onClick={() => !isProcessing && fileInputRef.current?.click()}
                    className={`w-full h-32 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-primary-400 transition-colors ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {isProcessing ? (
                       <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                    ) : (
                       <>
                          <div className="p-2 bg-white rounded-full shadow-sm mb-2">
                            <Upload className="w-5 h-5 text-primary-600" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">Click to upload image</span>
                       </>
                    )}
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video group w-full max-w-sm">
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="bg-white text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm flex items-center hover:bg-red-50"
                       >
                          <Trash2 className="w-4 h-4 mr-1.5" /> Remove
                       </button>
                    </div>
                  </div>
                )}
                <input 
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Rules */}
            <div className="space-y-4 pt-2">
              <h4 className="font-bold border-b pb-2 text-slate-700">Promotion Rules</h4>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Promotion Type</label>
                <select
                  value={formData.type || ''}
                  onChange={e => setFormData({...formData, type: e.target.value as PromotionType})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- None (Display Only) --</option>
                  <option value="amount_off_order">Fixed Amount Off Total Order</option>
                  <option value="percent_off_order">Percentage Off Total Order</option>
                  {/* <option value="bxgy">Buy X Get Y</option> */}
                  <option value="product_discount">Discount on Specific Products</option>
                </select>
              </div>

              {formData.type && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  {(formData.type === 'amount_off_order' || formData.type === 'percent_off_order' || formData.type === 'product_discount') && (
                    <div>
                         <label className="block text-sm font-bold text-slate-700 mb-1">
                           Discount {formData.type === 'percent_off_order' ? 'Percentage (%)' : 'Amount'}
                         </label>
                         <input
                           type="number"
                           required
                           min="0"
                           step="0.01"
                           value={formData.value || ''}
                           onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})}
                           className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                         />
                    </div>
                  )}

                  {(formData.type === 'amount_off_order' || formData.type === 'percent_off_order') && (
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">
                           Minimum Order Amount (Optional)
                         </label>
                         <input
                           type="number"
                           min="0"
                           step="0.01"
                           value={formData.minOrderAmount || ''}
                           onChange={e => setFormData({...formData, minOrderAmount: parseFloat(e.target.value) || 0})}
                           className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                         />
                    </div>
                  )}

                  {formData.type === 'product_discount' && (
                    <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">
                           Select Eligible Products
                         </label>
                         <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white">
                           {products.map(p => (
                              <label key={p.id} className="flex items-center p-2 hover:bg-slate-50 rounded cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={formData.validProductIds?.includes(p.id) || false}
                                  onChange={() => handleProductToggle(p.id)}
                                  className="mr-3 text-primary-600 rounded"
                                />
                                <span className="text-sm font-medium text-slate-800">{p.name}</span>
                              </label>
                           ))}
                           {products.length === 0 && <p className="text-sm text-slate-400 p-2">No products available</p>}
                         </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
               </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input 
                type="checkbox" 
                id="isActive"
                checked={formData.isActive}
                onChange={e => setFormData({...formData, isActive: e.target.checked})}
                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Set as Active</label>
            </div>
            
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white rounded-b-xl flex justify-end space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="promotionForm"
            disabled={!formData.title || isProcessing}
            className="px-6 py-2 bg-construction-orange text-white font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4 mr-2" />
            Save Promotion
          </button>
        </div>
      </div>
    </div>
  );
};
