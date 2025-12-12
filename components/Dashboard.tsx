
import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Sale, Product } from '../types';
import { TrendingUp, DollarSign, Package, AlertCircle, AlertTriangle, CalendarRange, Wallet } from 'lucide-react';
import { INITIAL_CATEGORIES_TREE } from '../services/data';
import { useGlobal } from '../context/GlobalContext';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export const Dashboard: React.FC<DashboardProps> = ({ sales, products }) => {
  const { t } = useGlobal();

  // 1. Filter Sales for Last Quarter (90 Days)
  const quarterMetrics = useMemo(() => {
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);

    const filteredSales = sales.filter(s => new Date(s.date) >= ninetyDaysAgo && s.status !== 'voided');
    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const totalOrders = filteredSales.length;
    
    // Calculate unpaid debt from ALL time, not just quarter
    const totalOutstanding = sales
        .filter(s => s.status !== 'voided' && (s.paymentStatus === 'unpaid' || s.paymentStatus === 'partial'))
        .reduce((acc, s) => acc + (s.remainingAmount || s.total), 0);

    return { filteredSales, totalRevenue, totalOrders, totalOutstanding };
  }, [sales]);

  // 2. Weekly/Daily Trend Data (Last 7 days or aggregated by week for quarter)
  const trendData = useMemo(() => {
    const dailyMap = new Map<string, number>();
    const today = new Date();
    
    // Initialize last 14 days with 0
    for(let i=13; i>=0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dailyMap.set(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 0);
    }

    quarterMetrics.filteredSales.forEach(sale => {
      const dateStr = new Date(sale.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + sale.total);
      }
    });

    return Array.from(dailyMap).map(([name, sales]) => ({ name, sales }));
  }, [quarterMetrics.filteredSales]);

  // 3. Category Breakdown
  const categoryData = useMemo(() => {
    const catMap = new Map<string, number>();

    quarterMetrics.filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        let catName = item.category;
        const catObj = INITIAL_CATEGORIES_TREE.find(c => c.id === item.category);
        if (catObj) catName = catObj.name;
        
        const lineTotal = item.sellPrice * item.quantity;
        catMap.set(catName, (catMap.get(catName) || 0) + lineTotal);
      });
    });

    return Array.from(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [quarterMetrics.filteredSales]);

  // 4. Top Selling Products
  const topProducts = useMemo(() => {
    const prodMap = new Map<string, { name: string; revenue: number; qty: number; unit: string }>();

    quarterMetrics.filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = prodMap.get(item.id) || { name: item.name, revenue: 0, qty: 0, unit: item.unit };
        existing.revenue += (item.sellPrice * item.quantity);
        existing.qty += (item.quantity / item.sellConversionFactor);
        prodMap.set(item.id, existing);
      });
    });

    return Array.from(prodMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [quarterMetrics.filteredSales]);


  // Metrics for Cards
  const lowStockProducts = products.filter(p => p.stock < (p.minStock || 20)).sort((a, b) => a.stock - b.stock);
  const lowStockCount = lowStockProducts.length;


  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {subtext && <p className="text-sm text-slate-400">{subtext}</p>}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('dashboard.title')}</h2>
          <p className="text-slate-500 text-sm flex items-center mt-1">
            <CalendarRange className="w-4 h-4 mr-1" />
            {t('dashboard.subtitle')}
          </p>
        </div>
        <span className="text-sm text-slate-500">Live Data</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t('dashboard.revenue')}
          value={`$${quarterMetrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
          icon={DollarSign} 
          color="bg-green-500" 
          subtext=""
        />
        <StatCard 
          title="Outstanding Debt"
          value={`$${quarterMetrics.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
          icon={Wallet} 
          color="bg-orange-500" 
          subtext="Accounts Receivable"
        />
        <StatCard 
          title={t('common.total') + ' ' + t('common.items')}
          value={products.length} 
          icon={Package} 
          color="bg-purple-500" 
          subtext=""
        />
        <StatCard 
          title={t('dashboard.lowStock')}
          value={lowStockCount} 
          icon={AlertCircle} 
          color={lowStockCount > 0 ? "bg-red-500" : "bg-slate-400"} 
          subtext=""
        />
      </div>

      {/* Low Stock Alert Section */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-red-100 border-b border-red-200 flex items-center justify-between">
            <h3 className="text-red-800 font-bold flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {t('dashboard.critical')} ({lowStockCount})
            </h3>
          </div>
          <div className="p-4 overflow-x-auto">
             <div className="flex space-x-4 pb-2">
               {lowStockProducts.map(p => (
                 <div key={p.id} className="min-w-[200px] bg-white p-3 rounded-lg border border-red-100 shadow-sm flex flex-col">
                    <span className="font-semibold text-slate-700 truncate mb-1" title={p.name}>{p.name}</span>
                    <div className="flex justify-between items-end mt-auto">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500">{t('inventory.stock')}</span>
                        <span className="text-xl font-bold text-red-600">{p.stock}</span>
                      </div>
                      <div className="flex flex-col items-end">
                         <span className="text-[10px] text-slate-400 mb-1">Min: {p.minStock || 20}</span>
                         <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase font-bold">
                           {p.unit}
                         </span>
                      </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">{t('dashboard.trend')}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickMargin={10} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#0ea5e9" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">{t('dashboard.byCategory')}</h3>
          <div className="h-80">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('dashboard.topProducts')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{t('inventory.productName')}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">{t('dashboard.soldQty')}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">{t('dashboard.revenue')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                         <div className="font-medium text-slate-700">{p.name}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 font-mono">
                         {Math.round(p.qty)} <span className="text-[10px] text-slate-400">{p.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                         ${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">{t('dashboard.byCategory')}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" hide />
                  <YAxis dataKey="name" type="category" width={100} stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(value: number) => `$${value.toFixed(2)}`}
                  />
                  <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
};
