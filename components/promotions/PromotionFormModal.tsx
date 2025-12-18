
import React, { useState, useRef, useEffect } from 'react';
import { Promotion } from '../../types';
import { X, Upload, Trash2, Check } from 'lucide-react';

interface PromotionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (promo: Partial<Promotion>) => void;
  initialData: Partial<Promotion>;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const PromotionFormModal: React.FC<PromotionFormModalProps> = ({ 
  isOpen, onClose, onSubmit, initialData 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Promotion>>({
    title: '',
    imageUrl: '',
    isActive: true,
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    setFormData(initialData);
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) return;
    onSubmit(formData);
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="text-xl font-bold text-slate-800">
            {initialData.id ? 'Edit Promotion' : 'Add New Promotion'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title (Optional)</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Summer Sale 50% Off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Promotion Image *</label>
            
            {!formData.imageUrl ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-primary-400 transition-colors"
              >
                <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                  <Upload className="w-6 h-6 text-primary-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">Click to upload image</span>
                <span className="text-xs text-slate-400 mt-1">Max file size: {MAX_FILE_SIZE_MB}MB</span>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video group">
                <img 
                  src={formData.imageUrl} 
                  alt="Preview" 
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold shadow-sm flex items-center hover:bg-red-50"
                   >
                      <Trash2 className="w-4 h-4 mr-2" /> Remove
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

          <div className="flex justify-end pt-4 space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.imageUrl}
              className="px-6 py-2 bg-construction-orange text-white font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4 mr-2" />
              Save Promotion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
