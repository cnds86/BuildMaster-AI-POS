
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { PosTerminal } from './components/PosTerminal';
import { UnitManagement } from './components/UnitManagement';
import { CategoryManagement } from './components/CategoryManagement';
import { BranchManagement } from './components/BranchManagement';
import { WarehouseManagement } from './components/WarehouseManagement';
import { StockManagement } from './components/StockManagement';
import { ApprovalManagement } from './components/ApprovalManagement';
import { UserManagement } from './components/UserManagement';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_SALES, 
  INITIAL_UNITS, 
  INITIAL_CATEGORIES_TREE,
  INITIAL_BRANCHES,
  INITIAL_POS_MACHINES,
  INITIAL_WAREHOUSES,
  INITIAL_LOCATIONS,
  INITIAL_TRANSFERS,
  INITIAL_COUNTS,
  INITIAL_RESERVATIONS,
  INITIAL_RECEIPTS,
  INITIAL_ADJUSTMENTS,
  INITIAL_USERS
} from './services/data';
import { 
  Product, 
  Sale, 
  CartItem, 
  UnitDefinition, 
  CategoryItem, 
  Branch, 
  PosMachine, 
  Warehouse, 
  StorageLocation,
  StockTransfer,
  StockCount,
  StockReservation,
  StockReceipt,
  StockAdjustment,
  DocumentStatus,
  User,
  UserRole
} from './types';
import { Lock, Hammer, User as UserIcon, LogIn } from 'lucide-react';

