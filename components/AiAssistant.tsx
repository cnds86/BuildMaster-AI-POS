
import React, { useState } from 'react';
import { Bot, X, Loader2, Calculator, Check, ShoppingCart, Info, AlertTriangle, Plus, CheckSquare, Square } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Project Estimator</h3>
              <p className="text-slate-400 text-sm">Describe your project, get a material list.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-6">
            {!estimate && (
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-800 mb-2">
                   What are you building?
                </label>
                <div className="relative">
                   <textarea
                     value={query}
                     onChange={(e) => setQuery(e.target.value)}
                     placeholder="Examples:&#10;- Build a 3x4m brick wall, 2m high&#10;- Pour a concrete slab 5m x 5m x 10cm&#10;- Paint a living room 40 sqm with 2 coats of white paint"
                     className="w-full h-40 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-slate-700 placeholder:text-slate-400 text-base shadow-sm"
                     autoFocus
                   />
                   <div className="absolute bottom-3 right-3 text-xs text-slate-400 bg-white/80 px-2 py-1 rounded">
                      Powered by Gemini AI
                   </div>
                </div>
                
                <div className="mt-4 flex gap-3">
                   <div className="flex-1 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 mr-2 shrink-0" />
                      <p className="text-xs text-blue-800 leading-relaxed">
                         The AI will calculate quantities including a standard waste margin and attempt to match items with your current inventory.
                      </p>
                   </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                   <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Calculator className="w-6 h-6 text-indigo-600" />
                   </div>
                </div>
                <p className="text-slate-800 font-bold mt-6 text-lg">Analyzing Project...</p>
                <p className="text-slate-500 text-sm">Calculating dimensions and checking stock</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-4 flex items-start">
                <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {estimate && (
              <div className="space-y-4">
                 <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 flex items-center">
                     <Check className="w-5 h-5 mr-2 text-green-500" />
                     Estimated Materials
                  </h4>
                  <button 
                    onClick={() => { setEstimate(null); setQuery(''); }}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                  >
                    Start Over
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
                        className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                           isMatched 
                              ? (isSelected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-300')
                              : 'bg-slate-50 border-slate-200 opacity-70'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                           {/* Checkbox */}
                           <div className={`mt-1 ${!isMatched ? 'invisible' : ''}`}>
                              {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />}
                           </div>

                           <div className="flex-1">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <h5 className={`font-bold text-base ${isMatched ? 'text-slate-800' : 'text-slate-500'}`}>
                                       {item.productName}
                                    </h5>
                                    {!isMatched && (
                                       <span className="inline-block mt-1 text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                          Not in Stock
                                       </span>
                                    )}
                                 </div>
                                 <div className="text-right">
                                    <span className="block text-xl font-bold text-slate-900">
                                       {item.estimatedQuantity} <span className="text-sm font-medium text-slate-500">{item.unit}</span>
                                    </span>
                                 </div>
                              </div>
                              
                              <div className="mt-2 text-sm text-slate-500 bg-white/50 p-2 rounded border border-slate-100/50">
                                 <span className="font-semibold text-slate-600">Why:</span> {item.reasoning}
                              </div>
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
        <div className="p-4 border-t border-slate-200 bg-white flex justify-end space-x-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <button 
            onClick={onClose}
            className="px-5 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          {!estimate ? (
            <button
              onClick={handleEstimate}
              disabled={loading || !query.trim()}
              className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 font-bold shadow-md hover:shadow-lg transform active:scale-[0.98]"
            >
              {loading ? 'Calculating...' : <><Calculator className="w-5 h-5 mr-2" /> Calculate Estimate</>}
            </button>
          ) : (
            <button
              onClick={handleAddSelected}
              disabled={selectedItems.size === 0}
              className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold shadow-md hover:shadow-lg transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
