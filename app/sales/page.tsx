
'use client';
import { SalesHistory } from '../../components/SalesHistory';
import { useGlobal } from '../../context/GlobalContext';

export default function SalesPage() {
  const { sales, handleVoidSale } = useGlobal();

  return (
    <SalesHistory 
      sales={sales}
      onVoidSale={handleVoidSale}
    />
  );
}
