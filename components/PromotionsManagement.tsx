
import React, { useState } from 'react';
import { Promotion } from '../types';
import { Plus } from 'lucide-react';
import { PromotionList } from './promotions/PromotionList';
import { PromotionFormModal } from './promotions/PromotionFormModal';

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

  const handleSubmit = (data: Partial<Promotion>) => {
    if (editingId) {
      onUpdatePromotion({ ...data, id: editingId } as Promotion);
    } else {
      onAddPromotion({ ...data, id: `promo-${Date.now()}` } as Promotion);
    }
  };

  const handleToggleActive = (promo: Promotion) => {
    onUpdatePromotion({ ...promo, isActive: !promo.isActive });
  };

  return (
    <div className="space-y-6 h-full flex flex-col pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Promotions Management</h2>
          <p className="text-slate-500">Manage banners, schedule ads, and customer display content.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold shadow-sm whitespace-nowrap w-full md:w-auto justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Promotion
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
         <PromotionList 
           promotions={promotions}
           onEdit={handleOpenModal}
           onDelete={onDeletePromotion}
           onToggleActive={handleToggleActive}
           onOpenAdd={() => handleOpenModal()}
         />
      </div>

      <PromotionFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={formData}
      />
    </div>
  );
};
