
import React, { useState } from 'react';
import { Bot, X, Loader2, Calculator, Check, ShoppingCart, Info, AlertTriangle, Plus, CheckSquare, Square, Hammer } from 'lucide-react';
import { EstimateResultItem, Product } from '../types';
import { getConstructionEstimate } from '../services/geminiService';

interface AiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: Product[];
  onAddItemsToCart: (items: EstimateResultItem[]) => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ isOpen, onClose, inventory, onAddItemsToCart }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResultItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const handleEstimate = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setEstimate(null);
    setSelectedItems(new Set());

    try {
      const result = await getConstructionEstimate(query, inventory);
      setEstimate(result);
      // Auto-select all matched items by default
      const allIndexes = result.map((_, idx) => idx);
      setSelectedItems(new Set(allIndexes));
    } catch (err) {
      setError("Failed to generate estimate. Please check your connection or API key.");
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (index: number) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedItems(newSet);
  };

  const handleAddSelected = () => {
    if (estimate) {
      const itemsToAdd = estimate.filter((_, idx) => selectedItems.has(idx));
      onAddItemsToCart(itemsToAdd);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[80] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg ring-1 ring-white/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">AI Construction Estimator</h3>
              <p className="text-slate-400 text-sm font-medium">Gemini 3 Powered • Construction Logic</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50 relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
             <Hammer className="w-64 h-64 text-slate-900" />
          </div>

          <div className="p-6 relative z-10">
            {!estimate && (
              <div className="mb-6 animate-fade-in">
                <label className="block text-base font-bold text-slate-800 mb-3">
                   Describe your construction project
                </label>
                <div className="relative group">
                   <textarea
                     value={query}
                     onChange={(e) => setQuery(e.target.value)}
                     placeholder="Examples:&#10;- Build a 4x3m brick wall, 2m high&#10;- Pour a concrete slab 5m x 5m x 10cm&#10;- Paint a living room 40 sqm with 2 coats"
                     className="w-full h-48 p-5 border border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 resize-none text-slate-700 placeholder:text-slate-400 text-lg shadow-sm transition-all"
                     autoFocus
                   />
                   <div className="absolute bottom-4 right-4 flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">Press Enter to skip lines</span>
                   </div>
                </div>
                
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 shrink-0" />
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                         AI calculates material quantities including <strong>5-10% waste margin</strong> and matches items to your current stock.
                      </p>
                   </div>
                   <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 mr-3 shrink-0" />
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                         Supports precise units (meters, sq meters, cubic meters) and local construction standards.
                      </p>
                   </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="relative">
                   <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Bot className="w-8 h-8 text-indigo-600 animate-pulse" />
                   </div>
                </div>
                <p className="text-slate-800 font-bold mt-8 text-xl">Analyzing Structure...</p>
                <p className="text-slate-500 text-sm mt-2">Calculating volumes & checking inventory</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-800 p-5 rounded-xl border border-red-200 mb-4 flex items-start shadow-sm animate-fade-in">
                <div className="bg-red-100 p-2 rounded-full mr-4">
                   <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                   <h4 className="font-bold text-red-900">Analysis Failed</h4>
                   <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {estimate && (
              <div className="space-y-5 animate-fade-in">
                 <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <h4 className="font-bold text-indigo-900 flex items-center text-lg">
                     <Calculator className="w-6 h-6 mr-3 text-indigo-600" />
                     Estimated Bill of Materials
                  </h4>
                  <button 
                    onClick={() => { setEstimate(null); setQuery(''); }}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-bold hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Start New Calculation
                  </button>
                </div>
                
                <div className="space-y-3">
                  {estimate.map((item, idx) => {
                    const isSelected = selectedItems.has(idx);
                    const isMatched = !!item.matchedProductId;

                    return (
                      <div 
                        key={idx} 
                        onClick={() => isMatched && toggleItemSelection(idx)}
                        className={`p-5 rounded-xl border-2 transition-all cursor-pointer relative group flex items-start gap-4 ${
                           isMatched 
                              ? (isSelected ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm')
                              : 'bg-slate-50 border-slate-200 opacity-60 grayscale'
                        }`}
                      >
                        {/* Selection Indicator */}
                        <div className={`mt-1 transition-transform duration-200 ${isSelected ? 'scale-110' : 'scale-100'} ${!isMatched ? 'invisible' : ''}`}>
                           {isSelected ? (
                              <div className="bg-indigo-600 rounded-lg p-1">
                                 <Check className="w-5 h-5 text-white" />
                              </div>
                           ) : (
                              <div className="border-2 border-slate-300 rounded-lg w-7 h-7 group-hover:border-indigo-400"></div>
                           )}
                        </div>

                        <div className="flex-1">
                           <div className="flex justify-between items-start mb-2">
                              <div>
                                 <h5 className={`font-bold text-lg ${isMatched ? 'text-slate-900' : 'text-slate-500'}`}>
                                    {item.productName}
                                 </h5>
                                 {!isMatched && (
                                    <span className="inline-flex items-center mt-1 text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                                       Out of Stock
                                    </span>
                                 )}
                              </div>
                              <div className="text-right bg-slate-100 px-3 py-1 rounded-lg">
                                 <span className="block text-xl font-black text-slate-900 leading-none">
                                    {item.estimatedQuantity}
                                 </span>
                                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.unit}</span>
                              </div>
                           </div>
                           
                           <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start">
                              <Info className="w-4 h-4 text-slate-400 mr-2 mt-0.5 shrink-0" />
                              <span className="italic">{item.reasoning}</span>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 bg-white flex justify-end space-x-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <button 
            onClick={onClose}
            className="px-6 py-3.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          {!estimate ? (
            <button
              onClick={handleEstimate}
              disabled={loading || !query.trim()}
              className="flex items-center px-8 py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 font-bold shadow-lg hover:shadow-xl transform active:scale-[0.98] disabled:transform-none"
            >
              {loading ? 'Processing...' : <><Calculator className="w-5 h-5 mr-2" /> Calculate Materials</>}
            </button>
          ) : (
            <button
              onClick={handleAddSelected}
              disabled={selectedItems.size === 0}
              className="flex items-center px-8 py-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg hover:shadow-xl hover:shadow-indigo-200 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add {selectedItems.size} Items to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
