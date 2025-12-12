
'use client';
import { PromotionsManagement } from '../../components/PromotionsManagement';
import { useGlobal } from '../../context/GlobalContext';

export default function PromotionsPage() {
  const { promotions, addPromotion, updatePromotion, deletePromotion } = useGlobal();

  return (
    <PromotionsManagement 
      promotions={promotions}
      onAddPromotion={addPromotion}
      onUpdatePromotion={updatePromotion}
      onDeletePromotion={deletePromotion}
    />
  );
}
