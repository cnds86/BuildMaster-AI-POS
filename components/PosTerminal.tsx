import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem, Category, EstimateResultItem, SystemSettings, Customer, Sale } from '../types';
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Sparkles, Box, 
  ArrowLeft, ScanBarcode, Layers, User, X, Percent, Star, QrCode, ArrowRight, Printer, CheckCircle, FileText,
  Monitor
} from 'lucide-react';
import { AiAssistant } from './AiAssistant';
import { useGlobal } from '../context/GlobalContext';
import { useCartStore } from '../store/useCartStore';

interface PosTerminalProps {
  products: Product[];
  onProcessSale: (
    items: CartItem[], 
    total: number, 
    customerId?: string, 
    discountAmount?: number, 
    subtotal?: number,
    paymentMethod?: 'cash' | 'card' | 'transfer' | 'qr' | 'credit',
    amountReceived?: number,
    change?: number
  ) => Promise<Sale>;
  settings?: SystemSettings;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({ products, onProcessSale, settings }) => {
  const { customers, customerLevels, t, promotions } = useGlobal();
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart } = useCartStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout & Payment State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'qr' | 'credit'>('cash');
  const [receivedAmountStr, setReceivedAmountStr] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Receipt State
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // --- Calculations ---
  const customerLevel = useMemo(() => {
    if (!selectedCustomer?.levelId) return null;
    return customerLevels.find(l => l.id === selectedCustomer.levelId);
  }, [selectedCustomer, customerLevels]);

  const rawSubtotal = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
  
  // 1. Apply Discount
  let discountAmount = 0;
  let discountedSubtotal = rawSubtotal;
  
  if (customerLevel && customerLevel.discountPercentage > 0) {
    discountAmount = rawSubtotal * (customerLevel.discountPercentage / 100);
    discountedSubtotal = rawSubtotal - discountAmount;
  }

  // 2. Apply Tax
  let taxAmount = 0;
  let finalTotal = discountedSubtotal;
  const taxConfig = settings?.tax;

  if (taxConfig && taxConfig.enabled) {
    const rate = taxConfig.rate / 100;
    if (taxConfig.calculationMode === 'excluded') {
       // Tax added on top of discounted price
       taxAmount = discountedSubtotal * rate;
       finalTotal = discountedSubtotal + taxAmount;
    } else {
       // Tax included in price, back-calculate from discounted price
       taxAmount = discountedSubtotal - (discountedSubtotal / (1 + rate));
       // Subtotal for display is usually net of tax in this case
       // But keeping simple logic: finalTotal IS the discounted price
       finalTotal = discountedSubtotal;
    }
  }

  const receivedAmount = parseFloat(receivedAmountStr) || 0;
  
  // For Cash: Change = Received - Total
  // For Credit: Remaining Debt = Total - Received (Deposit)
  const change = Math.max(0, receivedAmount - finalTotal);
  const remainingCash = Math.max(0, finalTotal - receivedAmount);
  const remainingDebt = Math.max(0, finalTotal - receivedAmount);

  // --- Broadcast Channel for Customer Display ---
  useEffect(() => {
    if (settings?.customerDisplay?.enabled) {
      const channel = new BroadcastChannel('customer_display_channel');
      
      const activePromotions = promotions?.filter(p => p.isActive) || [];

      const payload = {
        type: isCheckoutOpen ? 'CHECKOUT' : (cart.length === 0 ? 'RESET' : 'UPDATE'),
        cart: cart,
        subtotal: rawSubtotal,
        discount: discountAmount,
        tax: taxAmount,
        total: finalTotal,
        customer: selectedCustomer,
        paymentMethod: paymentMethod,
        amountReceived: receivedAmount,
        change: change,
        companyName: settings?.companyName,
        settings: settings?.customerDisplay,
        activePromotions: activePromotions // Send active ads
      };

      channel.postMessage(payload);

      return () => {
        channel.close();
      };
    }
  }, [cart, rawSubtotal, discountAmount, taxAmount, finalTotal, selectedCustomer, isCheckoutOpen, paymentMethod, receivedAmount, change, settings, promotions]);

