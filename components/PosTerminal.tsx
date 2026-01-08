
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Product, CartItem, EstimateResultItem, SystemSettings, Customer, Sale, ProductVariant } from '../types';
import { Sparkles, User, ClipboardList, Monitor, Menu, ChevronLeft } from 'lucide-react';
import { AiAssistant } from './AiAssistant';
import { BarcodeScanner } from './BarcodeScanner';
import { useGlobal } from '../context/GlobalContext';
import { useCartStore } from '../store/useCartStore';

// Sub-components
import { ProductGrid } from './pos/ProductGrid';
import { CartSidebar } from './pos/CartSidebar';
import { CheckoutModal } from './pos/CheckoutModal';
import { ReceiptModal } from './pos/ReceiptModal';
import { CustomerModal } from './pos/CustomerModal';
import { DiscountModal } from './pos/DiscountModal';
import { RecallModal } from './pos/RecallModal';
import { VariantSelectorModal } from './pos/VariantSelectorModal';

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
    change?: number,
    pointsRedeemed?: number,
    source?: 'pos' | 'back-office'
  ) => Promise<Sale>;
  settings?: SystemSettings;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({ products, onProcessSale, settings }) => {
  const { customers, customerLevels, t, branches, warehouses, currentUser, formatPrice } = useGlobal();
  const { 
    cart, addToCart, clearCart,
    heldOrders, holdCurrentOrder, recallOrder, discardHeldOrder
  } = useCartStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false); 
  
  // Modal States
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [productForSelector, setProductForSelector] = useState<Product | null>(null);

  // Transaction State
  const [manualDiscount, setManualDiscount] = useState<{ type: 'percent' | 'fixed', value: number } | null>(null);
  const [redeemPoints, setRedeemPoints] = useState<number>(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Branch Logic (Inventory Filtering) ---
  const activeBranchId = settings?.currentBranchId || currentUser?.branchId || (branches.length > 0 ? branches[0].id : '');

  const branchProducts = useMemo(() => {
    if (!activeBranchId) return products;

    const branchWarehouseIds = warehouses
      .filter(w => w.branchId === activeBranchId)
      .map(w => w.id);

    return products.map(p => {
      const branchStock = p.warehouseInventory?.reduce((acc, inv) => {
        if (branchWarehouseIds.includes(inv.warehouseId)) {
          return acc + inv.quantity;
        }
        return acc;
      }, 0) || 0;

      const branchPriceConfig = p.branchPrices?.find(bp => bp.branchId === activeBranchId);
      const effectivePrice = branchPriceConfig ? branchPriceConfig.price : p.price;

      return {
        ...p,
        stock: branchStock,
        price: effectivePrice
      };
    });
  }, [products, activeBranchId, warehouses]);

  // --- Helper: Get Dynamic Price based on Customer Level ---
  const getDynamicPrice = (product: Product, variantId?: string): number => {
    // 1. Determine Base Price (Variant or Product)
    let basePrice = product.price;
    let tierPrices = product.tierPrices;

    if (variantId && product.variants) {
      const variant = product.variants.find(v => v.id === variantId);
      if (variant) {
        basePrice = variant.price;
        tierPrices = variant.tierPrices || product.tierPrices; // Fallback to product tiers if variant doesn't have specific ones
      }
    }

    if (!selectedCustomer?.levelId) return basePrice;

    // 2. Check Specific Tier Price
    if (tierPrices && tierPrices[selectedCustomer.levelId]) {
      return tierPrices[selectedCustomer.levelId];
    }

    // 3. Check Level Percentage Discount
    const level = customerLevels.find(l => l.id === selectedCustomer.levelId);
    if (level && level.discountPercentage > 0) {
      return basePrice * (1 - level.discountPercentage / 100);
    }

    return basePrice;
  };

  // --- Handlers ---
  const handleProductSelect = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      setProductForSelector(product);
    } else {
      // Calculate price immediately
      const price = getDynamicPrice(product);
      // We pass the calculated price by modifying the product temporarily or handling it in addToCart
      // Since addToCart in store recalculates based on static product data, we might need to override.
      // However, simplified approach: We inject the 'price' into a cart item before adding.
      // useCartStore's addToCart takes a product object. 
      addToCart({ ...product, price }, 1);
    }
  };

  const handleConfirmSelection = (product: Product, quantity: number, variantId?: string) => {
    const price = getDynamicPrice(product, variantId);
    addToCart({ ...product, price }, quantity, variantId);
    setProductForSelector(null);
  };

  // --- Calculations ---
  const customerLevel = useMemo(() => {
    if (!selectedCustomer?.levelId) return null;
    return customerLevels.find(l => l.id === selectedCustomer.levelId);
  }, [selectedCustomer, customerLevels]);

  const rawSubtotal = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
  
  // NOTE: If using Tier Pricing, customerDiscountAmount is logically 0 because the price is already adjusted.
  // Unless we want to apply ADDITIONAL discount on top of Tier Price.
  // Usually Tier Price replaces standard discount.
  // Strategy: If specific tier price was used for ALL items, discount % is 0.
  // But cart items store their sellPrice. 
  // Let's assume standard discount applies ONLY if manual discount is added or strict percentage. 
  // For simplicity here: disable global percentage discount calculation if we are already using dynamic pricing in cart items.
  // The 'getDynamicPrice' function already bakes the level discount into the item price.
  // So 'customerDiscountAmount' here effectively becomes 0 or just decorative if we don't want double discount.
  const customerDiscountAmount = 0; 

  let manualDiscountAmount = 0;
  if (manualDiscount) {
    if (manualDiscount.type === 'percent') {
      manualDiscountAmount = rawSubtotal * (manualDiscount.value / 100);
    } else {
      manualDiscountAmount = manualDiscount.value;
    }
  }

  const redeemRate = settings?.loyaltyProgram?.redeemRate || 100;
  const loyaltyDiscountAmount = redeemPoints > 0 ? redeemPoints / redeemRate : 0;

  let discountAmount = Math.min(customerDiscountAmount + manualDiscountAmount + loyaltyDiscountAmount, rawSubtotal);
  let discountedSubtotal = rawSubtotal - discountAmount;

  let taxAmount = 0;
  let finalTotal = discountedSubtotal;
  const taxConfig = settings?.tax;

  if (taxConfig && taxConfig.enabled) {
    const rate = taxConfig.rate / 100;
    if (taxConfig.calculationMode === 'excluded') {
       taxAmount = discountedSubtotal * rate;
       finalTotal = discountedSubtotal + taxAmount;
    } else {
       taxAmount = discountedSubtotal - (discountedSubtotal / (1 + rate));
       finalTotal = discountedSubtotal;
    }
  }

  // --- Broadcast Channel ---
  useEffect(() => {
    if (settings?.customerDisplay?.enabled) {
      const payload = {
        type: isCheckoutOpen ? 'CHECKOUT' : (cart.length === 0 ? 'RESET' : 'UPDATE'),
        cart,
        subtotal: rawSubtotal,
        discount: discountAmount,
        tax: taxAmount,
        total: finalTotal,
        customer: selectedCustomer,
        companyName: settings?.companyName,
        settings: settings?.customerDisplay
      };
      const channel = new BroadcastChannel('customer_display_channel');
      channel.postMessage(payload);
      return () => channel.close();
    }
  }, [cart, rawSubtotal, discountAmount, taxAmount, finalTotal, selectedCustomer, isCheckoutOpen, settings]);

  const handleOpenCustomerDisplay = () => {
    window.open('/customer-display', 'CustomerDisplay', 'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no');
  };

  useEffect(() => {
     setRedeemPoints(0);
  }, [selectedCustomer]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.key === 'F4') {
        e.preventDefault();
        setIsCustomerModalOpen(true);
      }
      else if (e.key === 'F6') {
        e.preventDefault();
        setIsRecallModalOpen(true);
      }
      else if (e.key === 'F8') {
        e.preventDefault();
        setIsDiscountModalOpen(true);
      }
      else if (e.key === 'F9') {
        e.preventDefault();
        const searchInput = document.getElementById('pos-search-input');
        if (searchInput) {
            searchInput.focus();
            (searchInput as HTMLInputElement).select();
        }
      }
      else if (e.key === 'F12' || (e.key === 'Enter' && e.ctrlKey)) {
        e.preventDefault();
        if (cart.length > 0 && !isCheckoutOpen && !isReceiptOpen) {
           setIsCheckoutOpen(true);
        }
      }
      else if (e.key === 'Escape') {
         if (isCheckoutOpen) setIsCheckoutOpen(false);
         else if (isDiscountModalOpen) setIsDiscountModalOpen(false);
         else if (isCustomerModalOpen) setIsCustomerModalOpen(false);
         else if (isRecallModalOpen) setIsRecallModalOpen(false);
         else if (isReceiptOpen) setIsReceiptOpen(false);
         else if (isAiModalOpen) setIsAiModalOpen(false);
         else if (isScannerOpen) setIsScannerOpen(false);
         else if (isCartOpen) setIsCartOpen(false);
         else if (productForSelector) setProductForSelector(null);
         else if (document.activeElement?.id === 'pos-search-input') {
            setSearchTerm('');
            (document.activeElement as HTMLInputElement).blur();
         }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    cart.length, 
    isCheckoutOpen, 
    isDiscountModalOpen, 
    isCustomerModalOpen, 
    isRecallModalOpen, 
    isReceiptOpen, 
    isAiModalOpen, 
    isScannerOpen,
    isCartOpen,
    productForSelector
  ]);

  const performScan = (code: string) => {
    const mainMatch = branchProducts.find(p => p.barcode === code || p.sku === code);
    if (mainMatch) {
      handleProductSelect(mainMatch);
      setSearchTerm(''); 
      return;
    }
    for (const p of branchProducts) {
      if (p.variants) {
        const variantMatch = p.variants.find(v => v.barcode === code || v.code === code);
        if (variantMatch) {
          const price = getDynamicPrice(p, variantMatch.id);
          addToCart({ ...p, price }, 1, variantMatch.id);
          setSearchTerm('');
          return;
        }
      }
    }
    alert(`Product not found: ${code}`);
  };

  const handleAiItemsAdded = (items: EstimateResultItem[]) => {
    items.forEach(est => {
      if (est.matchedProductId) {
        const product = branchProducts.find(p => p.id === est.matchedProductId);
        if (product) {
           const price = getDynamicPrice(product);
           addToCart({ ...product, price }, Math.ceil(est.estimatedQuantity), undefined);
        }
      }
    });
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    const note = prompt("Optional note for this hold:");
    holdCurrentOrder(selectedCustomer, note || undefined);
    setSelectedCustomer(null);
    setManualDiscount(null);
    setRedeemPoints(0);
  };

  const handleRecall = (orderId: string) => {
    const restored = recallOrder(orderId);
    if (restored) {
      setSelectedCustomer(restored.customer || null);
      setIsRecallModalOpen(false);
    }
  };

  const handleProcessPayment = async (
    method: 'cash' | 'card' | 'transfer' | 'qr' | 'credit',
    receivedAmount: number,
    change: number
  ) => {
    setIsProcessing(true);
    try {
      const sale = await onProcessSale(
        cart, finalTotal, selectedCustomer?.id, discountAmount, rawSubtotal,
        method, receivedAmount, change, redeemPoints, 'pos'
      );
      
      setLastSale(sale);
      setIsCheckoutOpen(false);
      clearCart();
      setManualDiscount(null); 
      setRedeemPoints(0);
      setSelectedCustomer(null);
      setIsReceiptOpen(true);
    } catch (error) {
      console.error("Sale failed", error);
      alert("Transaction failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const barcodeList = useMemo(() => products.map(p => p.barcode).filter(Boolean), [products]);

  // Inject current pricing for grid display
  const productsWithDisplayPrice = useMemo(() => {
     return branchProducts.map(p => {
        return {
           ...p,
           displayPrice: getDynamicPrice(p) // used for display in grid
        };
     });
  }, [branchProducts, selectedCustomer, customerLevels]);

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-white md:-m-6">
      {/* Main Product Area (Left Side) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative border-r border-slate-200">
        
        {/* Header / Top Bar for POS - Style A */}
        <div className="px-6 py-4 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-extrabold text-slate-900 hidden md:block">{t('pos.newOrder')}</h2>
            
            <div className="flex space-x-2">
               <button 
                 onClick={() => setIsRecallModalOpen(true)}
                 disabled={heldOrders.length === 0}
                 title="Shortcut: F6"
                 className={`flex items-center px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                   heldOrders.length > 0 
                     ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' 
                     : 'bg-slate-50 text-slate-400 border-transparent cursor-not-allowed'
                 }`}
               >
                 <ClipboardList className="w-4 h-4 mr-2" />
                 Recall
                 {heldOrders.length > 0 && <span className="ml-2 bg-orange-200 text-orange-800 px-1.5 rounded-full text-xs font-bold">{heldOrders.length}</span>}
               </button>
               
               <button onClick={() => setIsAiModalOpen(true)} className="flex items-center px-4 py-2 bg-violet-50 text-violet-700 border border-violet-100 rounded-full hover:bg-violet-100 transition-all text-sm font-bold whitespace-nowrap">
                  <Sparkles className="w-4 h-4 mr-2" /> AI Estimate
               </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
             {settings?.customerDisplay?.enabled && (
               <button onClick={handleOpenCustomerDisplay} className="hidden xl:flex items-center px-3 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors text-sm">
                 <Monitor className="w-4 h-4 mr-2" /> Screen
               </button>
             )}
             
             <button 
              onClick={() => setIsCustomerModalOpen(true)}
              title="Shortcut: F4"
              className={`flex items-center px-5 py-2.5 rounded-full shadow-sm font-bold text-sm border transition-all ${
                selectedCustomer 
                  ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800' 
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              {selectedCustomer ? (
                 <div className="flex flex-col items-start leading-none">
                    <span>{selectedCustomer.name}</span>
                    {customerLevel && <span className="text-[9px] opacity-80 font-normal uppercase">{customerLevel.name}</span>}
                 </div>
              ) : 'Select Customer'}
            </button>
          </div>
        </div>

        {/* Product Grid Container */}
        <div className="flex-1 overflow-hidden relative">
           <ProductGrid 
             products={productsWithDisplayPrice} 
             searchTerm={searchTerm}
             setSearchTerm={setSearchTerm}
             onScanClick={() => setIsScannerOpen(true)}
             onScan={performScan}
             onProductSelect={handleProductSelect}
           />
        </div>
      </div>

      {/* Cart Sidebar (Right Side) */}
      <div className={`
         fixed inset-0 z-40 bg-white transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:w-[420px] xl:w-[480px] shadow-2xl lg:shadow-none
         ${isCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
         <CartSidebar 
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            selectedCustomer={selectedCustomer}
            onRemoveCustomer={() => setSelectedCustomer(null)}
            onHoldOrder={handleHoldOrder}
            onCheckout={() => setIsCheckoutOpen(true)}
            onDiscountClick={() => setIsDiscountModalOpen(true)}
            subtotal={rawSubtotal}
            discount={discountAmount}
            tax={taxAmount}
            total={finalTotal}
            settings={settings}
         />
      </div>

      {/* Mobile Cart Toggle Button */}
      {cartItemCount > 0 && !isCartOpen && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-50 bg-slate-900 text-white pl-4 pr-6 py-4 rounded-full shadow-2xl flex items-center justify-between min-w-[200px] animate-bounce-in"
        >
          <div className="flex items-center">
            <span className="bg-orange-500 rounded-full w-8 h-8 flex items-center justify-center font-bold text-xs mr-3">
              {cartItemCount}
            </span>
            <span className="font-bold text-sm">Order Ticket</span>
          </div>
          <span className="font-bold text-lg ml-4">{formatPrice(finalTotal)}</span>
        </button>
      )}

      {/* Modals */}
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        total={finalTotal}
        onProcessPayment={handleProcessPayment}
        selectedCustomer={selectedCustomer}
        isProcessing={isProcessing}
        settings={settings} 
      />

      <ReceiptModal 
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={lastSale}
        settings={settings}
      />

      <CustomerModal 
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customers={customers}
        onSelectCustomer={(c) => { setSelectedCustomer(c); setIsCustomerModalOpen(false); }}
      />

      <DiscountModal 
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        onApplyDiscount={setManualDiscount}
        currencySymbol={settings?.currencySymbol}
      />

      <RecallModal 
        isOpen={isRecallModalOpen}
        onClose={() => setIsRecallModalOpen(false)}
        heldOrders={heldOrders}
        onRecall={handleRecall}
        onDiscard={discardHeldOrder}
      />

      <AiAssistant 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        inventory={branchProducts} 
        onAddItemsToCart={handleAiItemsAdded} 
      />
      
      <BarcodeScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={performScan} 
        dummyCodes={barcodeList as string[]} 
      />

      {productForSelector && (
        <VariantSelectorModal 
          product={productForSelector}
          isOpen={!!productForSelector}
          onClose={() => setProductForSelector(null)}
          onConfirm={handleConfirmSelection}
          formatPrice={formatPrice}
        />
      )}
    </div>
  );
};
