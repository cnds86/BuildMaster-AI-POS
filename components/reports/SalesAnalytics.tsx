
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface SalesAnalyticsProps {
  data: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    chartData: any[];
  };
  formatPrice: (val: number) => string;
}

export const SalesAnalytics: React.FC<SalesAnalyticsProps> = ({ data, formatPrice }) => {
  const { totalRevenue, totalCost, totalProfit, chartData } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500 font-medium mb-1">Total Revenue</p>
            <h3 className="text-3xl font-bold text-slate-800">{formatPrice(totalRevenue)}</h3>
         </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500 font-medium mb-1">Total Cost (COGS)</p>
            <h3 className="text-3xl font-bold text-slate-700">{formatPrice(totalCost)}</h3>
         </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500 font-medium mb-1">Gross Profit</p>
            <h3 className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
               {formatPrice(totalProfit)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Margin: {totalRevenue ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%</p>
         </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px]">
         <h4 className="font-bold text-slate-700 mb-6">Revenue vs Profit</h4>
         <ResponsiveContainer width="100%" height="90%">
            <BarChart data={chartData}>
               <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
               <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
               <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
               <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(val: number) => formatPrice(val)}
               />
               <Legend />
               <Bar dataKey="revenue" name="Revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
               <Bar dataKey="profit" name="Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};
