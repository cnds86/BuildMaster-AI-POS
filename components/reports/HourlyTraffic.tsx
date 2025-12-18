
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { Activity } from 'lucide-react';

interface HourlyTrafficProps {
  data: any[];
  formatPrice: (val: number) => string;
}

export const HourlyTraffic: React.FC<HourlyTrafficProps> = ({ data, formatPrice }) => {
  return (
     <div className="space-y-6 animate-fade-in">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[500px]">
           <h4 className="font-bold text-slate-800 mb-2 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-500" />
              Hourly Sales Distribution (Traffic)
           </h4>
           <p className="text-xs text-slate-500 mb-6">Aggregated data for the selected period.</p>
           
           <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={data}>
                 <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                       <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                 <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis yAxisId="left" stroke="#8884d8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                 <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" fontSize={12} tickLine={false} axisLine={false} />
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(val: number, name: string) => [name === 'revenue' ? formatPrice(val) : val, name === 'revenue' ? 'Revenue' : 'Transactions']}
                 />
                 <Legend />
                 <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRevenue)" />
                 <Line yAxisId="right" type="monotone" dataKey="count" name="Transactions" stroke="#82ca9d" strokeWidth={2} dot={{r: 4}} />
              </AreaChart>
           </ResponsiveContainer>
        </div>
     </div>
  );
};
