
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
    source?: 'pos' | 'back-office',
    roundingDifference?: number // Added
  ) => Promise<Sale>;
  settings?: SystemSettings;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({ products, onProcessSale, settings }) => {
  const { customers, customerLevels, t, branches, warehouses, currentUser, formatPrice, categories, shifts, startShift, posMachines, promotions } = useGlobal();
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

  // Shift & Cash Drawer State
  // Merge Zustand shifts (demo/local) with PostgreSQL shifts (real data)
  const [apiShifts, setApiShifts] = useState<any[]>([]);

  // Fetch shifts from API when currentUser changes (for PostgreSQL shifts)
  useEffect(() => {
    if (!currentUser) return;
    fetch('/api/shifts', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.shifts) setApiShifts(data.shifts); })
      .catch(() => {});
  }, [currentUser?.id]);

  const allShifts = useMemo(() => {
    const z = shifts || [];
    const a = apiShifts || [];
    // Prefer Zustand shifts (local/demo store) since backend /api/shifts
    // requires auth_token cookie which the login endpoint doesn't set.
    // PostgreSQL is source of truth for persistent data — local Zustand
    // handles active shift for current session.
    const zIds = new Set(z.map(s => s.id));
    return [...z, ...a.filter(s => !zIds.has(s.id))];
  }, [shifts, apiShifts]);

  const activeShift = useMemo(() => {
    return allShifts.find(s => s.userId === currentUser?.id && s.status === 'Open');
  }, [allShifts, currentUser]);
  const [startCashValue, setStartCashValue] = useState<string>('');
  const [selectedPosId, setSelectedPosId] = useState<string>(settings?.currentPosId || '');

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
      addToCart(product, 1, undefined, price);
    }
  };

  const handleConfirmSelection = (product: Product, quantity: number, variantId?: string) => {
    const price = getDynamicPrice(product, variantId);
    addToCart(product, quantity, variantId, price);
    setProductForSelector(null);
  };

  // --- Calculations ---
  const customerLevel = useMemo(() => {
    if (!selectedCustomer?.levelId) return null;
    return customerLevels.find(l => l.id === selectedCustomer.levelId);
  }, [selectedCustomer, customerLevels]);

  const rawSubtotal = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
  const customerDiscountAmount = 0; // Already in sellPrice

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

  // --- Automated Promotions ---
  const autoDiscountAmount = useMemo(() => {
    let totalAutoDiscount = 0;
    
    // Get valid/active promotions
    const now = new Date();
    const activePromos = promotions?.filter(p => {
       if (!p.isActive || !p.type || !p.value) return false;
       if (p.startDate && new Date(p.startDate) > now) return false;
       if (p.endDate) {
          const end = new Date(p.endDate);
          end.setHours(23, 59, 59, 999);
          if (now > end) return false;
       }
       return true;
    }) || [];

    activePromos.forEach(promo => {
       // Type 1: Amount Off Order
       if (promo.type === 'amount_off_order') {
          if (!promo.minOrderAmount || rawSubtotal >= promo.minOrderAmount) {
             totalAutoDiscount += promo.value || 0;
          }
       }
       // Type 2: Percent Off Order
       else if (promo.type === 'percent_off_order') {
          if (!promo.minOrderAmount || rawSubtotal >= promo.minOrderAmount) {
             totalAutoDiscount += rawSubtotal * ((promo.value || 0) / 100);
          }
       }
       // Type 3: Product Discount
       else if (promo.type === 'product_discount' && promo.validProductIds && promo.validProductIds.length > 0) {
          cart.forEach(item => {
             if (promo.validProductIds?.includes(item.id)) {
                // Determine if value is percentage (<= 100) or flat amount. Assume flat amount for specific product discounts unless otherwise stated. Let's simplify and make it flat amount discount * item.quantity for now
                const itemDiscount = (promo.value || 0) * item.quantity;
                totalAutoDiscount += Math.min(itemDiscount, item.sellPrice * item.quantity); // Cannot exceed item total
             }
          });
       }
    });

    return totalAutoDiscount;
  }, [cart, rawSubtotal, promotions]);

  let discountAmount = Math.min(customerDiscountAmount + manualDiscountAmount + loyaltyDiscountAmount + autoDiscountAmount, rawSubtotal);
  let discountedSubtotal = rawSubtotal - discountAmount;

  let taxAmount = 0;
  let exactTotal = discountedSubtotal; // Track exact amount before rounding
  
  const taxConfig = settings?.tax;

  if (taxConfig && taxConfig.enabled) {
    const rate = taxConfig.rate / 100;
    if (taxConfig.calculationMode === 'excluded') {
       taxAmount = discountedSubtotal * rate;
       exactTotal = discountedSubtotal + taxAmount;
    } else {
       taxAmount = discountedSubtotal - (discountedSubtotal / (1 + rate));
       exactTotal = discountedSubtotal;
    }
  }

  // --- ROUNDING LOGIC ---
  let finalTotal = exactTotal;
  let roundingDifference = 0;

  // Use configured settings or fallback to default behavior (Check for Kip symbol or enabled flag)
  const isRoundingEnabled = settings?.rounding?.enabled ?? (settings?.currencySymbol === '₭');
  const roundingInterval = settings?.rounding?.interval || 500;

  if (isRoundingEnabled) {
     // Round to configured interval (Default 500)
     finalTotal = Math.round(exactTotal / roundingInterval) * roundingInterval;
     roundingDifference = finalTotal - exactTotal;
  } else {
     // Standard rounding for other currencies to 2 decimals
     finalTotal = Math.round(exactTotal * 100) / 100;
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

  // --- Keyboard Shortcuts & Barcode Interceptor ---
  useEffect(() => {
    let barcodeBuffer = '';
    let barcodeTimeout: ReturnType<typeof setTimeout>;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      // Ignore if typing inside input/textarea (but allow barcode scanner if it types fast)
      // Usually, scanners type faster than humas (< 30ms per char).
      // If target is an input, we might still want to intercept if they blindly scan.
      // But let's build the buffer anyway.
      
      if (e.key.length === 1) {
        barcodeBuffer += e.key;
        clearTimeout(barcodeTimeout);
        barcodeTimeout = setTimeout(() => {
          barcodeBuffer = '';
        }, 50); // Scanners typically send characters very fast
      } else if (e.key === 'Enter') {
        if (barcodeBuffer.length > 3) {
          // It's likely a barcode scan
          e.preventDefault();
          performScan(barcodeBuffer);
          barcodeBuffer = '';
          return;
        }
      }

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
    return () => {
       window.removeEventListener('keydown', handleKeyDown);
       clearTimeout(barcodeTimeout);
    };
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
    productForSelector,
    branchProducts // Needed for performScan inside the effect closure if we don't decouple it or use ref. Actually, performScan is defined outside. Let's make sure it updates.
  ]);

  const performScan = useCallback((code: string) => {
    // CRITICAL: Always close scanner first to prevent frozen video
    setIsScannerOpen(false);

    const normalizedCode = code.trim().toLowerCase();
    let productFound = false;

    // 1. Priority: Check specific Variant Barcodes first (Direct Add)
    for (const p of branchProducts) {
      if (p.variants) {
        const variantMatch = p.variants.find(v => 
          (v.barcode && v.barcode.toLowerCase() === normalizedCode) || 
          (v.code && v.code.toLowerCase() === normalizedCode)
        );
        if (variantMatch) {
          const price = getDynamicPrice(p, variantMatch.id);
          addToCart(p, 1, variantMatch.id, price);
          setSearchTerm(''); // Clear for next scan
          productFound = true;
          break; // Exit loop
        }
      }
    }

    // 2. Check Top-level Product Barcodes/SKUs
    if (!productFound) {
      const mainMatch = branchProducts.find(p => 
        (p.barcode && p.barcode.toLowerCase() === normalizedCode) || 
        (p.sku && p.sku.toLowerCase() === normalizedCode)
      );

      if (mainMatch) {
        // If product has variants but user scanned the "Generic" barcode
        if (mainMatch.variants && mainMatch.variants.length > 0) {
           setProductForSelector(mainMatch);
           setSearchTerm('');
        } else {
           // Simple product, add directly
           handleProductSelect(mainMatch);
           setSearchTerm('');
        }
        productFound = true;
      }
    }

    // 3. Feedback if not found
    if (!productFound) {
        // Use timeout to let the modal close animation finish/state update before alert
        setTimeout(() => {
           alert(`Product not found: ${code}`);
        }, 300);
    }
  }, [branchProducts, addToCart, customerLevels, selectedCustomer]);

  const handleAiItemsAdded = (items: EstimateResultItem[]) => {
    items.forEach(est => {
      if (est.matchedProductId) {
        const product = branchProducts.find(p => p.id === est.matchedProductId);
        if (product) {
           const price = getDynamicPrice(product);
           addToCart(product, Math.ceil(est.estimatedQuantity), undefined, price);
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
        cart, 
        finalTotal, 
        selectedCustomer?.id, 
        discountAmount, 
        rawSubtotal,
        method, 
        receivedAmount, 
        change, 
        redeemPoints, 
        'pos',
        roundingDifference, // Pass rounding info
        taxAmount // Pass tax amount for receipt
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

  // Inject current pricing for grid display
  const productsWithDisplayPrice = useMemo(() => {
     return branchProducts.map(p => {
        return {
           ...p,
           displayPrice: getDynamicPrice(p) // used for display in grid
        };
     });
  }, [branchProducts, selectedCustomer, customerLevels]);

  const handleStartShift = () => {
    const amount = parseFloat(startCashValue.replace(/,/g, ''));
    if (isNaN(amount) || amount < 0) {
      alert("Please enter a valid starting cash amount.");
      return;
    }
    
    // Ensure POS Machine is selected if there are any available for this branch
    const branchPosMachines = posMachines.filter(p => p.branchId === activeBranchId);
    if (branchPosMachines.length > 0 && !selectedPosId) {
      alert("Please select a POS Machine.");
      return;
    }

    startShift(activeBranchId, amount, "Shift opened from POS Terminal", selectedPosId);
  };

  // Guard: Restrict POS access if no active shift
  if (!activeShift) {
    const branchPosMachines = posMachines.filter(p => p.branchId === activeBranchId);
    
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 md:-m-6 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Monitor className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Open Register</h2>
          <p className="text-slate-500 mb-8">You must open a shift and declare starting cash before you can process sales.</p>
          
          <div className="space-y-5 text-left">
            {branchPosMachines.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Select POS Machine</label>
                <select 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                  value={selectedPosId}
                  onChange={(e) => setSelectedPosId(e.target.value)}
                >
                  <option value="">-- Select POS --</option>
                  {branchPosMachines.map(pos => (
                    <option key={pos.id} value={pos.id}>{pos.machineNumber}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Starting Cash in Drawer</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                  {settings?.currencySymbol || '$'}
                </span>
                <input 
                  type="text" 
                  className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xl font-bold bg-slate-50"
                  value={startCashValue}
                  onChange={(e) => setStartCashValue(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>

            <button 
              onClick={handleStartShift}
              className="w-full py-3 mt-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md"
            >
              Open Shift & Start Selling
            </button>
          </div>
        </div>
      </div>
    );
  }

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
             categories={categories}
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
         absolute inset-y-0 right-0 z-40 w-[420px] xl:w-[480px] bg-white shadow-2xl transform transition-transform duration-300
         ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}
         hidden lg:block
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
            autoDiscount={autoDiscountAmount}
            tax={taxAmount}
            total={finalTotal}
            roundingDifference={roundingDifference}
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
