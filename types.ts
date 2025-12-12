
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
  name: string;      // e.g., 'Piece', 'Small', 'Red' (Unit Name or Variant Name)
  code: string;      // SKU/Code for the variant
  barcode: string;   // Barcode for the variant
  conversionFactor: number; // How many variants in the main unit
  price: number;     // Price per variant
  color?: string;    // New: Color specification (e.g., 'Red', '#FF0000')
  size?: string;     // New: Size specification (e.g., 'XL', '10mm')
}

export interface ProductInventory {
  warehouseId: string;
  quantity: number;
}

export interface BranchPrice {
  branchId: string;
  price: number;
}

export interface ProductPhysical {
  weight?: number; // kg
  width?: number;  // cm
  height?: number; // cm
  depth?: number;  // cm (length)
}

export interface Product {
  id: string;
  name: string;
  category: Category | string; 
  price: number;     // Base Price (Global)
  branchPrices?: BranchPrice[]; // Overrides per branch
  stock: number;     // Stock count in MAIN units (Aggregate Total)
  minStock?: number; // Minimum stock threshold for alerts
  warehouseInventory?: ProductInventory[]; // Breakdown by warehouse
  unit: string;      // Name of the MAIN unit (e.g., 'bag', 'box')
  physical?: ProductPhysical; // New: Physical attributes
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
  subtotal?: number; // Raw total before discount/tax
  discountAmount?: number; // Deduction amount
  total: number; // Final payable amount
  date: string;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'qr' | 'credit';
  paymentStatus: 'paid' | 'unpaid' | 'partial'; // Track debt status
  amountReceived?: number; // Amount given by customer
  change?: number; // Change returned
  remainingAmount?: number; // Amount left to pay (for credit/partial)
  status: 'completed' | 'voided'; // Order status
  syncStatus?: 'synced' | 'pending' | 'failed'; // Track sync state
  customerId?: string; // Link to customer
  customerName?: string; // Snapshot of name
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

// --- AI Inventory Analysis Types ---
export interface ReorderSuggestion {
  productId: string;
  productName: string;
  currentStock: number;
  suggestedReorderQty: number;
  priority: 'High' | 'Medium' | 'Low';
  reasoning: string;
}

export interface NewProductSuggestion {
  name: string;
  categoryName: string;
  estimatedPrice: number;
  reasoning: string;
  suggestedUnit: string;
}

export interface BundleSuggestion {
  bundleName: string;
  components: string[];
  estimatedPrice: number;
  reasoning: string;
  targetAudience: string;
}

export interface InventoryAnalysisResult {
  reorders: ReorderSuggestion[];
  newProducts: NewProductSuggestion[];
  bundles: BundleSuggestion[];
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

// --- Customer Types ---
export interface CustomerLevel {
  id: string;
  name: string;
  discountPercentage: number;
  color?: string;
}

export interface Customer {
  id: string;
  code: string; // Membership ID or Code
  name: string;
  phone: string;
  taxId?: string;
  address?: string;
  email?: string;
  loyaltyPoints: number;
  notes?: string;
  levelId?: string;
  level?: CustomerLevel;
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

// --- Sync Types ---
export interface SyncLog {
  id: string;
  timestamp: string;
  type: 'Auto' | 'Manual' | 'Push' | 'Pull';
  status: 'Success' | 'Failed' | 'Partial';
  details: string; // e.g., "5 Sales uploaded, 0 Products updated"
  durationMs: number;
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
  department?: string;
  branchId?: string;
}

// --- Shift Management ---
// Actual working record (Time Clock)
export interface Shift {
  id: string;
  userId: string;
  branchId: string;
  startTime: string;
  endTime?: string;
  startCash: number;
  endCash?: number;
  notes?: string;
  status: 'Open' | 'Closed';
  userName?: string; // Optional helper
  branchName?: string; // Optional helper
}

// Planned Schedule (Roster)
export interface ShiftSchedule {
  id: string;
  userId: string;
  branchId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24hr)
  endTime: string; // HH:mm (24hr)
  note?: string;
}

// --- Settings & Promotions ---
export type Language = 'en' | 'th' | 'lo';

export interface Promotion {
  id: string;
  title: string;
  imageUrl: string;
  isActive: boolean;
  order?: number;
  startDate?: string; // ISO Date
  endDate?: string;   // ISO Date
}

export interface LocalDatabaseConfig {
  enabled: boolean;
  type: 'postgresql' | 'sqlite' | 'mysql';
  host: string;
  port: string;
  databaseName: string;
  username: string;
  password: string;
}

export interface TaxSettings {
  enabled: boolean;             // Calculate Tax/VAT?
  rate: number;                 // e.g. 7.0 for 7%
  calculationMode: 'included' | 'excluded'; // 'included' (Price has VAT) or 'excluded' (Price + VAT)
  displayOnReceipt: boolean;    // Show tax line on UI/Receipt
}

export interface CustomerDisplaySettings {
  enabled: boolean;
  welcomeMessage: string;
  promotionInterval: number; // Seconds
}

export interface SystemSettings {
  // Company Info
  companyName: string;
  taxId: string;
  address: string;
  phone: string;
  
  // Localization
  language: Language;
  currencySymbol: string;
  
  // Interface
  defaultItemsPerPage: number;

  // Tax / VAT
  tax: TaxSettings;

  // Customer Display
  customerDisplay: CustomerDisplaySettings;

  // Receipt & Print
  receiptHeader: string;
  receiptFooter: string;
  receiptLogoUrl?: string;
  receiptQrCodeUrl?: string; // Bank QR Code for receipt
  receiptPaperSize: '58mm' | '80mm' | 'A4';
  receiptAutoPrint: boolean;
  receiptShowTaxId: boolean;
  receiptShowCashier: boolean;
  receiptCopies: number;

  // Device Configuration
  currentBranchId?: string;
  currentPosId?: string;
  deviceRole?: 'Master' | 'Slave';
  
  // Local Database (For Slave offline mode)
  localDatabase?: LocalDatabaseConfig;

  // Synchronization (Master/Slave)
  masterApiUrl?: string; // e.g., http://192.168.1.100:3000
  autoSyncInterval?: number; // In minutes, 0 for manual
  lastSyncTime?: string;
}
