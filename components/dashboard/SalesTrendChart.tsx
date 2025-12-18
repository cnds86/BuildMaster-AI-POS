
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

interface SalesTrendChartProps {
  data: any[];
  title: string;
  hasProjection: boolean;
  formatPrice: (val: number) => string;
}

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data, title, hasProjection, formatPrice }) => {
  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
         <h3 className="text-lg font-bold text-slate-800">{title}</h3>
         <div className="flex items-center text-xs text-slate-500 space-x-3">
            <span className="flex items-center"><span className="w-3 h-3 bg-sky-500 rounded-full mr-2"></span> Revenue</span>
            {hasProjection && <span className="flex items-center"><span className="w-3 h-3 bg-violet-400 rounded-full mr-2 border border-dashed border-violet-600"></span> Forecast</span>}
         </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis 
               dataKey="name" 
               stroke="#94a3b8" 
               fontSize={11} 
               tickMargin={10} 
               tickLine={false}
               axisLine={false}
            />
            <YAxis 
               stroke="#94a3b8" 
               fontSize={11} 
               tickFormatter={(val) => formatPrice(val).replace(/[^0-9.]/g, '')} 
               tickLine={false}
               axisLine={false}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [formatPrice(value), name === 'projected' ? 'Forecast' : 'Revenue']}
              contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area 
              type="monotone" 
              dataKey="sales" 
              stroke="#0ea5e9" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorSales)" 
            />
            <Area 
              type="monotone" 
              dataKey="projected" 
              stroke="#8b5cf6" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              fillOpacity={1} 
              fill="url(#colorProjected)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
