
import React from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus, CheckCircle } from 'lucide-react';
import { BusinessInsight } from '../../types';

interface AiInsightPanelProps {
  insight: BusinessInsight;
  formatPrice: (val: number) => string;
}

export const AiInsightPanel: React.FC<AiInsightPanelProps> = ({ insight, formatPrice }) => {
  return (
     <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <Sparkles className="w-32 h-32" />
        </div>
        
        <div className="relative z-10">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center">
                 <Sparkles className="w-6 h-6 mr-2" /> AI Business Analysis
              </h3>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                 Gemini Powered
              </span>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                 <p className="text-lg font-medium leading-relaxed opacity-90 mb-4">
                    "{insight.summary}"
                 </p>
                 <div className="space-y-2">
                    <p className="text-xs font-bold uppercase opacity-70 tracking-wider">Recommended Actions</p>
                    <ul className="space-y-1">
                       {insight.actionItems.map((item, idx) => (
                          <li key={idx} className="flex items-center text-sm bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                             <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
                             {item}
                          </li>
                       ))}
                    </ul>
                 </div>
              </div>
              
              <div className="flex flex-col gap-4">
                 <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
                    <p className="text-xs opacity-70 mb-1">Projected Revenue (7 Days)</p>
                    <p className="text-2xl font-bold">{formatPrice(insight.predictedRevenueNextWeek)}</p>
                 </div>
                 <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
                    <p className="text-xs opacity-70 mb-1">Trend Direction</p>
                    <div className="flex items-center font-bold text-lg capitalize">
                       {insight.trendDirection === 'up' && <TrendingUp className="w-5 h-5 mr-2 text-green-300" />}
                       {insight.trendDirection === 'down' && <TrendingDown className="w-5 h-5 mr-2 text-red-300" />}
                       {insight.trendDirection === 'stable' && <Minus className="w-5 h-5 mr-2 text-yellow-300" />}
                       {insight.trendDirection}
                    </div>
                 </div>
                 <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
                    <p className="text-xs opacity-70 mb-1">Top Category</p>
                    <p className="font-bold text-lg truncate">{insight.topPerformingCategory}</p>
                 </div>
              </div>
           </div>
        </div>
     </div>
  );
};
