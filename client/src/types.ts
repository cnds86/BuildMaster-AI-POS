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
}

export interface VariantAttribute {
  id: string;
  name: string;
  values: string[];
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
  conversionFactor: number;
  price: number;
  stock?: number;
  tierPrices?: Record<string, number>;
  costPrice?: number;
  color?: string;
  size?: string;
  attributes?: Record<string, string>;
}

export interface ProductInventory {
  warehouseId: string;
  quantity: number;
  variantId?: string;
}

export interface BranchPrice {
  branchId: string;
  price: number;
}

export interface ProductPhysical {
  weight?: number;
  width?: number;
  height?: number;
  depth?: number;
}

export interface Product {
  id: string;
  name: string;
  category: Category | string; 
  price: number;
  tierPrices?: Record<string, number>;
  costPrice?: number;
  branchPrices?: BranchPrice[];
  stock: number;
  minStock?: number;
  minOrderQuantity?: number;
  warehouseInventory?: ProductInventory[];
  unit: string;
  physical?: ProductPhysical;
  imageUrl?: string;
  sku: string;
  barcode: string;
  variants?: ProductVariant[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariantId?: string;
  sellPrice: number; 
  sellUnit: string;  
  sellConversionFactor: number;
}

export interface CustomerLevel { id: string; name: string; discountPercentage: number; color?: string; }
export interface Customer { id: string; code: string; name: string; phone: string; taxId?: string; address?: string; email?: string; loyaltyPoints: number; notes?: string; levelId?: string; level?: CustomerLevel; }

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
  roundingDifference?: number;
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

export interface EstimateRequest { query: string; }
export interface EstimateResultItem {
  productName: string;
  estimatedQuantity: number;
  unit: string;
  reasoning: string;
  matchedProductId?: string | null;
}
export interface ReorderSuggestion { productId: string; productName: string; currentStock: number; suggestedReorderQty: number; priority: 'High' | 'Medium' | 'Low'; reasoning: string; }
export interface NewProductSuggestion { name: string; categoryName: string; estimatedPrice: number; reasoning: string; suggestedUnit: string; }
export interface BundleSuggestion { bundleName: string; components: string[]; estimatedPrice: number; reasoning: string; targetAudience: string; }
export interface InventoryAnalysisResult { reorders: ReorderSuggestion[]; newProducts: NewProductSuggestion[]; bundles: BundleSuggestion[]; }
export interface BusinessInsight { summary: string; trendDirection: 'up' | 'down' | 'stable'; actionItems: string[]; predictedRevenueNextWeek: number; topPerformingCategory: string; }

export interface Branch { id: string; name: string; address: string; phone: string; manager: string; isActive: boolean; }
export interface PosMachine { id: string; branchId: string; machineNumber: string; status: 'active' | 'maintenance' | 'inactive'; lastActive?: string; }
export interface Warehouse { id: string; branchId: string; name: string; code: string; type: 'General' | 'Cold Storage' | 'Hazardous' | 'Showroom'; description?: string; }
export interface StorageLocation { id: string; warehouseId: string; zone: string; rack: string; shelf: string; bin: string; fullCode: string; type?: 'Pallet' | 'Shelf' | 'Floor'; }

export type DocumentStatus = 'Draft' | 'Approved' | 'Completed' | 'Cancelled';
export interface StockItem { productId: string; variantId?: string; productName: string; unit: string; quantity: number; note?: string; countedQuantity?: number; diff?: number; systemQuantity?: number; costPrice?: number; }
export interface StockTransfer { id: string; date: string; sourceWarehouseId: string; targetWarehouseId: string; status: DocumentStatus; items: StockItem[]; referenceNo: string; }
export interface StockCount { id: string; date: string; warehouseId: string; status: DocumentStatus; items: StockItem[]; referenceNo: string; counterName: string; reason: string; }
export interface StockReservation { id: string; date: string; expiryDate: string; warehouseId: string; customerName: string; status: DocumentStatus; items: StockItem[]; referenceNo: string; }
export interface StockReceipt { id: string; date: string; warehouseId: string; vendorName: string; vendorInvoiceNo?: string; status: DocumentStatus; items: StockItem[]; referenceNo: string; totalCost: number; }
export interface StockAdjustment { id: string; date: string; warehouseId: string; status: DocumentStatus; items: StockItem[]; referenceNo: string; reason: string; }

export interface SyncLog { id: string; timestamp: string; type: 'Auto' | 'Manual' | 'Push' | 'Pull'; status: 'Success' | 'Failed' | 'Partial'; details: string; durationMs: number; }

export type UserRole = 'Admin' | 'Manager' | 'Staff' | 'Cashier' | string;

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
}

export interface SystemRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean; 
}

export interface User { id: string; username: string; password?: string; email?: string; name: string; role: UserRole; avatarUrl?: string; coverUrl?: string; department?: string; branchId?: string; }

export interface CashTransaction {
  id: string;
  shiftId: string;
  userId: string;
  type: 'in' | 'out';
  amount: number;
  reason: string;
  timestamp: string;
}

export interface Shift {
  id: string;
  userId: string;
  branchId: string;
  posId?: string;
  startTime: string;
  endTime?: string;
  startCash: number;
  endCash?: number;
  notes?: string;
  status: 'Open' | 'Closed';
  userName?: string;
  branchName?: string;
  cashTransactions?: CashTransaction[];
}

export interface ShiftSchedule { 
  id: string; 
  userId: string; 
  originalUserId?: string; 
  branchId: string; 
  date: string; 
  startTime: string; 
  endTime: string; 
  note?: string;
  isSwap?: boolean;
}

export type Language = 'en' | 'th' | 'lo';
export interface Promotion { id: string; title: string; imageUrl: string; isActive: boolean; order?: number; startDate?: string; endDate?: string; }
export interface LocalDatabaseConfig { enabled: boolean; type: 'postgresql' | 'sqlite' | 'mysql'; host: string; port: string; databaseName: string; username: string; password: string; }
export interface TaxSettings { enabled: boolean; rate: number; calculationMode: 'included' | 'excluded'; displayOnReceipt: boolean; }
export interface CustomerDisplaySettings { enabled: boolean; welcomeMessage: string; promotionInterval: number; }

export interface BankAccount { 
  id: string;
  bankName: string; 
  accountName: string; 
  accountNumber: string; 
}

export interface RoundingSettings {
  enabled: boolean;
  interval: number;
  displayOnReceipt: boolean;
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
  tax: TaxSettings; 
  rounding?: RoundingSettings;
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
  localDatabase?: LocalDatabaseConfig; 
  masterApiUrl?: string; 
  autoSyncInterval?: number; 
  lastSyncTime?: string; 
}

export interface AppNotification { id: string; title: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; timestamp: string; read: boolean; link?: string; }
export type AuditAction = 'SALE_VOID' | 'SALE_RETURN' | 'USER_CREATE' | 'USER_DELETE' | 'SETTINGS_UPDATE' | 'STOCK_APPROVE' | 'STOCK_REJECT' | 'SHIFT_OVERRIDE' | 'LOGIN_FAILED' | 'CASH_IN' | 'CASH_OUT' | 'DEPT_CHANGE' | 'ROLE_CHANGE';
export interface AuditLog { id: string; action: AuditAction; userId: string; userName: string; details: string; timestamp: string; severity: 'low' | 'medium' | 'high' | 'critical'; resourceId?: string; }
