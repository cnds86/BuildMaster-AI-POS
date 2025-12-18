
import React from 'react';
import { TrendingUp, DollarSign, Wallet, AlertCircle } from 'lucide-react';

interface DashboardStatsProps {
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    aov: number;
  };
  totalOutstanding: number;
  lowStockCount: number;
  productCount: number;
  targetProgress: number;
  showTarget: boolean;
  formatPrice: (val: number) => string;
  t: (key: string) => string;
}

const StatCard = ({ title, value, icon: Icon, color, subtext, trend, progress }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-full relative overflow-hidden">
    <div className="flex items-start justify-between mb-4 relative z-10">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    
    {progress !== undefined && (
       <div className="mb-2 relative z-10">
          <div className="flex justify-between text-xs mb-1">
             <span className="text-slate-500">Monthly Target</span>
             <span className="font-bold text-slate-700">{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
             <div className="bg-green-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%` }}></div>
          </div>
       </div>
    )}

    {subtext && (
       <div className="mt-auto pt-2 border-t border-slate-50 relative z-10">
          <p className="text-xs text-slate-400 flex items-center">
             {trend === 'up' && <TrendingUp className="w-3 h-3 mr-1 text-green-500" />}
             {subtext}
          </p>
       </div>
    )}
  </div>
);

export const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  metrics, totalOutstanding, lowStockCount, productCount, targetProgress, showTarget, formatPrice, t 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        title={t('dashboard.revenue')}
        value={formatPrice(metrics.totalRevenue)}
        icon={DollarSign} 
        color="bg-green-500" 
        subtext={`${metrics.totalOrders} orders in period`}
        trend="up"
        progress={showTarget ? targetProgress : undefined}
      />
      <StatCard 
        title="Avg. Order Value"
        value={formatPrice(metrics.aov)}
        icon={TrendingUp} 
        color="bg-blue-500" 
        subtext="Per transaction average"
      />
      <StatCard 
        title="Outstanding Debt"
        value={formatPrice(totalOutstanding)}
        icon={Wallet} 
        color="bg-orange-500" 
        subtext="Total unpaid (All time)"
      />
      <StatCard 
        title="Low Stock Alerts"
        value={lowStockCount} 
        icon={AlertCircle} 
        color={lowStockCount > 0 ? "bg-red-500" : "bg-slate-400"} 
        subtext={`${productCount} total items`}
      />
    </div>
  );
};
