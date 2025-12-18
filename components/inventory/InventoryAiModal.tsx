
import React, { useEffect, useState } from 'react';
import { Product, InventoryAnalysisResult, Sale } from '../../types';
import { Sparkles, X, Loader2, RefreshCw, Layers, PackagePlus, ArrowRight, AlertCircle, TrendingUp } from 'lucide-react';
import { analyzeInventory } from '../../services/geminiService';

interface InventoryAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  sales: Sale[];
  formatPrice: (val: number) => string;
}

export const InventoryAiModal: React.FC<InventoryAiModalProps> = ({ isOpen, onClose, products, sales, formatPrice }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InventoryAnalysisResult | null>(null);

  useEffect(() => {
    if (isOpen && !result && !loading) {
      setLoading(true);
      analyzeInventory(products, sales).then(res => {
        setResult(res);
        setLoading(false);
      });
    }
  }, [isOpen, products, sales, result, loading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Style A Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
           <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 text-white rounded-xl">
                 <Sparkles className="w-5 h-5" />
              </div>
              <div>
                 <h3 className="text-xl font-bold text-slate-900">AI Inventory Insights</h3>
                 <p className="text-slate-500 text-sm font-medium">Smart analysis powered by Gemini 2.5</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-6 h-6" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
           {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                 <Loader2 className="w-12 h-12 text-slate-900 animate-spin mb-4" />
                 <h4 className="text-lg font-bold text-slate-800">Analyzing Inventory Data...</h4>
                 <p className="text-slate-500 text-sm">Identifying trends, shortages, and opportunities.</p>
              </div>
           ) : !result ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                 <div className="bg-red-50 p-4 rounded-full mb-3">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                 </div>
                 <p className="font-bold text-slate-700">Analysis Unavailable</p>
                 <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">Unable to generate insights at this time. Please check your API key configuration.</p>
              </div>
           ) : (
              <div className="space-y-8 pb-8">
                 
                 {/* Reorders */}
                 <section>
                    <div className="flex items-center gap-2 mb-4">
                       <RefreshCw className="w-5 h-5 text-blue-600" />
                       <h4 className="text-lg font-bold text-slate-800">Restock Recommendations</h4>
                    </div>
                    {result.reorders.length === 0 ? (
                       <p className="text-sm text-slate-500 italic ml-7">No critical stock levels detected.</p>
                    ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {result.reorders.map((item, idx) => (
                             <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.priority === 'High' ? 'bg-red-500' : item.priority === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                                <div className="pl-3">
                                   <div className="flex justify-between items-start mb-1">
                                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${item.priority === 'High' ? 'bg-red-50 text-red-700' : item.priority === 'Medium' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                                         {item.priority} Priority
                                      </span>
                                      <span className="text-xs text-slate-400 font-mono">Current: {item.currentStock}</span>
                                   </div>
                                   <h5 className="font-bold text-slate-800 text-sm truncate" title={item.productName}>{item.productName}</h5>
                                   <div className="flex items-center text-sm font-bold text-slate-700 mt-2 bg-slate-50 p-2 rounded-lg w-fit">
                                      <ArrowRight className="w-4 h-4 mr-2 text-green-600" /> 
                                      Order +{item.suggestedReorderQty}
                                   </div>
                                   <p className="text-xs text-slate-500 mt-3 leading-relaxed border-t border-slate-50 pt-2">
                                      {item.reasoning}
                                   </p>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </section>

                 {/* New Product Opportunities */}
                 <section>
                    <div className="flex items-center gap-2 mb-4">
                       <TrendingUp className="w-5 h-5 text-green-600" />
                       <h4 className="text-lg font-bold text-slate-800">New Product Opportunities</h4>
                    </div>
                    {result.newProducts.length === 0 ? (
                       <p className="text-sm text-slate-500 italic ml-7">No gaps identified in catalog.</p>
                    ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {result.newProducts.map((prod, idx) => (
                             <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                   <div className="bg-green-50 text-green-700 p-2 rounded-lg">
                                      <PackagePlus className="w-5 h-5" />
                                   </div>
                                   <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                      {prod.categoryName}
                                   </span>
                                </div>
                                <h5 className="font-bold text-slate-800 mb-1">{prod.name}</h5>
                                <p className="text-sm font-medium text-slate-600 mb-3">Est. Price: {formatPrice(prod.estimatedPrice)}</p>
                                <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                                   "{prod.reasoning}"
                                </p>
                             </div>
                          ))}
                       </div>
                    )}
                 </section>

                 {/* Bundles */}
                 <section>
                    <div className="flex items-center gap-2 mb-4">
                       <Layers className="w-5 h-5 text-purple-600" />
                       <h4 className="text-lg font-bold text-slate-800">Recommended Bundles</h4>
                    </div>
                    {result.bundles.length === 0 ? (
                       <p className="text-sm text-slate-500 italic ml-7">Not enough sales data for bundle analysis.</p>
                    ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.bundles.map((b, idx) => (
                             <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 hover:shadow-md transition-shadow">
                                <div className="flex-1">
                                   <h5 className="font-bold text-slate-900 text-lg mb-1">{b.bundleName}</h5>
                                   <div className="flex flex-wrap gap-2 mb-3">
                                      {b.components.map((c, i) => (
                                         <span key={i} className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 uppercase">
                                            {c}
                                         </span>
                                      ))}
                                   </div>
                                   <p className="text-xs text-slate-500 italic mb-2">"{b.reasoning}"</p>
                                   <div className="flex items-center text-xs font-medium text-slate-400">
                                      Target: {b.targetAudience}
                                   </div>
                                </div>
                                <div className="flex flex-col justify-center items-end border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 min-w-[100px]">
                                   <span className="text-xs text-slate-400 uppercase font-bold mb-1">Bundle Price</span>
                                   <span className="text-xl font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                                      {formatPrice(b.estimatedPrice)}
                                   </span>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </section>
              </div>
           )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
           <button onClick={onClose} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
              Close Insights
           </button>
        </div>
      </div>
    </div>
  );
};