  const handleOpenCustomerDisplay = () => {
    window.open('/customer-display', 'CustomerDisplay', 'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no');
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const searchLower = searchTerm.toLowerCase();
      const matchesMain = 
        p.name.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower) ||
        p.barcode?.includes(searchLower);
      
      const matchesVariant = p.variants && p.variants.some(v => 
        v.code.toLowerCase().includes(searchLower) ||
        v.barcode.includes(searchLower)
      );
      
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return (matchesMain || matchesVariant) && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.phone.includes(customerSearch) ||
      c.code.toLowerCase().includes(customerSearch.toLowerCase())
    );
  }, [customers, customerSearch]);

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) return;

    const mainMatch = products.find(p => p.barcode === searchTerm || p.sku === searchTerm);
    if (mainMatch) {
      addToCart(mainMatch, 1, undefined);
      setSearchTerm(''); 
      return;
    }

    for (const p of products) {
      if (p.variants) {
        const variantMatch = p.variants.find(v => v.barcode === searchTerm || v.code === searchTerm);
        if (variantMatch) {
          addToCart(p, 1, variantMatch.id);
          setSearchTerm('');
          return;
        }
      }
    }
  };

  const handleAiItemsAdded = (items: EstimateResultItem[]) => {
    items.forEach(est => {
      if (est.matchedProductId) {
        const product = products.find(p => p.id === est.matchedProductId);
        if (product) {
          addToCart(product, Math.ceil(est.estimatedQuantity), undefined);
        }
      }
    });
  };

  const handleCheckoutClick = () => {
    setReceivedAmountStr('');
    setPaymentMethod('cash');
    setIsCheckoutOpen(true);
  };

  const handlePaymentMethodChange = (method: 'cash' | 'card' | 'transfer' | 'qr' | 'credit') => {
    if (method === 'credit' && !selectedCustomer) {
      alert("Please select a customer first to use Credit/Debt.");
      return;
    }
    setPaymentMethod(method);
    setReceivedAmountStr(''); // Reset input on method switch
  };

  const handleProcessPayment = async () => {
    if (paymentMethod === 'cash' && receivedAmount < finalTotal) {
      alert("Insufficient amount received!");
      return;
    }

    if (paymentMethod === 'credit') {
        if (!selectedCustomer) {
            alert("Credit payment requires a registered customer!");
            return;
        }
        if (receivedAmount > finalTotal) {
            alert("Deposit cannot be more than the total amount.");
            return;
        }
    }

    setIsProcessing(true);
    
    // For non-cash methods, assume full payment unless credit
    let finalReceived = 0;
    let finalChange = 0;

    if (paymentMethod === 'cash') {
        finalReceived = receivedAmount;
        finalChange = change;
    } else if (paymentMethod === 'credit') {
        finalReceived = receivedAmount; // Can be 0 or deposit
        finalChange = 0;
    } else {
        finalReceived = finalTotal;
        finalChange = 0;
    }

    try {
      const sale = await onProcessSale(
        cart, 
        finalTotal, 
        selectedCustomer?.id, 
        discountAmount, 
        rawSubtotal,
        paymentMethod,
        finalReceived,
        finalChange
      );
      
      // Notify Customer Display of Success
      if (settings?.customerDisplay?.enabled) {
        const channel = new BroadcastChannel('customer_display_channel');
        channel.postMessage({
          type: 'SUCCESS',
          total: finalTotal,
          change: finalChange,
          paymentMethod: paymentMethod,
          companyName: settings?.companyName
        });
        setTimeout(() => channel.close(), 100);
      }

      setLastSale(sale);
      setIsCheckoutOpen(false);
      clearCart();
      setSelectedCustomer(null);
      setIsReceiptOpen(true);
    } catch (error) {
      console.error("Sale failed", error);
      alert("Transaction failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNumPadClick = (val: string) => {
    if (val === 'C') {
      setReceivedAmountStr('');
    } else if (val === 'BS') {
      setReceivedAmountStr(prev => prev.slice(0, -1));
    } else if (val === '.') {
      if (!receivedAmountStr.includes('.')) {
        setReceivedAmountStr(prev => (prev === '' ? '0' : prev) + '.');
      }
    } else {
      setReceivedAmountStr(prev => {
        if (prev === '0') return val; // Prevent leading zeros like "01", "05"
        return prev + val;
      });
    }
  };

  const handleQuickCash = (amount: number) => {
    setReceivedAmountStr(amount.toString());
  };

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 relative">
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">{t('pos.newOrder')}</h2>
          <div className="flex space-x-2">
             {settings?.customerDisplay?.enabled && (
               <button 
                 onClick={handleOpenCustomerDisplay}
                 className="flex items-center px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors shadow-sm text-sm font-medium"
                 title="Open Customer Facing Display"
               >
                 <Monitor className="w-4 h-4 mr-2" />
                 <span className="hidden xl:inline">Customer Screen</span>
               </button>
             )}
             <button 
              onClick={() => setIsCustomerModalOpen(true)}
              className={`flex items-center px-4 py-2 rounded-lg shadow-sm transition-all duration-200 font-medium text-sm border ${
                selectedCustomer 
                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              {selectedCustomer ? (
                <span className="flex items-center">
                  {selectedCustomer.name}
                  {customerLevel && (
                    <span className="ml-2 flex items-center bg-white/50 px-1.5 py-0.5 rounded text-[10px] border border-blue-200">
                      <Star className="w-3 h-3 mr-1 fill-current text-yellow-500" />
                      {customerLevel.name}
                    </span>
                  )}
                </span>
              ) : t('pos.selectCustomer')}
            </button>
            <button 
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">{t('pos.aiEstimate')}</span>
              <span className="md:hidden">AI</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 space-y-4">
          <form onSubmit={handleBarcodeScan} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('pos.scanPlaceholder')}
              className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700 bg-slate-50 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-slate-200 rounded text-slate-600 hover:bg-slate-300">
               <ScanBarcode className="w-4 h-4" />
            </button>
          </form>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                selectedCategory === 'all' 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t('pos.allItems')}
            </button>
            {Object.values(Category).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  selectedCategory === cat 
                    ? 'bg-construction-orange text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Box className="w-12 h-12 mb-4 opacity-50" />
              <p>No products found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 md:pb-0">
              {filteredProducts.map((product) => {
                const hasVariants = product.variants && product.variants.length > 0;
                
                return (
                  <div 
                    key={product.id} 
                    onClick={() => !hasVariants && addToCart(product)}
                    className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col ${!hasVariants ? 'cursor-pointer' : ''}`}
                  >
                    <div className="h-32 bg-slate-100 relative overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Box className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-slate-700 shadow-sm">
                        {product.stock} {product.unit}
                      </div>
                      {product.sku && (
                         <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white font-mono">
                           {product.sku}
                         </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-slate-800 line-clamp-2 text-sm mb-1">{product.name}</h3>
                      <p className="text-xs text-slate-500 mb-3 line-clamp-1">{product.category}</p>
                      
                      <div className="mt-auto">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-lg font-bold text-primary-600">${product.price.toFixed(2)}</span>
                        </div>
                        
                        {hasVariants ? (
                          <div className="space-y-1">
                             <button
                                onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                                className="w-full py-1.5 bg-slate-100 text-slate-700 rounded text-xs font-medium hover:bg-slate-200 transition-colors flex justify-between px-3"
                              >
                                <span>{product.unit}</span>
                                <span>${product.price}</span>
                              </button>
                             {product.variants!.map(v => (
                               <button
                                key={v.id}
                                onClick={(e) => { e.stopPropagation(); addToCart(product, 1, v.id); }}
                                className="w-full py-1.5 bg-orange-50 text-orange-700 rounded text-xs font-medium hover:bg-orange-100 transition-colors flex justify-between px-3"
                              >
                                <span>{v.name}</span>
                                <span>${v.price}</span>
                              </button>
                             ))}
                          </div>
                        ) : (
                          <button className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors flex items-center justify-center">
                            <Plus className="w-4 h-4 mr-1" /> {t('common.add')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {cartItemCount > 0 && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="lg:hidden fixed bottom-4 right-4 left-4 bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex justify-between items-center z-30"
        >
          <div className="flex items-center">
            <div className="bg-orange-500 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-3">
              {cartItemCount}
            </div>
            <span className="font-bold">{t('pos.viewCart')}</span>
          </div>
          <span className="font-bold text-lg">${finalTotal.toFixed(2)}</span>
        </button>
      )}

      <div className={`
        fixed inset-y-0 right-0 z-40 w-full md:w-[400px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:shadow-none lg:w-[380px] lg:border-l lg:border-slate-200 flex flex-col
        ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center">
            <ShoppingCart className="w-5 h-5 text-slate-700 mr-2" />
            <h3 className="font-bold text-slate-800 text-lg">{t('pos.currentOrder')}</h3>
          </div>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-200 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="hidden lg:block bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs font-bold">
            {cartItemCount} {t('common.items')}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <ShoppingCart className="w-16 h-16 opacity-20" />
              <p className="text-sm font-medium">{t('pos.emptyCart')}</p>
              <p className="text-xs text-center max-w-[200px]">{t('pos.emptyCartDesc')}</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={`${item.id}-${item.selectedVariantId || 'main'}`} className="flex items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm animate-fade-in">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
                  <div className="flex items-center text-xs text-slate-500 mt-1">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded mr-2">{item.sellUnit}</span>
                    <span>${item.sellPrice.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 mx-3">
                  <button 
                    onClick={() => updateQuantity(index, -1)}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold text-slate-800 w-6 text-center text-sm">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(index, 1)}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right min-w-[60px]">
                  <p className="font-bold text-slate-800 text-sm">${(item.sellPrice * item.quantity).toFixed(2)}</p>
                  <button 
                    onClick={() => removeFromCart(index)}
                    className="text-xs text-red-400 hover:text-red-600 mt-1"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-3">
          {selectedCustomer && (
             <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900 mb-2">
                <div className="flex items-center">
                   <User className="w-4 h-4 mr-2 text-blue-600" />
                   <div>
                      <span className="font-bold block">{selectedCustomer.name}</span>
                      {customerLevel && (
                        <span className="text-xs text-blue-600 flex items-center">
                           <Star className="w-3 h-3 mr-1 fill-current" />
                           {customerLevel.name} ({customerLevel.discountPercentage}% Off)
                        </span>
                      )}
                   </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="text-blue-400 hover:text-blue-600">
                   <X className="w-4 h-4" />
                </button>
             </div>
          )}

          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>{t('pos.subtotal')}</span>
              <span>${rawSubtotal.toFixed(2)}</span>
            </div>
            
            {discountAmount > 0 && (
               <div className="flex justify-between text-green-600 font-medium">
                 <span className="flex items-center"><Percent className="w-3 h-3 mr-1" /> Discount ({customerLevel?.discountPercentage}%)</span>
                 <span>-${discountAmount.toFixed(2)}</span>
               </div>
            )}

            {taxConfig?.enabled && (
              <div className="flex justify-between text-slate-500">
                <span>{t('pos.tax')} ({taxConfig.rate}%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-end pt-3 border-t border-slate-200">
            <span className="text-slate-800 font-bold">{t('common.total')}</span>
            <span className="text-3xl font-bold text-slate-900">${finalTotal.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              disabled={cart.length === 0}
              onClick={handleCheckoutClick}
              className="col-span-2 py-3 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Banknote className="w-5 h-5 mr-2" />
              {t('pos.payCash')}
            </button>
          </div>
        </div>
      </div>

      <AiAssistant 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)}
        inventory={products}
        onAddItemsToCart={handleAiItemsAdded}
      />

      {/* Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                 <h3 className="font-bold text-slate-800">{t('pos.selectCustomer')}</h3>
                 <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <div className="p-4">
                 <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                    <input
                       type="text"
                       placeholder={t('common.search')}
                       className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                       value={customerSearch}
                       onChange={e => setCustomerSearch(e.target.value)}
                       autoFocus
                    />
                 </div>
                 <div className="space-y-2 overflow-y-auto max-h-[400px]">
                    {filteredCustomers.map(cust => {
                       const level = customerLevels.find(l => l.id === cust.levelId);
                       return (
                          <button
                             key={cust.id}
                             onClick={() => {
                                setSelectedCustomer(cust);
                                setIsCustomerModalOpen(false);
                             }}
                             className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-colors text-left group"
                          >
                             <div>
                                <div className="font-bold text-slate-800 group-hover:text-blue-700">{cust.name}</div>
                                <div className="text-xs text-slate-500">{cust.code} • {cust.phone}</div>
                             </div>
                             <div className="flex flex-col items-end">
                                {level && (
                                   <span 
                                      className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full mb-1 shadow-sm"
                                      style={{ backgroundColor: level.color || '#94a3b8' }}
                                   >
                                      {level.name}
                                   </span>
                                )}
                                {cust.loyaltyPoints > 0 && (
                                   <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100">
                                      {cust.loyaltyPoints} pts
                                   </span>
                                )}
                             </div>
                          </button>
                       );
                    })}
                    {filteredCustomers.length === 0 && (
                       <div className="text-center py-8 text-slate-400">
                          No customers found.
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden h-[80vh] md:h-[600px]">
            {/* Left: Payment Method Selection */}
            <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 p-6 flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Payment Method</h3>
              <div className="space-y-3 flex-1 overflow-y-auto">
                <button
                  onClick={() => handlePaymentMethodChange('cash')}
                  className={`w-full flex items-center p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'cash' 
                      ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md' 
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Banknote className="w-6 h-6 mr-3" />
                  <span className="font-bold text-lg">Cash</span>
                </button>
                <button
                  onClick={() => handlePaymentMethodChange('qr')}
                  className={`w-full flex items-center p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'qr' 
                      ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md' 
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <QrCode className="w-6 h-6 mr-3" />
                  <span className="font-bold text-lg">OnePay / QR</span>
                </button>
                <button
                  onClick={() => handlePaymentMethodChange('card')}
                  className={`w-full flex items-center p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'card' 
                      ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md' 
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="w-6 h-6 mr-3" />
                  <span className="font-bold text-lg">Card / Transfer</span>
                </button>
                <button
                  onClick={() => handlePaymentMethodChange('credit')}
                  className={`w-full flex items-center p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'credit' 
                      ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md' 
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  } ${!selectedCustomer ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FileText className="w-6 h-6 mr-3" />
                  <div className="text-left">
                     <span className="font-bold text-lg block">Credit / ຕິດໜີ້</span>
                     <span className="text-xs text-slate-500">Members Only</span>
                  </div>
                </button>
              </div>
              <div className="pt-6 border-t border-slate-200">
                <div className="flex justify-between items-center text-slate-600 mb-2">
                  <span>Total Due</span>
                  <span className="font-bold text-xl">${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Right: Payment Details & Numpad */}
            <div className="flex-1 p-6 flex flex-col relative">
              <button 
                onClick={() => setIsCheckoutOpen(false)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-xl font-bold text-slate-800 mb-6">
                {paymentMethod === 'cash' ? 'Cash Payment' : 
                 paymentMethod === 'qr' ? 'Scan QR Code' : 
                 paymentMethod === 'credit' ? 'Credit Sale (Pay Later)' :
                 'Card Payment'}
              </h3>

              {paymentMethod === 'cash' ? (
                <div className="flex-1 flex flex-col">
                  {/* Amount Input Display */}
                  <div className="bg-slate-100 p-4 rounded-xl mb-4 text-right border border-slate-200">
                    <p className="text-sm text-slate-500 mb-1">Amount Received</p>
                    <div className="text-4xl font-bold text-slate-800 tracking-tight">
                      {receivedAmountStr ? `$${receivedAmountStr}` : <span className="text-slate-300">$0.00</span>}
                    </div>
                  </div>

                  {/* Change Calculation */}
                  <div className="flex justify-between items-center mb-6 px-2">
                    <div>
                      <p className="text-sm text-slate-500">Change Due</p>
                      <p className={`text-2xl font-bold ${change > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                        ${change.toFixed(2)}
                      </p>
                    </div>
                    {remainingCash > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Remaining</p>
                        <p className="text-xl font-bold text-red-500">${remainingCash.toFixed(2)}</p>
                      </div>
                    )}
                  </div>

                  {/* Numpad & Quick Cash */}
                  <div className="flex gap-4 flex-1">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'BS'].map((num) => (
                        <button
                          key={num}
                          onClick={() => handleNumPadClick(num.toString())}
                          className="bg-white border border-slate-200 rounded-lg text-xl font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm flex items-center justify-center"
                        >
                          {num === 'BS' ? <ArrowLeft className="w-6 h-6" /> : num}
                        </button>
                      ))}
                    </div>
                    <div className="w-1/3 flex flex-col gap-3">
                      <button onClick={() => handleQuickCash(Math.ceil(finalTotal))} className="flex-1 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 border border-blue-100 transition-colors">Exact</button>
                      <button onClick={() => handleQuickCash(10)} className="flex-1 bg-white text-slate-600 font-bold rounded-lg border border-slate-200 hover:bg-slate-50">$10</button>
                      <button onClick={() => handleQuickCash(20)} className="flex-1 bg-white text-slate-600 font-bold rounded-lg border border-slate-200 hover:bg-slate-50">$20</button>
                      <button onClick={() => handleQuickCash(50)} className="flex-1 bg-white text-slate-600 font-bold rounded-lg border border-slate-200 hover:bg-slate-50">$50</button>
                      <button onClick={() => handleQuickCash(100)} className="flex-1 bg-white text-slate-600 font-bold rounded-lg border border-slate-200 hover:bg-slate-50">$100</button>
                    </div>
                  </div>
                </div>
              ) : paymentMethod === 'qr' ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm mb-4">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Payment_OnePay_${finalTotal}`} 
                      alt="Payment QR" 
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  <p className="font-bold text-slate-800 text-lg">Scan to Pay ${finalTotal.toFixed(2)}</p>
                  <p className="text-slate-500 text-sm mt-2">Use OnePay or compatible banking app</p>
                </div>
              ) : paymentMethod === 'credit' ? (
                 <div className="flex-1 flex flex-col">
                    <div className="bg-orange-50 p-4 rounded-xl mb-4 border border-orange-100 flex justify-between items-center">
                       <div>
                          <p className="text-xs text-orange-700 font-bold uppercase mb-1">Customer</p>
                          <p className="font-bold text-slate-800">{selectedCustomer?.name}</p>
                       </div>
                       <User className="w-5 h-5 text-orange-400" />
                    </div>

                    <div className="bg-white p-4 rounded-xl mb-4 text-right border border-slate-200">
                       <p className="text-sm text-slate-500 mb-1">Initial Deposit / Pay Now</p>
                       <div className="text-4xl font-bold text-slate-800 tracking-tight">
                          ${receivedAmountStr || '0'}
                       </div>
                    </div>

                    <div className="flex justify-between items-center mb-6 px-2">
                       <div>
                          <p className="text-sm text-slate-500">Total Bill</p>
                          <p className="text-lg font-bold text-slate-800">${finalTotal.toFixed(2)}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-sm text-slate-500">Remaining Debt</p>
                          <p className="text-xl font-bold text-red-600">${remainingDebt.toFixed(2)}</p>
                       </div>
                    </div>

                    {/* Numpad for Deposit */}
                    <div className="flex gap-4 flex-1">
                       <div className="flex-1 grid grid-cols-3 gap-3">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'BS'].map((num) => (
                             <button
                                key={num}
                                onClick={() => handleNumPadClick(num.toString())}
                                className="bg-white border border-slate-200 rounded-lg text-xl font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm flex items-center justify-center"
                             >
                                {num === 'BS' ? <ArrowLeft className="w-6 h-6" /> : num}
                             </button>
                          ))}
                       </div>
                       <div className="w-1/3 flex flex-col gap-3">
                          <button onClick={() => setReceivedAmountStr('0')} className="flex-1 bg-white text-slate-600 font-bold rounded-lg border border-slate-200 hover:bg-slate-50">No Deposit</button>
                          <button onClick={() => handleQuickCash(Math.ceil(finalTotal * 0.1))} className="flex-1 bg-white text-slate-600 font-bold rounded-lg border border-slate-200 hover:bg-slate-50">10%</button>
                          <button onClick={() => handleQuickCash(Math.ceil(finalTotal * 0.5))} className="flex-1 bg-white text-slate-600 font-bold rounded-lg border border-slate-200 hover:bg-slate-50">50%</button>
                       </div>
                    </div>
                 </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-2">
                    <CreditCard className="w-12 h-12" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800">Ready for Card Payment</h4>
                  <p className="text-slate-500 max-w-xs">Please insert or swipe card on the terminal. Ensure the amount <strong className="text-slate-800">${finalTotal.toFixed(2)}</strong> is correct.</p>
                </div>
              )}

              <button
                onClick={handleProcessPayment}
                disabled={isProcessing || (paymentMethod === 'cash' && receivedAmount < finalTotal) || (paymentMethod === 'credit' && receivedAmount > finalTotal)}
                className={`w-full py-4 mt-6 text-white rounded-xl font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center ${
                   paymentMethod === 'credit' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center"><Sparkles className="w-5 h-5 animate-spin mr-2" /> Processing...</span>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6 mr-2" /> 
                    {paymentMethod === 'cash' && change > 0 
                      ? `Confirm & Return $${change.toFixed(2)}` 
                      : paymentMethod === 'credit' 
                        ? `Confirm Debt $${remainingDebt.toFixed(2)}`
                        : `Confirm Payment $${finalTotal.toFixed(2)}`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {isReceiptOpen && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-green-400" /> Sale Completed</h3>
              <button onClick={() => setIsReceiptOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            {/* Receipt Preview */}
            <div className="p-6 bg-slate-50 flex-1 overflow-y-auto max-h-[60vh]">
              <div className="bg-white p-4 shadow-sm border border-slate-200 text-xs font-mono text-slate-700">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold text-slate-900 mb-1">{settings?.companyName || 'BuildMaster Store'}</h2>
                  <p>{settings?.address || '123 Main St'}</p>
                  <p>Tel: {settings?.phone || '012-345-6789'}</p>
                  <p className="mt-2 text-slate-500">#{lastSale.id}</p>
                  <p>{new Date(lastSale.date).toLocaleString()}</p>
                </div>
                
                <div className="border-b border-dashed border-slate-300 my-2"></div>
                
                <div className="space-y-1 mb-2">
                  {lastSale.items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="truncate w-32">{item.name}</span>
                      <span className="text-right">
                        {item.quantity} x {item.sellPrice.toFixed(2)}
                      </span>
                      <span className="font-bold text-right w-16">
                        {(item.quantity * item.sellPrice).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="border-b border-dashed border-slate-300 my-2"></div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${(lastSale.subtotal || lastSale.total).toFixed(2)}</span>
                  </div>
                  {lastSale.discountAmount ? (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${lastSale.discountAmount.toFixed(2)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between font-bold text-sm mt-1 pt-1 border-t border-slate-100">
                    <span>Total</span>
                    <span>${lastSale.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-b border-dashed border-slate-300 my-3"></div>

                <div className="space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span className="capitalize">Paid via {lastSale.paymentMethod}</span>
                    <span>${(lastSale.amountReceived && lastSale.amountReceived > 0 ? lastSale.amountReceived : 0).toFixed(2)}</span>
                  </div>
                  
                  {(lastSale.paymentStatus === 'unpaid' || lastSale.paymentStatus === 'partial') && (
                     <>
                        <div className="flex justify-between font-bold text-red-600 mt-1">
                           <span>Balance Due</span>
                           <span>${(lastSale.remainingAmount || 0).toFixed(2)}</span>
                        </div>
                     </>
                  )}

                  {lastSale.change !== undefined && lastSale.change > 0 && (
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Change</span>
                      <span>${lastSale.change.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 text-center text-slate-400 italic">
                  Thank you for shopping!
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => window.print()}
                className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 flex items-center justify-center transition-colors"
              >
                <Printer className="w-5 h-5 mr-2" /> Print
              </button>
              <button 
                onClick={() => setIsReceiptOpen(false)}
                className="flex-1 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 flex items-center justify-center transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" /> New Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
