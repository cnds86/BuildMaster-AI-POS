
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
  name: string;
  symbol: string;
  category: UnitCategory;
  baseFactor: number;
  isBase: boolean;
  parentId?: string | null;
}

export interface CategoryItem {
  id: string;
  name: string;
  parentId: string | null;
  description?: string;
}

export interface ProductVariant {
  id: string;
  name: string; 
  code: string; 
  barcode: string;
  price: number;
  costPrice?: number;
  stock?: number;
  conversionFactor?: number;
}

export interface ProductInventory {
  warehouseId: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  category: Category | string; 
  price: number;
  costPrice?: number;
  stock: number;
  minStock?: number;
  unit: string;
  sku: string;
  barcode: string;
  variants?: ProductVariant[];
  warehouseInventory?: ProductInventory[];
  branchPrices?: { branchId: string; price: number }[];
  imageUrl?: string;
  minOrderQuantity?: number;
  physical?: { weight?: number; width?: number; height?: number; depth?: number };
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariantId?: string;
  sellPrice: number; 
  sellUnit: string;  
  sellConversionFactor: number;
}

export interface HeldOrder {
  id: string;
  items: CartItem[];
  customer?: Customer | null;
  timestamp: string;
  note?: string;
  total: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  total: number;
  date: string;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'qr' | 'credit';
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  amountReceived?: number;
  change?: number;
  remainingAmount?: number;
  status: 'completed' | 'voided';
  syncStatus?: 'synced' | 'pending' | 'failed';
  customerId?: string;
  customerName?: string;
  pointsRedeemed?: number;
  pointsEarned?: number;
  userId?: string;
  userName?: string;
  type?: 'sale' | 'return';
  originalSaleId?: string;
}

export interface Quotation {
  id: string;
  referenceNo: string;
  date: string;
  validUntil: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  customerId?: string;
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  status: 'active' | 'converted' | 'expired';
  userId?: string;
  userName?: string;
  note?: string;
}

export interface AuditLog { id: string; action: string; userId: string; userName: string; details: string; timestamp: string; severity: 'low' | 'medium' | 'high' | 'critical'; resourceId?: string; }
export interface AppNotification { id: string; title: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; timestamp: string; read: boolean; link?: string; }
export interface SyncLog { id: string; timestamp: string; type: 'Auto' | 'Manual' | 'Push' | 'Pull'; status: 'Success' | 'Failed' | 'Partial'; details: string; durationMs: number; }
export interface Customer { id: string; code: string; name: string; phone: string; taxId?: string; address?: string; email?: string; loyaltyPoints: number; notes?: string; levelId?: string; level?: CustomerLevel; }
export interface CustomerLevel { id: string; name: string; discountPercentage: number; color?: string; }
export interface Branch { id: string; name: string; address: string; phone: string; manager: string; isActive: boolean; }
export interface PosMachine { id: string; branchId: string; machineNumber: string; status: 'active' | 'maintenance' | 'inactive'; lastActive?: string; }
export interface Warehouse { id: string; branchId: string; name: string; code: string; type: 'General' | 'Cold Storage' | 'Hazardous' | 'Showroom'; description?: string; }
export interface StorageLocation { id: string; warehouseId: string; zone: string; rack: string; shelf: string; bin: string; fullCode: string; type?: 'Pallet' | 'Shelf' | 'Floor'; }

export interface CashTransaction {
  id: string;
  shiftId: string;
  userId: string;
  type: 'in' | 'out';
  amount: number;
  reason: string;
  timestamp: string;
}

export interface Shift { id: string; userId: string; branchId: string; posId?: string; startTime: string; endTime?: string; startCash: number; endCash?: number; notes?: string; status: 'Open' | 'Closed'; userName?: string; branchName?: string; cashTransactions?: CashTransaction[]; }
export interface ShiftSchedule { id: string; userId: string; originalUserId?: string; branchId: string; date: string; startTime: string; endTime: string; note?: string; isSwap?: boolean; }
export interface Promotion { id: string; title: string; imageUrl: string; isActive: boolean; order?: number; startDate?: string; endDate?: string; }

