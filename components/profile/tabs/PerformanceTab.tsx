
import React, { useState, useMemo } from 'react';
import { Sale } from '../../../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface PerformanceTabProps {
  sales: Sale[];
  formatPrice: (val: number) => string;
}

type TimeRange = 'week' | 'month' | 'year';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const PerformanceTab: React.FC<PerformanceTabProps> = ({ sales, formatPrice }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const { chartData, periodRevenue, periodOrders, periodAvg, paymentChartData } = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    let groupBy: 'day' | 'month' = 'day';

    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        groupBy = 'day';
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        groupBy = 'day';
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        groupBy = 'month';
        break;
    }

    const filteredSales = sales.filter(s => new Date(s.date) >= startDate);

    const groupedData = new Map<string, { date: string; sortKey: number; revenue: number; count: number }>();
    const paymentMethods: Record<string, number> = {};

    filteredSales.forEach(sale => {
       const d = new Date(sale.date);
       let key = '';
       let sortKey = 0;

       if (groupBy === 'month') {
          key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          sortKey = d.getFullYear() * 100 + d.getMonth();
       } else {
          key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          sortKey = d.getTime();
       }

       const existing = groupedData.get(key) || { date: key, sortKey, revenue: 0, count: 0 };
       existing.revenue += sale.total;
       existing.count += 1;
       groupedData.set(key, existing);

       const method = sale.paymentMethod || 'cash';
       paymentMethods[method] = (paymentMethods[method] || 0) + sale.total;
    });

    const chartData = Array.from(groupedData.values()).sort((a, b) => a.sortKey - b.sortKey);
    const periodRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const periodOrders = filteredSales.length;
    const periodAvg = periodOrders > 0 ? periodRevenue / periodOrders : 0;

    const paymentChartData = Object.entries(paymentMethods).map(([name, value]) => ({ name, value }));

    return { chartData, periodRevenue, periodOrders, periodAvg, paymentChartData };
  }, [sales, timeRange]);

  return (
     <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <h3 className="text-lg font-bold text-slate-800">Sales Analytics</h3>
           <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto">
              {(['week', 'month', 'year'] as const).map(p => (
                 <button
                    key={p}
                    onClick={() => setTimeRange(p)}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all capitalize ${
                       timeRange === p ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                 >
                    {p}
                 </button>
              ))}
           </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-[300px]">
           <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                 <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                       <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                 <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                 <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(val: number) => formatPrice(val)}
                 />
                 <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
           </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-700 mb-4 text-sm">Payment Methods</h4>
              <div className="h-48">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                          data={paymentChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                       >
                          {paymentChartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                       </Pie>
                       <Tooltip formatter={(val: number) => formatPrice(val)} />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                 {paymentChartData.map((entry, index) => (
                    <div key={index} className="flex items-center text-xs text-slate-600">
                       <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                       <span className="capitalize">{entry.name}</span>
                    </div>
                 ))}
              </div>
           </div>
           
           <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-700 mb-4 text-sm">Period Summary</h4>
              <div className="space-y-4">
                 <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <span className="text-sm text-slate-500">Total Revenue</span>
                    <span className="font-bold text-slate-800">{formatPrice(periodRevenue)}</span>
                 </div>
                 <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <span className="text-sm text-slate-500">Total Orders</span>
                    <span className="font-bold text-slate-800">{periodOrders}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Avg. Ticket Size</span>
                    <span className="font-bold text-green-600">{formatPrice(periodAvg)}</span>
                 </div>
              </div>
           </div>
        </div>
     </div>
  );
};
