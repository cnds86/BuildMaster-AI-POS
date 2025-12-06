import React, { useState } from 'react';
import { Bot, X, Loader2, Calculator, Check, ShoppingCart, Info, AlertTriangle } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleEstimate = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setEstimate(null);

    try {
      const result = await getConstructionEstimate(query, inventory);
      setEstimate(result);
    } catch (err) {
      setError("Failed to generate estimate. Please check your API key or connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAll = () => {
    if (estimate) {
      onAddItemsToCart(estimate);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-construction-orange rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Smart Material Estimator</h3>
              <p className="text-slate-400 text-sm">Powered by Gemini AI</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {!estimate && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Describe your project
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="E.g., I need to build a 10m long brick wall, 2m high. Or: Paint a 4x5m room with 2 coats."
                className="w-full h-32 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-slate-800"
              />
              <p className="mt-2 text-xs text-slate-500 flex items-center">
                <Info className="w-3 h-3 mr-1" />
                The AI will calculate quantities including a waste margin and match with store inventory.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
              <p className="text-slate-600 font-medium">Analyzing project requirements...</p>
              <p className="text-slate-400 text-sm">Calculating materials & quantities</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-4 flex items-start">
              <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {estimate && (
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-800">Estimated Materials</h4>
                <button 
                  onClick={() => setEstimate(null)}
                  className="text-sm text-primary-600 hover:underline"
                >
                  New Estimate
                </button>
              </div>
              
              <div className="border rounded-xl divide-y divide-slate-100">
                {estimate.map((item, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium text-slate-800">{item.productName}</span>
                          {item.matchedProductId ? (
                             <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full tracking-wide">
                               In Stock
                             </span>
                          ) : (
                            <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase rounded-full tracking-wide">
                               Recommendation
                             </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{item.reasoning}</p>
                      </div>
                      <div className="text-right">
                        <span className="block text-lg font-bold text-slate-900">
                          {item.estimatedQuantity} <span className="text-sm font-normal text-slate-500">{item.unit}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          {!estimate ? (
            <button
              onClick={handleEstimate}
              disabled={loading || !query.trim()}
              className="flex items-center px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium shadow-sm"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Estimate
            </button>
          ) : (
            <button
              onClick={handleAddAll}
              className="flex items-center px-5 py-2.5 bg-construction-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-sm"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add All to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};