export type Language = 'en' | 'th' | 'lo';

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface CustomerDisplaySettings {
  enabled: boolean;
  welcomeMessage: string;
  promotionInterval: number;
}

export interface LocalDatabaseSettings {
  enabled: boolean;
  type: 'postgresql' | 'mysql' | 'sqlite';
  host: string;
  port: string;
  databaseName: string;
  username: string;
  password?: string;
}

export interface SystemSettings { 
  companyName: string; 
  taxId: string; 
  address: string; 
  phone: string; 
  monthlyTarget: number; 
  language: Language; 
  currencySymbol: string; 
  defaultItemsPerPage: number; 
  tax: { enabled: boolean; rate: number; calculationMode: 'included' | 'excluded'; displayOnReceipt: boolean; }; 
  cashDenominations: number[]; 
  customerDisplay: CustomerDisplaySettings; 
  loyaltyProgram: { enabled: boolean; earnRate: number; redeemRate: number; }; 
  receiptHeader: string; 
  receiptFooter: string; 
  receiptLogoUrl?: string; 
  receiptQrCodeUrl?: string; 
  receiptPaperSize: '58mm' | '80mm' | 'A4'; 
  receiptAutoPrint: boolean; 
  receiptShowTaxId: boolean; 
  receiptShowCashier: boolean; 
  receiptCopies: number; 
  bankAccounts: BankAccount[]; 
  showBankInfoOnReceipt: boolean; 
  currentBranchId?: string; 
  currentPosId?: string; 
  deviceRole?: 'Master' | 'Slave'; 
  masterApiUrl?: string; 
  autoSyncInterval?: number; 
  lastSyncTime?: string; 
  localDatabase?: LocalDatabaseSettings;
}

export type DocumentStatus = 'Draft' | 'Approved' | 'Completed' | 'Cancelled';

export interface StockItem {
  productId: string;
  variantId?: string;
  productName: string;
  unit: string;
  quantity: number;
  note?: string;
  countedQuantity?: number;
  systemQuantity?: number;
  diff?: number;
  costPrice?: number;
}

export interface StockTransfer { id: string; date: string; sourceWarehouseId: string; targetWarehouseId: string; status: DocumentStatus; items: StockItem[]; referenceNo: string; }
export interface StockCount { id: string; date: string; warehouseId: string; status: DocumentStatus; items: StockItem[]; referenceNo: string; counterName: string; reason: string; }
export interface StockReservation { id: string; date: string; expiryDate: string; warehouseId: string; customerName: string; status: DocumentStatus; items: StockItem[]; referenceNo: string; }
export interface StockReceipt { id: string; date: string; warehouseId: string; vendorName: string; vendorInvoiceNo?: string; status: DocumentStatus; items: StockItem[]; referenceNo: string; totalCost: number; }
export interface StockAdjustment { id: string; date: string; warehouseId: string; status: DocumentStatus; items: StockItem[]; referenceNo: string; reason: string; }

// --- Advanced User & Permission Types ---
export type UserRole = 'Admin' | 'Manager' | 'Staff' | 'Cashier' | string;

export interface Permission {
  id: string;
  label: string;
  description: string;
  group: string;
}

export interface UserRoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // List of permission IDs
  isSystem?: boolean;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface User { 
  id: string; 
  username: string; 
  password?: string; 
  email?: string; 
  name: string; 
  role: UserRole; 
  avatarUrl?: string; 
  coverUrl?: string; 
  departmentId?: string; // Changed from department: string
  branchId?: string; 
}

export interface BusinessInsight { summary: string; trendDirection: 'up' | 'down' | 'stable'; actionItems: string[]; predictedRevenueNextWeek: number; topPerformingCategory: string; }
export interface InventoryAnalysisResult { reorders: any[]; newProducts: any[]; bundles: any[]; }
export interface EstimateResultItem { productName: string; estimatedQuantity: number; unit: string; reasoning: string; matchedProductId?: string; }
