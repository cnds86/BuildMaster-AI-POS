
import React, { useState, useRef } from 'react';
import { Promotion } from '../types';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  X, 
  Edit2, 
  Check, 
  Eye, 
  EyeOff,
  Calendar,
  Clock,
  Upload,
  AlertCircle
} from 'lucide-react';

interface PromotionsManagementProps {
  promotions: Promotion[];
  onAddPromotion: (promo: Promotion) => void;
  onUpdatePromotion: (promo: Promotion) => void;
  onDeletePromotion: (id: string) => void;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const PromotionsManagement: React.FC<PromotionsManagementProps> = ({ 
  promotions, 
  onAddPromotion, 
  onUpdatePromotion, 
  onDeletePromotion 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Promotion>>({
    title: '',
    imageUrl: '',
    isActive: true,
    startDate: '',
    endDate: ''
  });

  const handleOpenModal = (promo?: Promotion) => {
    if (promo) {
      setEditingId(promo.id);
      setFormData(promo);
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        imageUrl: '',
        isActive: true,
        startDate: '',
        endDate: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) return;

    if (editingId) {
      onUpdatePromotion({ ...formData, id: editingId } as Promotion);
    } else {
      onAddPromotion({ ...formData, id: `promo-${Date.now()}` } as Promotion);
    }
    setIsModalOpen(false);
  };

  const handleToggleActive = (promo: Promotion) => {
    onUpdatePromotion({ ...promo, isActive: !promo.isActive });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Check File Size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`);
      // Reset input value to allow re-selecting the same file if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Check File Type (Optional extra safety)
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    // 3. Convert to Base64
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

  const getStatusInfo = (promo: Promotion) => {
    const now = new Date();
    
    if (!promo.isActive) return { label: 'Inactive', color: 'bg-slate-100 text-slate-500', icon: EyeOff };

    if (promo.endDate) {
      const end = new Date(promo.endDate);
      end.setHours(23, 59, 59, 999); // End of the day
      if (now > end) return { label: 'Expired', color: 'bg-red-100 text-red-600', icon: Clock };
    }

    if (promo.startDate) {
      const start = new Date(promo.startDate);
      if (now < start) return { label: 'Scheduled', color: 'bg-blue-100 text-blue-600', icon: Calendar };
    }

    return { label: 'Active', color: 'bg-green-100 text-green-600', icon: Check };
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Promotions Management</h2>
          <p className="text-slate-500">Manage banners, schedule ads, and customer display content.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-construction-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Promotion
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-4">
        {promotions.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
            <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
            <p>No promotions active.</p>
            <button 
              onClick={() => handleOpenModal()}
              className="mt-4 text-primary-600 hover:underline font-medium"
            >
              Create your first promotion
            </button>
          </div>
        ) : (
          promotions.map((promo) => {
            const status = getStatusInfo(promo);
            const StatusIcon = status.icon;

            return (
              <div key={promo.id} className={`group bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col transition-all ${promo.isActive ? 'border-slate-200' : 'border-slate-100 opacity-75'}`}>
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  <img 
                    src={promo.imageUrl} 
                    alt={promo.title} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                  />
                  <div className="absolute top-2 left-2">
                     <span className={`flex items-center px-2 py-1 rounded-md text-xs font-bold shadow-sm backdrop-blur-md ${status.color.includes('bg-') ? status.color.replace('bg-', 'bg-white/90 text-') : 'bg-white/90 text-slate-600'}`}>
                        <StatusIcon className="w-3 h-3 mr-1" /> {status.label}
                     </span>
                  </div>
                  
                  <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                        onClick={() => handleOpenModal(promo)}
                        className="p-2 bg-white text-slate-600 rounded-full hover:text-primary-600 shadow-sm"
                     >
                        <Edit2 className="w-4 h-4" />
                     </button>
                     <button 
                        onClick={() => {
                           if(confirm('Delete this promotion?')) onDeletePromotion(promo.id);
                        }}
                        className="p-2 bg-white text-slate-600 rounded-full hover:text-red-600 shadow-sm"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                </div>
                
                <div className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-bold text-slate-800 truncate" title={promo.title}>{promo.title || 'Untitled Promotion'}</h3>
                    {promo.startDate || promo.endDate ? (
                       <div className="text-xs text-slate-500 mt-1 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {promo.startDate ? new Date(promo.startDate).toLocaleDateString() : 'Now'} 
                          {' - '} 
                          {promo.endDate ? new Date(promo.endDate).toLocaleDateString() : 'Forever'}
                       </div>
                    ) : (
                       <p className="text-xs text-slate-400 mt-1">Always Active</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleActive(promo)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none shrink-0 ${promo.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${promo.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Promotion' : 'Add New Promotion'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
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
                
                {/* Upload Area */}
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

                {/* Hidden File Input */}
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
                  onClick={() => setIsModalOpen(false)}
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
      )}
    </div>
  );
};