function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // App State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [units, setUnits] = useState<UnitDefinition[]>(INITIAL_UNITS);
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES_TREE);
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [posMachines, setPosMachines] = useState<PosMachine[]>(INITIAL_POS_MACHINES);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES);
  const [locations, setLocations] = useState<StorageLocation[]>(INITIAL_LOCATIONS);

  // Stock Mgmt State
  const [transfers, setTransfers] = useState<StockTransfer[]>(INITIAL_TRANSFERS);
  const [counts, setCounts] = useState<StockCount[]>(INITIAL_COUNTS);
  const [reservations, setReservations] = useState<StockReservation[]>(INITIAL_RESERVATIONS);
  const [receipts, setReceipts] = useState<StockReceipt[]>(INITIAL_RECEIPTS);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(INITIAL_ADJUSTMENTS);

  // --- Auth Handlers ---
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const user = users.find(u => u.username === loginUsername && u.password === loginPassword);
    
    if (user) {
      setCurrentUser(user);
      // Redirect based on role
      if (user.role === 'Cashier') {
        setActiveTab('pos');
      } else if (user.role === 'Staff') {
        setActiveTab('inventory');
      } else {
        setActiveTab('dashboard');
      }
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginUsername('');
    setLoginPassword('');
    setActiveTab('dashboard');
  };

  // --- Core Handlers ---
  const handleProcessSale = (cartItems: CartItem[], total: number) => {
    // 1. Create Sale Record
    const newSale: Sale = {
      id: `S-${Date.now()}`,
      items: cartItems,
      total: total,
      date: new Date().toISOString(),
      paymentMethod: 'cash'
    };
    setSales([newSale, ...sales]);

    // 2. Deduct Stock (using Main Warehouse 'wh1' for POS default)
    const updatedProducts = products.map(p => {
      const cartItem = cartItems.find(item => item.id === p.id);
      if (cartItem) {
        // Calculate total quantity in base units
        const deductQty = cartItem.quantity / cartItem.sellConversionFactor;
        
        // Update Warehouse Inventory (wh1)
        const newWhInventory = p.warehouseInventory?.map(inv => {
          if (inv.warehouseId === 'wh1') { // Default POS warehouse
            return { ...inv, quantity: Math.max(0, inv.quantity - deductQty) };
          }
          return inv;
        }) || [];

        // Update Total Stock
        const newTotalStock = newWhInventory.reduce((acc, curr) => acc + curr.quantity, 0);

        return { 
          ...p, 
          warehouseInventory: newWhInventory,
          stock: parseFloat(newTotalStock.toFixed(2)) 
        };
      }
      return p;
    });
    setProducts(updatedProducts);
    
    // Alert or Feedback could go here
    alert('Sale processed successfully!');
  };

  // --- Inventory Handlers ---
  const handleAddProduct = (newProduct: Product) => {
    setProducts([...products, newProduct]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  // --- Unit Handlers ---
  const handleAddUnit = (unit: UnitDefinition) => setUnits([...units, unit]);
  const handleUpdateUnit = (unit: UnitDefinition) => setUnits(units.map(u => u.id === unit.id ? unit : u));
  const handleDeleteUnit = (id: string) => setUnits(units.filter(u => u.id !== id));

  // --- Category Handlers ---
  const handleAddCategory = (cat: CategoryItem) => setCategories([...categories, cat]);
  const handleUpdateCategory = (cat: CategoryItem) => setCategories(categories.map(c => c.id === cat.id ? cat : c));
  const handleDeleteCategory = (id: string) => {
    // Recursive delete check could be added here
    setCategories(categories.filter(c => c.id !== id));
  };

  // --- Branch & POS Handlers ---
  const handleAddBranch = (b: Branch) => setBranches([...branches, b]);
  const handleUpdateBranch = (b: Branch) => setBranches(branches.map(br => br.id === b.id ? b : br));
  const handleDeleteBranch = (id: string) => setBranches(branches.filter(b => b.id !== id));

  const handleAddPos = (p: PosMachine) => setPosMachines([...posMachines, p]);
  const handleUpdatePos = (p: PosMachine) => setPosMachines(posMachines.map(pm => pm.id === p.id ? p : pm));
  const handleDeletePos = (id: string) => setPosMachines(posMachines.filter(p => p.id !== id));

  // --- Warehouse Handlers ---
  const handleAddWarehouse = (w: Warehouse) => setWarehouses([...warehouses, w]);
  const handleUpdateWarehouse = (w: Warehouse) => setWarehouses(warehouses.map(wh => wh.id === w.id ? w : wh));
  const handleDeleteWarehouse = (id: string) => setWarehouses(warehouses.filter(w => w.id !== id));

  const handleAddLocation = (l: StorageLocation) => setLocations([...locations, l]);
  const handleUpdateLocation = (l: StorageLocation) => setLocations(locations.map(loc => loc.id === l.id ? l : loc));
  const handleDeleteLocation = (id: string) => setLocations(locations.filter(l => l.id !== id));

  // --- User Handlers ---
  const handleAddUser = (u: User) => setUsers([...users, u]);
  const handleUpdateUser = (u: User) => setUsers(users.map(usr => usr.id === u.id ? u : usr));
  const handleDeleteUser = (id: string) => setUsers(users.filter(u => u.id !== id));

  // --- Stock Management Handlers ---

  const handleUpdateTransfer = (t: StockTransfer) => {
    const exists = transfers.find(item => item.id === t.id);
    if (exists) setTransfers(transfers.map(item => item.id === t.id ? t : item));
    else setTransfers([...transfers, t]);
  };
  const handleDeleteTransfer = (id: string) => setTransfers(transfers.filter(t => t.id !== id));

  const handleUpdateCount = (c: StockCount) => {
    const exists = counts.find(item => item.id === c.id);
    if (exists) setCounts(counts.map(item => item.id === c.id ? c : item));
    else setCounts([...counts, c]);
  };
  const handleDeleteCount = (id: string) => setCounts(counts.filter(c => c.id !== id));

  const handleUpdateReservation = (r: StockReservation) => {
    const exists = reservations.find(item => item.id === r.id);
    if (exists) setReservations(reservations.map(item => item.id === r.id ? r : item));
    else setReservations([...reservations, r]);
  };
  const handleDeleteReservation = (id: string) => setReservations(reservations.filter(r => r.id !== id));

  const handleUpdateReceipt = (r: StockReceipt) => {
    const exists = receipts.find(item => item.id === r.id);
    if (exists) setReceipts(receipts.map(item => item.id === r.id ? r : item));
    else setReceipts([...receipts, r]);
  };
  const handleDeleteReceipt = (id: string) => setReceipts(receipts.filter(r => r.id !== id));

  const handleUpdateAdjustment = (a: StockAdjustment) => {
    const exists = adjustments.find(item => item.id === a.id);
    if (exists) setAdjustments(adjustments.map(item => item.id === a.id ? a : item));
    else setAdjustments([...adjustments, a]);
  };
  const handleDeleteAdjustment = (id: string) => setAdjustments(adjustments.filter(a => a.id !== id));

  // --- STOCK APPROVAL / COMPLETION LOGIC ---
  const handleStockStatusChange = (
    type: 'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment', 
    id: string, 
    status: DocumentStatus
  ) => {
    
    // Helper to safely update products immutably
    const applyInventoryChanges = (docItems: any[], operation: 'transfer' | 'count' | 'receipt' | 'adjustment', context: any) => {
      setProducts(currentProducts => {
        return currentProducts.map(product => {
          // Find if this product is in the document items
          const item = docItems.find(i => i.productId === product.id);
          if (!item) return product; // No change for this product

          // Deep copy the warehouse inventory to ensure immutability
          const newInventory = product.warehouseInventory ? product.warehouseInventory.map((inv: any) => ({...inv})) : [];
          
          // Perform logic based on operation
          if (operation === 'transfer') {
            const { sourceId, targetId } = context;
            
            // Deduct Source
            const sourceInv = newInventory.find((x: any) => x.warehouseId === sourceId);
            if (sourceInv) {
              sourceInv.quantity = Math.max(0, sourceInv.quantity - item.quantity);
            } else {
              newInventory.push({ warehouseId: sourceId, quantity: 0 }); 
            }

            // Add Target
            const targetInv = newInventory.find((x: any) => x.warehouseId === targetId);
            if (targetInv) {
              targetInv.quantity += item.quantity;
            } else {
              newInventory.push({ warehouseId: targetId, quantity: item.quantity });
            }
          } 
          else if (operation === 'count') {
            const { warehouseId } = context;
            const whInv = newInventory.find((x: any) => x.warehouseId === warehouseId);
            
            // Overwrite with counted quantity
            if (whInv) {
              whInv.quantity = item.countedQuantity;
            } else {
              newInventory.push({ warehouseId: warehouseId, quantity: item.countedQuantity });
            }
          }
          else if (operation === 'receipt') {
            const { warehouseId } = context;
            const whInv = newInventory.find((x: any) => x.warehouseId === warehouseId);
            
            if (whInv) {
              whInv.quantity += item.quantity;
            } else {
              newInventory.push({ warehouseId: warehouseId, quantity: item.quantity });
            }
          }
          else if (operation === 'adjustment') {
            const { warehouseId } = context;
            const whInv = newInventory.find((x: any) => x.warehouseId === warehouseId);
            
            if (whInv) {
              // Quantity can be negative or positive
              const nextQty = whInv.quantity + item.quantity;
              whInv.quantity = Math.max(0, nextQty);
            } else if (item.quantity > 0) {
              newInventory.push({ warehouseId: warehouseId, quantity: item.quantity });
            }
          }

          // Return updated product object
          return {
            ...product,
            warehouseInventory: newInventory,
            stock: newInventory.reduce((acc: number, curr: any) => acc + curr.quantity, 0)
          };
        });
      });
    };

    // 1. Update Status in Document List & Trigger Inventory Change
    // We use functional updates (prev => ...) to ensure we don't have stale state closures.

    if (type === 'transfer') {
      const doc = transfers.find(t => t.id === id);
      if (!doc) return;
      
      setTransfers(prev => prev.map(t => t.id === id ? { ...t, status } : t));

      if (status === 'Approved') {
        applyInventoryChanges(doc.items, 'transfer', { 
          sourceId: doc.sourceWarehouseId, 
          targetId: doc.targetWarehouseId 
        });
      }
    } 
    else if (type === 'count') {
      const doc = counts.find(c => c.id === id);
      if (!doc) return;
      
      setCounts(prev => prev.map(c => c.id === id ? { ...c, status } : c));

      if (status === 'Completed') {
        applyInventoryChanges(doc.items, 'count', { warehouseId: doc.warehouseId });
      }
    }
    else if (type === 'receipt') {
      const doc = receipts.find(r => r.id === id);
      if (!doc) return;

      setReceipts(prev => prev.map(r => r.id === id ? { ...r, status } : r));

      if (status === 'Completed') {
        applyInventoryChanges(doc.items, 'receipt', { warehouseId: doc.warehouseId });
      }
    }
    else if (type === 'adjustment') {
      const doc = adjustments.find(a => a.id === id);
      if (!doc) return;

      setAdjustments(prev => prev.map(a => a.id === id ? { ...a, status } : a));

      if (status === 'Approved') {
        applyInventoryChanges(doc.items, 'adjustment', { warehouseId: doc.warehouseId });
      }
    }
    else if (type === 'reservation') {
       // Just update status
       setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    }
  };

  // --- Render ---

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-slate-50 p-8 border-b border-slate-100 flex flex-col items-center">
             <div className="bg-construction-orange p-3 rounded-xl mb-4 shadow-lg shadow-orange-500/20">
               <Hammer className="w-8 h-8 text-white" />
             </div>
             <h1 className="text-2xl font-bold text-slate-800">BuildMaster AI POS</h1>
             <p className="text-slate-500 text-sm mt-2">Construction Retail Management System</p>
          </div>
          
          <form onSubmit={handleLoginSubmit} className="p-8 space-y-6">
            {loginError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
                {loginError}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter username"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </button>
            
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
               <p className="text-xs text-slate-500 font-semibold mb-2 uppercase">Demo Accounts (Password: 123)</p>
               <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                 <span>• admin</span>
                 <span>• manager</span>
                 <span>• staff</span>
                 <span>• cashier</span>
               </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard sales={sales} products={products} />;
      case 'inventory':
        return (
          <Inventory 
            products={products} 
            units={units}
            categories={categories}
            warehouses={warehouses}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        );
      case 'pos':
        return <PosTerminal products={products} onProcessSale={handleProcessSale} />;
      case 'units':
        return (
          <UnitManagement 
            units={units} 
            onAddUnit={handleAddUnit}
            onUpdateUnit={handleUpdateUnit} 
            onDeleteUnit={handleDeleteUnit} 
          />
        );
      case 'categories':
        return (
          <CategoryManagement
            categories={categories}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        );
      case 'branches':
        return (
          <BranchManagement 
            branches={branches}
            posMachines={posMachines}
            onAddBranch={handleAddBranch}
            onUpdateBranch={handleUpdateBranch}
            onDeleteBranch={handleDeleteBranch}
            onAddPosMachine={handleAddPos}
            onUpdatePosMachine={handleUpdatePos}
            onDeletePosMachine={handleDeletePos}
          />
        );
      case 'warehouses':
        return (
           <WarehouseManagement
             branches={branches}
             warehouses={warehouses}
             locations={locations}
             onAddWarehouse={handleAddWarehouse}
             onUpdateWarehouse={handleUpdateWarehouse}
             onDeleteWarehouse={handleDeleteWarehouse}
             onAddLocation={handleAddLocation}
             onUpdateLocation={handleUpdateLocation}
             onDeleteLocation={handleDeleteLocation}
           />
        );
      case 'stock':
        return (
          <StockManagement
            warehouses={warehouses}
            products={products}
            transfers={transfers}
            counts={counts}
            reservations={reservations}
            receipts={receipts}
            adjustments={adjustments}
            onUpdateTransfer={handleUpdateTransfer}
            onUpdateCount={handleUpdateCount}
            onUpdateReservation={handleUpdateReservation}
            onUpdateReceipt={handleUpdateReceipt}
            onUpdateAdjustment={handleUpdateAdjustment}
            onDeleteTransfer={handleDeleteTransfer}
            onDeleteCount={handleDeleteCount}
            onDeleteReservation={handleDeleteReservation}
            onDeleteReceipt={handleDeleteReceipt}
            onDeleteAdjustment={handleDeleteAdjustment}
            onStatusChange={handleStockStatusChange}
          />
        );
      case 'approvals':
        return (
          <ApprovalManagement
            transfers={transfers}
            counts={counts}
            reservations={reservations}
            receipts={receipts}
            adjustments={adjustments}
            warehouses={warehouses}
            onStatusChange={handleStockStatusChange}
          />
        );
      case 'users':
        return (
          <UserManagement 
            users={users}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        );
      default:
        return <div className="p-8">Select a tab</div>;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
