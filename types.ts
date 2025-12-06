
export enum Category {
  CEMENT = 'Cement & Concrete',
  STEEL = 'Steel & Metal',
  WOOD = 'Wood & Lumber',
  PAINT = 'Paints & Finishes',
  TOOLS = 'Tools & Hardware',
  PLUMBING = 'Plumbing',
  ELECTRICAL = 'Electrical',
  CONSUMABLES = 'General Consumables'
}

export type UnitCategory = 'Weight' | 'Length' | 'Quantity';

export interface UnitDefinition {
  id: string;
  name: string;      // e.g. Kilogram
  symbol: string;    // e.g. kg
  category: UnitCategory;
  baseFactor: number; // 1 for base unit (e.g. g), 1000 for kg
  isBase: boolean;   // True if this is the reference unit
}

export interface CategoryItem {
  id: string;
  name: string;
  parentId: string | null; // null for root categories
  description?: string;
}

export interface ProductVariant {
  id: string;
  name: string;      // e.g., 'Piece', 'Small', 'Red'
  code: string;      // SKU/Code for the variant
  barcode: string;   // Barcode for the variant
  conversionFactor: number; // How many variants in the main unit (e.g. 12 pieces in 1 box)
  price: number;     // Price per variant
}

export interface ProductInventory {
  warehouseId: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  category: Category | string; 
  price: number;     // Price of the MAIN unit
  stock: number;     // Stock count in MAIN units (Aggregate Total)
  minStock?: number; // Minimum stock threshold for alerts
  warehouseInventory?: ProductInventory[]; // Breakdown by warehouse
  unit: string;      // Name of the MAIN unit (e.g., 'bag', 'box')
  imageUrl?: string;
  sku: string;       // SKU of MAIN unit
  barcode: string;   // Barcode of MAIN unit
  variants?: ProductVariant[]; // List of sub-products/variants
}

export interface CartItem extends Product {
  quantity: number;
  // Handling multi-unit/variant logic
  selectedVariantId?: string; // null if main unit, string if variant
  sellPrice: number; 
  sellUnit: string;  
  sellConversionFactor: number; // 1 for main, X for variant
}

export interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  date: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
}

export interface EstimateRequest {
  query: string;
}

export interface EstimateResultItem {
  productName: string;
  estimatedQuantity: number;
  unit: string;
  reasoning: string;
  matchedProductId?: string; // If found in inventory
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  isActive: boolean;
}

export interface PosMachine {
  id: string;
  branchId: string;
  machineNumber: string; // e.g., POS-01
  status: 'active' | 'maintenance' | 'inactive';
  lastActive?: string;
}

export interface Warehouse {
  id: string;
  branchId: string;
  name: string;
  code: string; // e.g., WH-01
  type: 'General' | 'Cold Storage' | 'Hazardous' | 'Showroom';
  description?: string;
}

export interface StorageLocation {
  id: string;
  warehouseId: string;
  zone: string;   // e.g., Zone A
  rack: string;   // e.g., Rack 01
  shelf: string;  // e.g., Shelf 03 (Level)
  bin: string;    // e.g., Bin B (Slot)
  fullCode: string; // Helper: A-01-03-B
  type?: 'Pallet' | 'Shelf' | 'Floor';
}

// --- Stock Management Types ---

export type DocumentStatus = 'Draft' | 'Approved' | 'Completed' | 'Cancelled';

export interface StockItem {
  productId: string;
  variantId?: string; // Optional: if specific variant
  productName: string;
  unit: string;
  quantity: number;
  note?: string;
}

// 1. Transfer Request (ใบขอโอนย้ายสินค้า)
export interface StockTransfer {
  id: string;
  date: string;
  sourceWarehouseId: string;
  targetWarehouseId: string;
  status: DocumentStatus;
  items: StockItem[];
  referenceNo: string;
}

// 2. Stock Count (ใบตรวจนับสินค้า)
export interface StockCountItem extends StockItem {
  systemQuantity: number; // Snapshot of system stock
  countedQuantity: number; // Actual count
  diff: number; // Calculated diff
}

export interface StockCount {
  id: string;
  date: string;
  warehouseId: string;
  status: DocumentStatus;
  items: StockCountItem[];
  referenceNo: string;
  counterName: string; // Who counted
  reason: string; // Mandatory reason for adjustment
}

// 3. Stock Reservation (ใบจองสินค้า)
export interface StockReservation {
  id: string;
  date: string;
  expiryDate: string;
  warehouseId: string;
  customerName: string;
  status: DocumentStatus;
  items: StockItem[];
  referenceNo: string;
}

// 4. Goods Receipt (ใบเพิ่มสินค้า / รับเข้าจากผู้ขาย)
export interface StockReceiptItem extends StockItem {
  costPrice: number; // Cost per unit
}

export interface StockReceipt {
  id: string;
  date: string;
  warehouseId: string;
  vendorName: string;
  vendorInvoiceNo?: string;
  status: DocumentStatus;
  items: StockReceiptItem[];
  referenceNo: string;
  totalCost: number;
}

// 5. Stock Adjustment (ใบปรับปรุงยอดสินค้า)
export interface StockAdjustment {
  id: string;
  date: string;
  warehouseId: string;
  status: DocumentStatus;
  items: StockItem[]; // Quantity can be negative (decrease) or positive (increase)
  referenceNo: string;
  reason: string; // Mandatory
}

// --- User & Roles ---

export type UserRole = 'Admin' | 'Manager' | 'Staff' | 'Cashier';

export interface User {
  id: string;
  username: string;
  password?: string; // Added for login
  email?: string;    // Optional
  name: string;
  role: UserRole;
  avatarUrl?: string;
}