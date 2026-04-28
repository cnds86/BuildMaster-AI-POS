
import React from 'react';
import { Promotion } from '../../types';
import { Edit2, Trash2, Image as ImageIcon, Calendar, Check, EyeOff, Clock } from 'lucide-react';

interface PromotionListProps {
  promotions: Promotion[];
  onEdit: (promo: Promotion) => void;
  onDelete: (id: string) => void;
  onToggleActive: (promo: Promotion) => void;
  onOpenAdd: () => void;
}

export const PromotionList: React.FC<PromotionListProps> = ({ 
  promotions, onEdit, onDelete, onToggleActive, onOpenAdd 
}) => {
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

  if (promotions.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
        <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
        <p>No promotions active.</p>
        <button 
          onClick={onOpenAdd}
          className="mt-4 text-primary-600 hover:underline font-medium"
        >
          Create your first promotion
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-4">
      {promotions.map((promo) => {
        const status = getStatusInfo(promo);
        const StatusIcon = status.icon;

        return (
          <div key={promo.id} className={`group bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col transition-all ${promo.isActive ? 'border-slate-200' : 'border-slate-100 opacity-75'}`}>
              <div className="relative aspect-video bg-slate-100 overflow-hidden flex items-center justify-center">
                {promo.imageUrl ? (
                  <img 
                    src={promo.imageUrl} 
                    alt={promo.title} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                  />
                ) : (
                  <div className="text-slate-400 flex flex-col items-center">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs font-semibold uppercase">No Image</span>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                 <span className={`flex items-center px-2 py-1 rounded-md text-xs font-bold shadow-sm backdrop-blur-md ${status.color.includes('bg-') ? status.color.replace('bg-', 'bg-white/90 text-') : 'bg-white/90 text-slate-600'}`}>
                    <StatusIcon className="w-3 h-3 mr-1" /> {status.label}
                 </span>
              </div>
              
              <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                    onClick={() => onEdit(promo)}
                    className="p-2 bg-white text-slate-600 rounded-full hover:text-primary-600 shadow-sm"
                 >
                    <Edit2 className="w-4 h-4" />
                 </button>
                 <button 
                    onClick={() => {
                       if(confirm('Delete this promotion?')) onDelete(promo.id);
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
                onClick={() => onToggleActive(promo)}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none shrink-0 ${promo.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${promo.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
