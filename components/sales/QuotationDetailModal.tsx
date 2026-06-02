
import React from 'react';
import { Quotation, SystemSettings } from '../../types';
import { X, Printer, ShoppingCart, Trash2, Edit } from 'lucide-react';
import { PrintableQuotation } from '../shared/PrintableQuotation';
import { useCartStore } from '../../store/useCartStore';
import { useSalesStore } from '../../store/useSalesStore';
import { usePrint } from '../../lib/usePrint';
import { IframePrintWarning } from '../shared/IframePrintWarning';
import { useConfirm } from '../common/ConfirmDialog';

interface QuotationDetailModalProps {
  quotation: Quotation | null;
  isOpen: boolean;
  onClose: () => void;
  settings?: SystemSettings;
  onEdit?: () => void;
}

export const QuotationDetailModal: React.FC<QuotationDetailModalProps> = ({ 
  quotation, isOpen, onClose, settings, onEdit 
}) => {
  const addToCart = useCartStore((state) => state.addToCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const confirm = useConfirm();
  const updateQuotation = useSalesStore((state) => state.updateQuotation);
  const deleteQuotation = useSalesStore((state) => state.deleteQuotation);
  
  const { showIframeWarning, setShowIframeWarning, handlePrint } = usePrint();

  if (!isOpen || !quotation) return null;

  const handleConvertToSale = async () => {
    const ok = await confirm({
      title: 'Load Quotation to Cart',
      message: 'This will clear your current cart and load items from this quotation.',
      confirmText: 'Continue',
      variant: 'warning',
    });
    if (!ok) return;
    clearCart();

    if (quotation.items && quotation.items.length > 0) {
      quotation.items.forEach(item => {
         addToCart(item, item.quantity, item.selectedVariantId, item.sellPrice);
      });

      updateQuotation({ ...quotation, status: 'converted' });

      onClose();

      // Trigger POS tab switch if not already there?
      // In a real app we might navigate, but here user usually goes to POS manually or we rely on notification
      setTimeout(() => {
         alert("Items loaded to POS Cart. Please proceed to Point of Sale.");
      }, 100);
    }
  };

  const handleDelete = async () => {
     const ok = await confirm({
        title: 'Delete Quotation',
        message: 'This quotation will be permanently removed.',
        confirmText: 'Delete',
        variant: 'danger',
     });
     if (!ok) return;
     deleteQuotation(quotation.id);
     onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in print:shadow-none print:max-w-none print:max-h-none print:rounded-none print:h-auto print:w-full print:fixed print:inset-0">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden shrink-0">
           <div>
              <h3 className="text-xl font-bold text-slate-800">Quotation Details</h3>
              <p className="text-xs text-slate-500 font-mono">{quotation.referenceNo}</p>
           </div>
           <div className="flex items-center gap-2">
              {quotation.status === 'active' && onEdit && (
                 <button 
                    onClick={onEdit}
                    className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium text-sm transition-colors border border-blue-100"
                 >
                    <Edit className="w-4 h-4 mr-1.5" /> Edit
                 </button>
              )}
              <button 
                onClick={onClose} 
                className="p-2 bg-slate-200 rounded-full text-slate-600 hover:bg-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
           </div>
        </div>

        <IframePrintWarning show={showIframeWarning} onDismiss={() => setShowIframeWarning(false)} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 print:p-0 print:bg-white print:overflow-visible">
           <div className="shadow-sm md:shadow-md print:shadow-none mx-auto max-w-[210mm] bg-white min-h-[500px]">
              <PrintableQuotation quotation={quotation} settings={settings} />
           </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between gap-3 print:hidden shrink-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
           <button 
              onClick={handleDelete}
              className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-bold flex items-center justify-center text-sm transition-colors"
           >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
           </button>
           <div className="flex flex-col sm:flex-row gap-3">
              <button 
                 onClick={handlePrint}
                 className="px-5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-bold flex items-center justify-center shadow-sm transition-colors"
              >
                 <Printer className="w-4 h-4 mr-2" /> Print / PDF
              </button>
              {quotation.status === 'active' && (
                 <button 
                    onClick={handleConvertToSale}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md flex items-center justify-center transition-colors"
                 >
                    <ShoppingCart className="w-4 h-4 mr-2" /> Load to Cart
                 </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
