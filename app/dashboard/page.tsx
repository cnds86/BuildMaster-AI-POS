
'use client';
import { Dashboard } from '../../components/Dashboard';
import { useGlobal } from '../../context/GlobalContext';

export default function DashboardPage() {
  const { sales, products } = useGlobal();
  return <Dashboard sales={sales} products={products} />;
}
