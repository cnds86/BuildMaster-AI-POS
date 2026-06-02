import { ColumnType, Generated } from 'kysely'

export interface Database {
  users: UserTable
  branches: BranchTable
  departments: DepartmentTable
  warehouses: WarehouseTable
  products: ProductTable
  stock_ledger: StockLedgerTable
  sales: SaleTable
  sale_items: SaleItemTable
  categories: CategoryTable
  customers: CustomerTable
  customer_levels: CustomerLevelTable
  promotions: PromotionTable
  expense_categories: ExpenseCategoryTable
  expenses: ExpenseTable
  drivers: DriverTable
  vehicles: VehicleTable
  delivery_orders: DeliveryOrderTable
  quotations: QuotationTable
  quotation_items: QuotationItemTable
  shifts: ShiftTable
  audit_log: AuditLogTable
  system_settings: SystemSettingsTable
  sync_logs: SyncLogTable
  stock_documents: StockDocumentTable
  stock_document_items: StockDocumentItemTable
}

export interface UserTable {
  id: Generated<string>
  username: string
  password_hash: string
  name: string
  role: string
  branch_id: string | null
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface BranchTable {
  id: Generated<string>
  name: string
  code: string
  address: string | null
  phone: string | null
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface DepartmentTable {
  id: Generated<string>
  name: string
  description: string | null
  manager_id: string | null
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface WarehouseTable {
  id: Generated<string>
  name: string
  code: string
  warehouse_type: 'main' | 'branch' | 'external'
  branch_id: string | null   // null for main/external; set for branch-level warehouses
  address: string | null
  phone: string | null
  manager_id: string | null
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface ProductTable {
  id: Generated<string>
  name: string
  category: string
  price: number
  cost_price: number | null
  stock: Generated<number>
  min_stock: number | null
  unit: Generated<string>
  sku: string
  barcode: string | null
  image_url: string | null
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface StockLedgerTable {
  id: Generated<string>
  product_id: string
  branch_id: string | null
  movement_type: 'IN' | 'OUT' | 'ADJUST' | 'SALE' | 'RETURN'
  quantity: number
  unit_cost: number | null
  reference_id: string | null
  note: string | null
  created_at: ColumnType<Date, string | undefined, never>
}

export interface SaleTable {
  id: Generated<string>
  branch_id: string | null
  user_id: string | null
  total: number
  subtotal: number | null
  discount_amount: Generated<number>
  tax_amount: Generated<number>
  payment_method: string
  payment_status: string
  status: Generated<string>
  customer_id: string | null
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface SaleItemTable {
  id: Generated<string>
  sale_id: string
  product_id: string
  quantity: number
  sell_price: number
  sell_unit: string | null
  created_at: ColumnType<Date, string | undefined, never>
}

export interface CategoryTable {
  id: Generated<string>
  name: string
  parent_id: string | null
  sort_order: Generated<number>
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
}

export interface CustomerTable {
  id: Generated<string>
  name: string
  phone: string | null
  email: string | null
  level_id: string | null
  debt: Generated<number>
  address: string | null
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface CustomerLevelTable {
  id: Generated<string>
  name: string
  discount_percent: Generated<number>
  point_rate: Generated<number>
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
}

export interface PromotionTable {
  id: Generated<string>
  name: string
  type: string
  description: string | null
  start_date: string | null
  end_date: string | null
  active: Generated<boolean>
  approval_status: Generated<string>  // 'pending' | 'approved' | 'rejected'
  created_at: ColumnType<Date, string | undefined, never>
}

export interface ExpenseCategoryTable {
  id: Generated<string>
  name: string
  type: string
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
}

export interface ExpenseTable {
  id: Generated<string>
  branch_id: string | null
  category_id: string | null
  amount: number
  description: string | null
  date: string
  receipt_url: string | null
  user_id: string | null
  approval_status: Generated<string>  // 'pending' | 'approved' | 'rejected'
  created_at: ColumnType<Date, string | undefined, never>
}

export interface DriverTable {
  id: Generated<string>
  name: string
  phone: string
  license_plate: string | null
  branch_id: string | null
  status: string
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface VehicleTable {
  id: Generated<string>
  plate_number: string
  vehicle_type: string | null
  capacity_weight: number | null
  capacity_volume: number | null
  branch_id: string | null
  status: string
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface DeliveryOrderTable {
  id: Generated<string>
  sale_id: string | null
  driver_id: string | null
  vehicle_id: string | null
  status: string
  delivery_address: string | null
  customer_name: string | null
  customer_phone: string | null
  scheduled_date: string | null
  estimated_weight: number | null
  notes: string | null
  delivered_at: string | null
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface QuotationTable {
  id: Generated<string>
  customer_id: string | null
  user_id: string | null
  total: number
  valid_until: string | null
  status: string
  created_at: ColumnType<Date, string | undefined, never>
}

export interface QuotationItemTable {
  id: Generated<string>
  quotation_id: string
  product_id: string
  quantity: number
  unit_price: number
  created_at: ColumnType<Date, string | undefined, never>
}

export interface ShiftTable {
  id: Generated<string>
  user_id: string | null
  user_name: string | null
  branch_id: string | null
  pos_machine_id: string | null
  status: string
  starting_cash: number | null
  opening_cash: Generated<number>
  cash_in_drawer: number | null
  closing_cash: number | null
  cash_difference: number | null
  expected_cash: number | null
  opened_at: ColumnType<Date, string | undefined, never>
  closed_at: string | null
}

export interface AuditLogTable {
  id: Generated<string>
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  old_value: unknown | null
  new_value: unknown | null
  ip_address: string | null
  created_at: ColumnType<Date, string | undefined, never>
}

export interface SystemSettingsTable {
  id: Generated<string>
  key: string // 'main' for the single settings row
  value: string // JSON string of full SystemSettings
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface SyncLogTable {
  id: Generated<string>
  sync_type: 'Auto' | 'Manual' | 'Push' | 'Pull'
  status: 'Success' | 'Failed' | 'Partial'
  details: string | null
  duration_ms: number | null
  records_synced: number | null
  error_message: string | null
  branch_id: string | null // null for Master-level syncs
  created_at: ColumnType<Date, string | undefined, never>
}

export interface StockDocumentTable {
  id: Generated<string>
  doc_type: 'transfer' | 'count' | 'adjustment' | 'receipt' | 'reservation'
  reference_no: string
  date: string
  status: 'Draft' | 'Approved' | 'Completed' | 'Cancelled'
  // Transfer
  source_warehouse_id: string | null
  target_warehouse_id: string | null
  // Count / Adjustment / Receipt / Reservation
  warehouse_id: string | null
  // Count
  counter_name: string | null
  // Receipt
  vendor_name: string | null
  // Reservation
  customer_name: string | null
  expiry_date: string | null
  // Adjustment
  reason: string | null
  // Common
  total_items: number | null
  note: string | null
  created_by: string | null
  approved_by: string | null
  completed_at: string | null
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface StockDocumentItemTable {
  id: Generated<string>
  stock_document_id: string
  product_id: string | null
  product_name: string
  unit: string | null
  quantity: number | null
  // for count doc
  system_quantity: number | null
  counted_quantity: number | null
  // for transfer/reservation
  note: string | null
  created_at: ColumnType<Date, string | undefined, never>
}
