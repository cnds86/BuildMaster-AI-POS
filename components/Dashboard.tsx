
import React, { useMemo, useState } from 'react';
import { Sale, Product, BusinessInsight } from '../types';
import { CalendarRange, Sparkles } from 'lucide-react';
import { INITIAL_CATEGORIES_TREE } from '../services/data';
import { useGlobal } from '../context/GlobalContext';
import { generateBusinessInsights } from '../services/geminiService';

// Sub-components
import { DashboardStats } from './dashboard/DashboardStats';
import { AiInsightPanel } from './dashboard/AiInsightPanel';
import { LowStockAlert } from './dashboard/LowStockAlert';
import { SalesTrendChart } from './dashboard/SalesTrendChart';
import { CategoryPieChart } from './dashboard/CategoryPieChart';
import { RecentActivity } from './dashboard/RecentActivity';
import { TopProductsTable } from './dashboard/TopProductsTable';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

type TimeRange = '7d' | '30d' | '90d' | 'all';

export const Dashboard: React.FC<DashboardProps> = ({ sales, products }) => {
  const { t, formatPrice, auditLogs, settings } = useGlobal();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  
  // AI State
  const [insight, setInsight] = useState<BusinessInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  // 1. Filter Sales based on Time Range
  const dashboardMetrics = useMemo(() => {
    const today = new Date();
    let startDate = new Date();
    
    if (timeRange === '7d') startDate.setDate(today.getDate() - 7);
    else if (timeRange === '30d') startDate.setDate(today.getDate() - 30);
    else if (timeRange === '90d') startDate.setDate(today.getDate() - 90);
    else startDate = new Date(0); // Beginning of time

    // Filter sales strictly by date range and non-voided status
    const filteredSales = sales.filter(s => {
       const saleDate = new Date(s.date);
       return saleDate >= startDate && saleDate <= today && s.status !== 'voided';
    });

    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const totalOrders = filteredSales.length;
    
    // Average Order Value
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return { filteredSales, totalRevenue, totalOrders, aov, startDate };
  }, [sales, timeRange]);

  // 2. Dynamic Trend Data
  const trendData = useMemo(() => {
    const dailyMap = new Map<string, number>();
    const today = new Date();
    
    let daysToGenerate = 30;
    if (timeRange === '7d') daysToGenerate = 7;
    else if (timeRange === '90d') daysToGenerate = 90;
    else if (timeRange === 'all') daysToGenerate = 60; 

    for(let i = daysToGenerate - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyMap.set(key, 0);
    }

    dashboardMetrics.filteredSales.forEach(sale => {
      const dateStr = new Date(sale.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + sale.total);
      }
    });

    const data = Array.from(dailyMap).map(([name, sales]) => ({ name, sales, projected: 0 }));

    // Inject Projection if available
    if (insight && insight.predictedRevenueNextWeek > 0) {
       const dailyAvg = insight.predictedRevenueNextWeek / 7;
       // Add 3 days of projection to end of chart
       for (let i = 1; i <= 3; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          data.push({ name: key + ' (Est)', sales: 0, projected: dailyAvg });
       }
    }

    return data;
  }, [dashboardMetrics.filteredSales, timeRange, insight]);

  // 3. Category Breakdown
  const categoryData = useMemo(() => {
    const catMap = new Map<string, number>();

    dashboardMetrics.filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        let catName = item.category;
        const catObj = INITIAL_CATEGORIES_TREE.find(c => c.id === item.category);
        if (catObj) catName = catObj.name;
        
        const lineTotal = item.sellPrice * item.quantity;
        catMap.set(catName, (catMap.get(catName) || 0) + lineTotal);
      });
    });

    const result = Array.from(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    if (result.length > 5) {
       const top5 = result.slice(0, 5);
       const others = result.slice(5).reduce((sum, item) => sum + item.value, 0);
       return [...top5, { name: 'Others', value: others }];
    }
    return result;
  }, [dashboardMetrics.filteredSales]);

  // 4. Top Selling Products
  const topProducts = useMemo(() => {
    const prodMap = new Map<string, { name: string; revenue: number; qty: number; unit: string }>();

    dashboardMetrics.filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = prodMap.get(item.id) || { name: item.name, revenue: 0, qty: 0, unit: item.unit };
        existing.revenue += (item.sellPrice * item.quantity);
        existing.qty += (item.quantity / (item.sellConversionFactor || 1));
        prodMap.set(item.id, existing);
      });
    });

    return Array.from(prodMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [dashboardMetrics.filteredSales]);

  // Low Stock Logic
  const lowStockProducts = products.filter(p => p.stock < (p.minStock || 20)).sort((a, b) => a.stock - b.stock);
  
  // Outstanding Debt
  const totalOutstanding = useMemo(() => {
     return sales
        .filter(s => s.status !== 'voided' && (s.paymentStatus === 'unpaid' || s.paymentStatus === 'partial'))
        .reduce((acc, s) => acc + (s.remainingAmount || s.total), 0);
  }, [sales]);

  // Recent Logs (Latest 5)
  const recentLogs = useMemo(() => {
     return [...auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
  }, [auditLogs]);

  // Calculate Target Progress (Monthly)
  const currentMonthRevenue = useMemo(() => {
     const now = new Date();
     return sales.filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && s.status !== 'voided';
     }).reduce((acc, s) => acc + s.total, 0);
  }, [sales]);

  const targetProgress = settings.monthlyTarget ? (currentMonthRevenue / settings.monthlyTarget) * 100 : 0;

  // AI Handler
  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    const recentSales = sales.filter(s => {
       const d = new Date(s.date);
       const thirtyDaysAgo = new Date();
       thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
       return d >= thirtyDaysAgo && s.status !== 'voided';
    });
    const result = await generateBusinessInsights(recentSales, products);
    setInsight(result);
    setLoadingInsight(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('dashboard.title')}</h2>
          <p className="text-slate-500 text-sm flex items-center mt-1">
            <CalendarRange className="w-4 h-4 mr-1" />
            Performance Overview
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={handleGenerateInsight}
             disabled={loadingInsight}
             className="flex items-center px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all text-sm font-bold disabled:opacity-70"
           >
             <Sparkles className={`w-4 h-4 mr-2 ${loadingInsight ? 'animate-spin' : ''}`} />
             {loadingInsight ? 'Analyzing...' : 'AI Analyst'}
           </button>

           {/* Style A: Pill Segmented Control */}
           <div className="bg-slate-100 p-1 rounded-xl flex">
              {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                 <button
                   key={range}
                   onClick={() => setTimeRange(range)}
                   className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                      timeRange === range 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                   }`}
                 >
                    {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '3 Months' : 'All Time'}
                 </button>
              ))}
           </div>
        </div>
      </div>

      {/* KPI Cards */}
      <DashboardStats 
        metrics={dashboardMetrics}
        totalOutstanding={totalOutstanding}
        lowStockCount={lowStockProducts.length}
        productCount={products.length}
        targetProgress={targetProgress}
        showTarget={timeRange === '30d'}
        formatPrice={formatPrice}
        t={t}
      />

      {/* AI Insight Panel */}
      {insight && <AiInsightPanel insight={insight} formatPrice={formatPrice} />}

      {/* Low Stock Alert */}
      <LowStockAlert products={lowStockProducts} t={t} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SalesTrendChart 
          data={trendData} 
          title={t('dashboard.trend')} 
          hasProjection={!!insight} 
          formatPrice={formatPrice} 
        />

        <div className="flex flex-col gap-6">
           <CategoryPieChart 
              data={categoryData} 
              title={t('dashboard.byCategory')} 
              colors={COLORS} 
              formatPrice={formatPrice} 
           />
           <RecentActivity logs={recentLogs} />
        </div>
      </div>

      {/* Top Products Table */}
      <TopProductsTable 
         products={topProducts} 
         title={t('dashboard.topProducts')} 
         labels={{ name: t('inventory.productName'), qty: t('dashboard.soldQty'), revenue: t('dashboard.revenue') }} 
         formatPrice={formatPrice}
      />
    </div>
  );
};
