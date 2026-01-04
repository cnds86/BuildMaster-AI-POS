
import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem, EstimateResultItem, SystemSettings, Customer, Sale } from '../types';
import { Sparkles, User, ClipboardList, Monitor, ShoppingCart, ChevronRight, X } from 'lucide-react';
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
  
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);

  const [manualDiscount, setManualDiscount] = useState<{ type: 'percent' | 'fixed', value: number } | null>(null);
  const [redeemPoints, setRedeemPoints] = useState<number>(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const activeBranchId = settings?.currentBranchId || currentUser?.branchId || (branches.length > 0 ? branches[0].id : '');

  const branchProducts = useMemo(() => {
    if (!activeBranchId) return products;
    const branchWarehouseIds = warehouses.filter(w => w.branchId === activeBranchId).map(w => w.id);
    return products.map(p => {
      const branchStock = p.warehouseInventory?.reduce((acc, inv) => {
        if (branchWarehouseIds.includes(inv.warehouseId)) return acc + inv.quantity;
        return acc;
      }, 0) || 0;
      const branchPriceConfig = p.branchPrices?.find(bp => bp.branchId === activeBranchId);
      const effectivePrice = branchPriceConfig ? branchPriceConfig.price : p.price;
      return { ...p, stock: branchStock, price: effectivePrice };
    });
  }, [products, activeBranchId, warehouses]);

  const rawSubtotal = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
  const customerLevel = useMemo(() => selectedCustomer?.levelId ? customerLevels.find(l => l.id === selectedCustomer.levelId) : null, [selectedCustomer, customerLevels]);
  const customerDiscountAmount = (customerLevel?.discountPercentage || 0) > 0 ? rawSubtotal * (customerLevel!.discountPercentage / 100) : 0;
  let manualDiscountAmount = 0;
  if (manualDiscount) {
    manualDiscountAmount = manualDiscount.type === 'percent' ? rawSubtotal * (manualDiscount.value / 100) : manualDiscount.value;
  }
  const redeemRate = settings?.loyaltyProgram?.redeemRate || 100;
  const loyaltyDiscountAmount = redeemPoints > 0 ? redeemPoints / redeemRate : 0;
  let discountAmount = Math.min(customerDiscountAmount + manualDiscountAmount + loyaltyDiscountAmount, rawSubtotal);
  let discountedSubtotal = rawSubtotal - discountAmount;

  let taxAmount = 0;
  let finalTotal = discountedSubtotal;
  if (settings?.tax?.enabled) {
    const rate = settings.tax.rate / 100;
    if (settings.tax.calculationMode === 'excluded') {
       taxAmount = discountedSubtotal * rate;
       finalTotal = discountedSubtotal + taxAmount;
    } else {
       taxAmount = discountedSubtotal - (discountedSubtotal / (1 + rate));
       finalTotal = discountedSubtotal;
    }
  }

  const handleProductSelect = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      setSelectedProductForVariant(product);
      setIsVariantModalOpen(true);
    } else {
      addToCart(product, 1);
      setSearchTerm('');
    }
  };

  const handleProcessPayment = async (method: any, received: number, change: number) => {
    setIsProcessing(true);
    try {
      const sale = await onProcessSale(cart, finalTotal, selectedCustomer?.id, discountAmount, rawSubtotal, method, received, change, redeemPoints, 'pos');
      setLastSale(sale);
      setIsCheckoutOpen(false);
      clearCart();
      setManualDiscount(null); 
      setRedeemPoints(0);
      setSelectedCustomer(null);
      setIsReceiptOpen(true);
      setIsCartOpen(false);
    } catch (error) {
      alert("Transaction failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden bg-white -m-4 md:-m-6 relative">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden border-r border-slate-200">
        <div className="px-4 md:px-6 py-4 bg-white flex items-center justify-between shrink-0 border-b border-slate-100 z-10">
          <div className="flex items-center gap-3 overflow-hidden">
            <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter hidden sm:block whitespace-nowrap">
              Terminal 01
            </h2>
            <div className="flex gap-2 shrink-0">
               <button onClick={() => setIsRecallModalOpen(true)} className={`p-2 rounded-xl transition-all ${heldOrders.length > 0 ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-slate-50 text-slate-400'}`}>
                 <ClipboardList className="w-5 h-5" />
               </button>
               <button onClick={() => setIsAiModalOpen(true)} className="p-2 bg-violet-50 text-violet-600 border border-violet-100 rounded-xl hover:bg-violet-100 transition-all">
                  <Sparkles className="w-5 h-5" />
               </button>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
             <button onClick={() => setIsCustomerModalOpen(true)} className={`flex items-center px-3 py-2 md:px-4 rounded-xl text-xs font-black uppercase tracking-widest border transition-all max-w-[140px] md:max-w-none ${selectedCustomer ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>
              <User className="w-3.5 h-3.5 mr-2 shrink-0" />
              <span className="truncate">{selectedCustomer ? selectedCustomer.name : 'Customer'}</span>
            </button>
            <button onClick={() => setIsCartOpen(true)} className="lg:hidden p-2 bg-slate-900 text-white rounded-xl relative hover:bg-slate-800 transition-colors">
               <ShoppingCart className="w-5 h-5" />
               {cartItemCount > 0 && <span className="absolute -top-1 -right-1 bg-construction-orange text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black ring-2 ring-white">{cartItemCount}</span>}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative bg-slate-50">
           <ProductGrid 
             products={branchProducts} 
             searchTerm={searchTerm}
             setSearchTerm={setSearchTerm}
             onScanClick={() => setIsScannerOpen(true)}
             onScan={(code) => {
               const match = branchProducts.find(p => p.barcode === code || p.sku === code);
               if (match) handleProductSelect(match); else alert('No match');
             }}
             onProductSelect={handleProductSelect}
           />
        </div>
      </div>

      {/* Cart Sidebar / Drawer */}
      <div className={`
         fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] lg:w-[380px] xl:w-[450px] transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:block shadow-2xl lg:shadow-none
         ${isCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
         <div className="h-full w-full bg-white flex flex-col border-l border-slate-200">
            <CartSidebar 
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                selectedCustomer={selectedCustomer}
                onRemoveCustomer={() => setSelectedCustomer(null)}
                onHoldOrder={() => { holdCurrentOrder(selectedCustomer); setIsCartOpen(false); }}
                onCheckout={() => setIsCheckoutOpen(true)}
                onDiscountClick={() => setIsDiscountModalOpen(true)}
                subtotal={rawSubtotal}
                discount={discountAmount}
                tax={taxAmount}
                total={finalTotal}
                settings={settings}
            />
         </div>
      </div>

      {/* Overlay for mobile cart */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} total={finalTotal} onProcessPayment={handleProcessPayment} selectedCustomer={selectedCustomer} isProcessing={isProcessing} />
      <ReceiptModal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} sale={lastSale} settings={settings} />
      <CustomerModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} customers={customers} onSelectCustomer={(c) => { setSelectedCustomer(c); setIsCustomerModalOpen(false); }} />
      <DiscountModal isOpen={isDiscountModalOpen} onClose={() => setIsDiscountModalOpen(false)} onApplyDiscount={setManualDiscount} currencySymbol={settings?.currencySymbol} />
      <RecallModal isOpen={isRecallModalOpen} onClose={() => setIsRecallModalOpen(false)} heldOrders={heldOrders} onRecall={(id) => { recallOrder(id); setIsRecallModalOpen(false); setIsCartOpen(true); }} onDiscard={discardHeldOrder} />
      <AiAssistant isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} inventory={branchProducts} onAddItemsToCart={(items) => { items.forEach(i => i.matchedProductId && addToCart(branchProducts.find(p => p.id === i.matchedProductId)!, Math.ceil(i.estimatedQuantity))); setIsAiModalOpen(false); setIsCartOpen(true); }} />
      <BarcodeScanner isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={(code) => { const m = branchProducts.find(p => p.barcode === code); if (m) handleProductSelect(m); }} />
      {selectedProductForVariant && <VariantSelectorModal isOpen={isVariantModalOpen} onClose={() => setIsVariantModalOpen(false)} product={selectedProductForVariant} onConfirm={(p, q, v) => { addToCart(p, q, v); setIsVariantModalOpen(false); setIsCartOpen(true); }} formatPrice={formatPrice} />}
    </div>
  );
};
