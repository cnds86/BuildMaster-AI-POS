
'use client';
import { PosTerminal } from '../../components/PosTerminal';
import { useGlobal } from '../../context/GlobalContext';

export default function PosPage() {
  const { products, processSale, settings } = useGlobal();
  return <PosTerminal products={products} onProcessSale={processSale} settings={settings} />;
}
