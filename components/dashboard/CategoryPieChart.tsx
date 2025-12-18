
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface CategoryPieChartProps {
  data: any[];
  title: string;
  colors: string[];
  formatPrice: (val: number) => string;
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data, title, colors, formatPrice }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1">
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <div className="flex-1 min-h-[200px]">
         <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
               formatter={(value: number) => formatPrice(value)}
               contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
