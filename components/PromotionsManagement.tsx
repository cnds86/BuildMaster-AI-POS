
import React, { useState } from 'react';
import { Promotion } from '../types';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  X, 
  Edit2, 
  Check, 
  Eye, 
  EyeOff 
} from 'lucide-react';

interface PromotionsManagementProps {
  promotions: Promotion[];
  onAddPromotion: (promo: Promotion) => void;
  onUpdatePromotion: (promo: Promotion) => void;
  onDeletePromotion: (id: string) => void;
}

export const PromotionsManagement: React.FC<PromotionsManagementProps> = ({ 
  promotions, 
  onAddPromotion, 
  onUpdatePromotion, 
  onDeletePromotion 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Promotion>>({
    title: '',
    imageUrl: '',
    isActive: true
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
        isActive: true
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

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Promotions Management</h2>
          <p className="text-slate-500">Manage banners and ads displayed on the Customer Facing Screen.</p>
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
          promotions.map((promo) => (
            <div key={promo.id} className={`group bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col transition-all ${promo.isActive ? 'border-slate-200' : 'border-slate-100 opacity-75'}`}>
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                <img 
                  src={promo.imageUrl} 
                  alt={promo.title} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                />
                {!promo.isActive && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
                      <EyeOff className="w-4 h-4 mr-2" /> Inactive
                    </span>
                  </div>
                )}
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
                <div>
                  <h3 className="font-bold text-slate-800 truncate pr-2" title={promo.title}>{promo.title || 'Untitled Promotion'}</h3>
                  <p className="text-xs text-slate-400 truncate max-w-[200px]">{promo.imageUrl}</p>
                </div>
                <button
                  onClick={() => handleToggleActive(promo)}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${promo.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${promo.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Image URL *</label>
                <input
                  required
                  type="text"
                  value={formData.imageUrl}
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="https://example.com/banner.jpg"
                />
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

              {formData.imageUrl && (
                 <div className="mt-4 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center">
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/400x225?text=Invalid+Image+URL')}
                    />
                 </div>
              )}

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
                  className="px-6 py-2 bg-construction-orange text-white font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-sm flex items-center"
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
