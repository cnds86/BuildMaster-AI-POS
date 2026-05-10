import { db } from './db'
import { sql } from 'kysely'
import bcrypt from 'bcryptjs'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: generate UUID string for FK references
// ─────────────────────────────────────────────────────────────────────────────
function uuid(): string {
  return crypto.randomUUID()
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema creation — all 19 tables (PostgreSQL raw SQL)
// ─────────────────────────────────────────────────────────────────────────────
async function createSchema() {
  console.log('📦 Creating schema...')

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'STAFF',
      branch_id UUID,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS branches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      address TEXT,
      phone VARCHAR(50),
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      parent_id UUID REFERENCES categories(id),
      sort_order INTEGER DEFAULT 0,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS customer_levels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      discount_percent DECIMAL(5,2) DEFAULT 0,
      point_rate DECIMAL(5,2) DEFAULT 1,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      email VARCHAR(255),
      level_id UUID REFERENCES customer_levels(id),
      debt DECIMAL(12,2) DEFAULT 0,
      address TEXT,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      cost_price DECIMAL(12,2),
      stock INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 10,
      unit VARCHAR(50) DEFAULT 'pcs',
      sku VARCHAR(255) NOT NULL UNIQUE,
      barcode VARCHAR(255),
      image_url TEXT,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS stock_ledger (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id),
      branch_id UUID REFERENCES branches(id),
      movement_type VARCHAR(20) NOT NULL,
      quantity INTEGER NOT NULL,
      unit_cost DECIMAL(12,2),
      reference_id UUID,
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS promotions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      start_date DATE,
      end_date DATE,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS expense_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      branch_id UUID REFERENCES branches(id),
      category_id UUID REFERENCES expense_categories(id),
      amount DECIMAL(12,2) NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      receipt_url TEXT,
      user_id UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS drivers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      license_plate VARCHAR(50),
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS vehicles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plate_number VARCHAR(50) NOT NULL UNIQUE,
      vehicle_type VARCHAR(100),
      driver_id UUID REFERENCES drivers(id),
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS shifts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      branch_id UUID REFERENCES branches(id),
      user_id UUID REFERENCES users(id),
      opening_cash DECIMAL(12,2) DEFAULT 0,
      closing_cash DECIMAL(12,2),
      cash_difference DECIMAL(12,2),
      expected_cash DECIMAL(12,2),
      status VARCHAR(20) DEFAULT 'OPEN',
      opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      closed_at TIMESTAMP
    );
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS sales (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      branch_id UUID REFERENCES branches(id),
      user_id UUID REFERENCES users(id),
      total DECIMAL(12,2) NOT NULL,
      subtotal DECIMAL(12,2),
      discount_amount DECIMAL(12,2) DEFAULT 0,
      tax_amount DECIMAL(12,2) DEFAULT 0,
      payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH',
      payment_status VARCHAR(50) DEFAULT 'PAID',
      status VARCHAR(50) DEFAULT 'COMPLETED',
      customer_id UUID REFERENCES customers(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS sale_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sale_id UUID NOT NULL REFERENCES sales(id),
      product_id UUID NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      sell_price DECIMAL(12,2) NOT NULL,
      sell_unit VARCHAR(50) DEFAULT 'pcs',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS quotations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID REFERENCES customers(id),
      user_id UUID REFERENCES users(id),
      total DECIMAL(12,2) NOT NULL,
      valid_until DATE,
      status VARCHAR(50) DEFAULT 'DRAFT',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS quotation_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      quotation_id UUID NOT NULL REFERENCES quotations(id),
      product_id UUID NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(12,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS delivery_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sale_id UUID REFERENCES sales(id),
      driver_id UUID REFERENCES drivers(id),
      vehicle_id UUID REFERENCES vehicles(id),
      status VARCHAR(50) DEFAULT 'PENDING',
      delivery_address TEXT,
      delivered_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db)

  await sql`
    CREATE TABLE IF NOT EXISTS audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(100),
      entity_id UUID,
      old_value JSONB,
      new_value JSONB,
      ip_address VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db)

  console.log('✅ Schema created')
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────────────────────
async function seedData() {
  console.log('🌱 Seeding data...')

  // ── Branches ──────────────────────────────────────────────────────────────
  const branchIds = {
    HQ: uuid(),
    Vientiane: uuid(),
    Bokeo: uuid(),
  }

  await sql`
    INSERT INTO branches (id, name, code, address, phone, active) VALUES
      (${branchIds.HQ}, 'ໂຮງແຮ່ມາຊ່າ - ໃໝ່', 'SOE-MAI', '�້ານ ໒໔ ເໜືອ, ເສັ້ນທາງ ໒໐, ເມืองເໄນ', '020 1234 5678', true),
      (${branchIds.Vientiane}, 'MR.D.I.Y ເໝືອ', 'MRDIY-N', 'ถนน 20 เอื้อง, เทศบาลนคร เวียงจันทน์', '020 2345 6789', true),
      (${branchIds.Bokeo}, 'MHX ໂພ້', 'MHX-BOKEO', 'ໂໝ່ 2, ແຂວง ເໜືອ, ເมือง ໂບເKE0', '020 3456 7890', true)
    ON CONFLICT (code) DO NOTHING;
  `.execute(db)

  console.log('  ✅ branches (3)')

  // ── Users ─────────────────────────────────────────────────────────────────
  const pwHash = await bcrypt.hash('password123', 10)

  const userIds = {
    admin: uuid(),
    manager: uuid(),
    staff1: uuid(),
    cashier1: uuid(),
  }

  await sql`
    INSERT INTO users (id, username, password_hash, name, role, branch_id, active) VALUES
      (${userIds.admin}, 'admin', ${pwHash}, 'ເເອ ໄອ ໄຊ', 'ADMIN', ${branchIds.HQ}, true),
      (${userIds.manager}, 'manager', ${pwHash}, 'ໂຮ ໄຊ ໂຈ', 'MANAGER', ${branchIds.HQ}, true),
      (${userIds.staff1}, 'staff01', ${pwHash}, 'ໂສ ໄໝ ໂ', 'STAFF', ${branchIds.HQ}, true),
      (${userIds.cashier1}, 'cashier01', ${pwHash}, 'ໂດ ໂດ ໂ', 'CASHIER', ${branchIds.HQ}, true)
    ON CONFLICT (username) DO NOTHING;
  `.execute(db)

  console.log('  ✅ users (4)')

  // ── Categories ─────────────────────────────────────────────────────────────
  const catIds = {
    steel: uuid(),
    cement: uuid(),
    pipe: uuid(),
    paint: uuid(),
    tool: uuid(),
    sanitary: uuid(),
    elect: uuid(),
    roof: uuid(),
  }

  await sql`
    INSERT INTO categories (id, name, parent_id, sort_order, active) VALUES
      (${catIds.steel}, 'ເໝັດ ໄໝ ໆ', NULL, 1, true),
      (${catIds.cement}, 'ຊີ ເໝັດ', NULL, 2, true),
      (${catIds.pipe}, 'ເໝັດ ໄໝ ໂ', NULL, 3, true),
      (${catIds.paint}, '�� ໄໝ ໂ', NULL, 4, true),
      (${catIds.tool}, 'ເໝືອ ໂ', NULL, 5, true),
      (${catIds.sanitary}, 'ເໝືອ ໄ ໂ', NULL, 6, true),
      (${catIds.elect}, 'ໄໟ ໂ', NULL, 7, true),
      (${catIds.roof}, 'ເໝ ໂ', NULL, 8, true)
    ON CONFLICT DO NOTHING;
  `.execute(db)

  console.log('  ✅ categories (8)')

  // ── Products ───────────────────────────────────────────────────────────────
  const productData = [
    // 钢丝/钢材
    { name: 'ເໝັດໄໝ 6mm (ແໜ່ 6 ມິ)', category: 'ເໝັດ ໄໝ ໆ', price: 45000, cost: 38000, stock: 500, unit: 'ແໜ່', sku: 'STL-6MM-001' },
    { name: 'ເໝັດໄໝ 8mm (ແໜ່ 8 ມິ)', category: 'ເໝັດ ໄໝ ໆ', price: 75000, cost: 65000, stock: 350, unit: 'ແໜ່', sku: 'STL-8MM-001' },
    { name: 'ເໝັດໄໝ 10mm (ແໜ່ 10 ມິ)', category: 'ເໝັດ ໄໝ ໆ', price: 120000, cost: 105000, stock: 200, unit: 'ແໜ່', sku: 'STL-10MM-001' },
    { name: 'ເໝັດໄໝ 12mm (ແໜ່ 12 ມິ)', category: 'ເໝັດ ໄໝ ໆ', price: 175000, cost: 155000, stock: 150, unit: 'ແໜ່', sku: 'STL-12MM-001' },
    { name: 'ເໝ 4x6 ແໜ່ (Wire mesh)', category: 'ເໝ 4x6', price: 85000, cost: 72000, stock: 80, unit: 'ແໜ່', sku: 'WMS-4X6-001' },
    // 水泥
    { name: 'ຊີເໝັດ ໃໝ່ (50kg)', category: 'ຊີ ເໝັດ', price: 85000, cost: 72000, stock: 600, unit: 'ໂ> 50kg', sku: 'CMT-SOA-50K' },
    { name: 'ຊີເໝັ: ໄໝ 50 (50kg)', category: 'Limestone 50', price: 68000, cost: 58000, stock: 300, unit: 'ໂ> 50kg', sku: 'CMT-LIME-50K' },
    { name: 'Mighty ໃໝ່ (50kg)', category: 'Mighty', price: 92000, cost: 80000, stock: 200, unit: 'ໂ> 50kg', sku: 'CMT-MIGHTY-50K' },
    // 管道/PVC
    { name: 'ເໝັດ 2 ໊ (PVC 2 นิ้ว)', category: 'PVC', price: 35000, cost: 28000, stock: 200, unit: 'ແໜ່ 6m', sku: 'PVC-2IN-006' },
    { name: 'ເໝ> 4 ໊ (PVC 4 นิ้ว)', category: 'PVC', price: 65000, cost: 53000, stock: 150, unit: 'ແໜ່ 6m', sku: 'PVC-4IN-006' },
    { name: 'ໂ: ໄ 2 ໊ (Valve 2")', category: 'Valve', price: 120000, cost: 95000, stock: 40, unit: 'ໂ> ', sku: 'VLV-2IN-001' },
    { name: 'Connector 4 ໊ x 2 ໊', category: 'Connector', price: 25000, cost: 19000, stock: 100, unit: 'pcs', sku: 'CON-4X2-001' },
    // 油漆/涂料
    { name: 'DULUX ໃໝ່ 5L (ເໝ ໃ)', category: 'DULUX', price: 185000, cost: 155000, stock: 80, unit: 'ໂ> 5L', sku: 'PNT-DULUX-5L' },
    { name: 'MAX ໃໝ່ 5L', category: 'MAX', price: 95000, cost: 78000, stock: 120, unit: 'ໂ> 5L', sku: 'PNT-MAX-5L' },
    { name: 'TOA ໃໝ່ 5L', category: 'TOA', price: 125000, cost: 102000, stock: 60, unit: 'ໂ> 5L', sku: 'PNT-TOA-5L' },
    { name: 'ເໝ> ໃ (Primer) 5L', category: 'Primer', price: 75000, cost: 60000, stock: 90, unit: 'ໂ> 5L', sku: 'PNT-PRIM-5L' },
    { name: 'DULUX ໃໝ່ 1L (ເໝ ໃ)', category: 'DULUX', price: 45000, cost: 36000, stock: 200, unit: 'ໂ> 1L', sku: 'PNT-DULUX-1L' },
    // 五金工具
    { name: 'ເໝ> ໂ 10 ໊ (Hammer 10")', category: 'Hammer', price: 55000, cost: 42000, stock: 50, unit: 'pcs', sku: 'TOL-HAM-10IN' },
    { name: 'ເໝ> ໂ 8 ໊ (Hammer 8")', category: 'Hammer', price: 42000, cost: 32000, stock: 60, unit: 'pcs', sku: 'TOL-HAM-8IN' },
    { name: 'ເໝ> ໂ 12 ໊ (Hammer 12")', category: 'Hammer', price: 68000, cost: 53000, stock: 30, unit: 'pcs', sku: 'TOL-HAM-12IN' },
    { name: 'ເໝ> ໂ 18 ໊ (Hammer 18")', category: 'Hammer', price: 85000, cost: 68000, stock: 20, unit: 'pcs', sku: 'TOL-HAM-18IN' },
    { name: 'ເໝ> ໂ 24 ໊ (Hammer 24")', category: 'Hammer', price: 110000, cost: 90000, stock: 15, unit: 'pcs', sku: 'TOL-HAM-24IN' },
    { name: 'ເໝ> ໂ 36 ໊ (Hammer 36")', category: 'Hammer', price: 145000, cost: 120000, stock: 10, unit: 'pcs', sku: 'TOL-HAM-36IN' },
    { name: 'ເໝ> ໂ 48 ໊ (Hammer 48")', category: 'Hammer', price: 180000, cost: 150000, stock: 8, unit: 'pcs', sku: 'TOL-HAM-48IN' },
    { name: 'ເໝ> ໂ 60 ໊ (Hammer 60")', category: 'Hammer', price: 220000, cost: 185000, stock: 5, unit: 'pcs', sku: 'TOL-HAM-60IN' },
    { name: 'ເໝ> ໂ 72 ໊ (Hammer 72")', category: 'Hammer', price: 260000, cost: 220000, stock: 3, unit: 'pcs', sku: 'TOL-HAM-72IN' },
    { name: 'ເໝ> ໂ 84 ໊ (Hammer 84")', category: 'Hammer', price: 300000, cost: 255000, stock: 2, unit: 'pcs', sku: 'TOL-HAM-84IN' },
    { name: 'ເໝ> ໂ 96 ໊ (Hammer 96")', category: 'Hammer', price: 350000, cost: 295000, stock: 1, unit: 'pcs', sku: 'TOL-HAM-96IN' },
    { name: 'ເໝ> ໂ 108 ໊ (Hammer 108")', category: 'Hammer', price: 400000, cost: 340000, stock: 1, unit: 'pcs', sku: 'TOL-HAM-108IN' },
    // 卫生/卫浴
    { name: 'TO-TO ໂ (Toilet S-trap)', category: 'Toilet', price: 850000, cost: 720000, stock: 15, unit: 'pcs', sku: 'SAN-TO-TO-S' },
    { name: 'ໂ: ໄ ໃ (Faucet basin)', category: 'Faucet', price: 180000, cost: 145000, stock: 40, unit: 'pcs', sku: 'SAN-FAU-BAS' },
    { name: 'Shower set ໃ', category: 'Shower', price: 250000, cost: 200000, stock: 25, unit: 'pcs', sku: 'SAN-SHO-SET' },
    // 电气
    { name: 'ເໝ> 1.5mm² (100m ໂ)', category: 'Wire', price: 280000, cost: 235000, stock: 50, unit: 'roll', sku: 'ELC-WR-1.5-100' },
    { name: 'ເໝ> 2.5mm² (100m ໂ)', category: 'Wire', price: 420000, cost: 355000, stock: 40, unit: 'roll', sku: 'ELC-WR-2.5-100' },
    { name: 'MCB 20A', category: 'MCB', price: 35000, cost: 27000, stock: 100, unit: 'pcs', sku: 'ELC-MCB-20A' },
    { name: 'MCB 30A', category: 'MCB', price: 38000, cost: 29500, stock: 80, unit: 'pcs', sku: 'ELC-MCB-30A' },
    // 屋顶
    { name: 'ເໝ ໃ 0.35mm (1 ແໜ່)', category: 'CGI', price: 180000, cost: 155000, stock: 100, unit: 'sheet', sku: 'ROF-CGI-035' },
    { name: 'ເໝ ໃ 0.4mm (1 ແໜ່)', category: 'CGI', price: 210000, cost: 180000, stock: 80, unit: 'sheet', sku: 'ROF-CGI-040' },
    { name: 'ເໝ ໃ 0.45mm (1 ແໜ່)', category: 'CGI', price: 240000, cost: 205000, stock: 60, unit: 'sheet', sku: 'ROF-CGI-045' },
    { name: 'Nails 3" (1kg)', category: 'Nails', price: 25000, cost: 20000, stock: 200, unit: 'kg', sku: 'ROF-NAL-3IN' },
    { name: 'Nails 4" (1kg)', category: 'Nails', price: 28000, cost: 22000, stock: 180, unit: 'kg', sku: 'ROF-NAL-4IN' },
  ]

  const productIds: Record<string, string> = {}

  for (const p of productData) {
    const id = uuid()
    productIds[p.sku] = id
    await sql`
      INSERT INTO products (id, name, category, price, cost_price, stock, min_stock, unit, sku, active)
      VALUES (${id}, ${p.name}, ${p.category}, ${p.price}, ${p.cost}, ${p.stock}, 10, ${p.unit}, ${p.sku}, true)
    `.execute(db)
  }

  console.log(`  ✅ products (${productData.length})`)

  // ── Stock Ledger (initial stock IN) ───────────────────────────────────────
  for (const p of productData) {
    const pid = productIds[p.sku]
    if (!pid) continue
    await sql`
      INSERT INTO stock_ledger (product_id, branch_id, movement_type, quantity, unit_cost, note)
      VALUES (${pid}, ${branchIds.HQ}, 'IN', ${p.stock}, ${p.cost}, 'Initial stock')
      ON CONFLICT DO NOTHING;
    `.execute(db)
  }

  console.log('  ✅ stock_ledger (initial stock)')

  // ── Customer Levels ────────────────────────────────────────────────────────
  const levelIds = {
    gold: uuid(),
    silver: uuid(),
    bronze: uuid(),
    regular: uuid(),
  }

  await sql`
    INSERT INTO customer_levels (id, name, discount_percent, point_rate, active) VALUES
      (${levelIds.gold}, 'VIP ໂ', 15, 2.0, true),
      (${levelIds.silver}, 'VIP ໃ', 10, 1.5, true),
      (${levelIds.bronze}, 'VIP ເ', 5, 1.0, true),
      (${levelIds.regular}, 'POS', 0, 1.0, true)
    ON CONFLICT DO NOTHING;
  `.execute(db)

  console.log('  ✅ customer_levels (4)')

  // ── Customers ───────────────────────────────────────────────────────────────
  const customerIds = {
    c1: uuid(),
    c2: uuid(),
    c3: uuid(),
    c4: uuid(),
    c5: uuid(),
  }

  await sql`
    INSERT INTO customers (id, name, phone, email, level_id, debt, address, active) VALUES
      (${customerIds.c1}, 'Mr. Somchai Construction', '020 1111 2222', 'somchai@construction.la', ${levelIds.gold}, 0, 'ເມື6 ເເໝ> ເ, ເເໝ> ເ ໂ', true),
      (${customerIds.c2}, 'Phongsavanh Builder', '020 2222 3333', 'phong@phongsavanh.la', ${levelIds.silver}, 0, 'ໂ ໂ 23, ເເ ໂ ໂ', true),
      (${customerIds.c3}, 'Sabaidee Hardware', '020 3333 4444', 'sabaidee@hardware.la', ${levelIds.bronze}, 0, 'ເ 16, ເເ 12', true),
      (${customerIds.c4}, 'Mr. Kham ເ', '020 4444 5555', NULL, ${levelIds.regular}, 2500000, 'ເ 9, ເ 2', true),
      (${customerIds.c5}, 'Khua Phet ເ', '020 5555 6666', NULL, ${levelIds.regular}, 1800000, 'ເ 3, ເ 5', true)
    ON CONFLICT DO NOTHING;
  `.execute(db)

  console.log('  ✅ customers (5)')

  // ── Promotions ─────────────────────────────────────────────────────────────
  await sql`
    INSERT INTO promotions (id, name, type, start_date, end_date, active) VALUES
      (${uuid()}, 'ເ 5% ໃ 10,000 ໂ', 'PERCENT', '2025-01-01', '2025-12-31', true),
      (${uuid()}, 'Free ເ 2mm ເ 10 ໂ', 'ITEM', '2025-04-01', '2025-06-30', true),
      (${uuid()}, 'VIP ເ 10% ເ 5,000 ໂ', 'PERCENT', '2025-01-01', '2025-12-31', true)
    ON CONFLICT DO NOTHING;
  `.execute(db)

  console.log('  ✅ promotions (3)')

  // ── Expense Categories ──────────────────────────────────────────────────────
  const expCatIds = {
    utility: uuid(),
    salary: uuid(),
    transport: uuid(),
    marketing: uuid(),
  }

  await sql`
    INSERT INTO expense_categories (id, name, type, active) VALUES
      (${expCatIds.utility}, 'ເ ເ', 'OPERATIONAL', true),
      (${expCatIds.salary}, 'ເ ເ ເ', 'OPERATIONAL', true),
      (${expCatIds.transport}, 'Transport', 'OPERATIONAL', true),
      (${expCatIds.marketing}, 'Marketing', 'MARKETING', true)
    ON CONFLICT DO NOTHING;
  `.execute(db)

  console.log('  ✅ expense_categories (4)')

  // ── Drivers & Vehicles ─────────────────────────────────────────────────────
  const driverIds = { d1: uuid(), d2: uuid() }
  const vehicleIds = { v1: uuid(), v2: uuid() }

  await sql`
    INSERT INTO drivers (id, name, phone, license_plate, active) VALUES
      (${driverIds.d1}, 'Mr. Boun', '020 7777 8888', 'LA-1234', true),
      (${driverIds.d2}, 'Mr. Noy', '020 8888 9999', 'LA-5678', true)
    ON CONFLICT DO NOTHING;
  `.execute(db)

  await sql`
    INSERT INTO vehicles (id, plate_number, vehicle_type, driver_id, active) VALUES
      (${vehicleIds.v1}, 'LA-1234', 'Truck 2.5T', ${driverIds.d1}, true),
      (${vehicleIds.v2}, 'LA-5678', 'Truck 1.5T', ${driverIds.d2}, true)
    ON CONFLICT DO NOTHING;
  `.execute(db)

  console.log('  ✅ drivers (2), vehicles (2)')

  // ── Shifts ──────────────────────────────────────────────────────────────────
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  const shiftId1 = uuid()
  const shiftId2 = uuid()

  await sql`
    INSERT INTO shifts (id, branch_id, user_id, opening_cash, status, opened_at) VALUES
      (${shiftId1}, ${branchIds.HQ}, ${userIds.cashier1}, 500000, 'OPEN', ${now.toISOString()})
    ON CONFLICT DO NOTHING;
  `.execute(db)

  await sql`
    INSERT INTO shifts (id, branch_id, user_id, opening_cash, closing_cash, cash_difference, expected_cash, status, opened_at, closed_at) VALUES
      (${shiftId2}, ${branchIds.HQ}, ${userIds.staff1}, 300000, 450000, 15000, 435000, 'CLOSED', ${new Date(now.getTime() - 86400000).toISOString()}, ${now.toISOString()})
    ON CONFLICT DO NOTHING;
  `.execute(db)

  console.log('  ✅ shifts (2 — 1 open, 1 closed)')

  // ── Sales ──────────────────────────────────────────────────────────────────
  const saleIds: string[] = []

  const sale1Id = uuid()
  saleIds.push(sale1Id)
  await sql`
    INSERT INTO sales (id, branch_id, user_id, total, subtotal, discount_amount, payment_method, payment_status, status, customer_id, created_at) VALUES
      (${sale1Id}, ${branchIds.HQ}, ${userIds.cashier1}, 487500, 525000, 37500, 'CASH', 'PAID', 'COMPLETED', ${customerIds.c1}, ${new Date(now.getTime() - 3600000 * 2).toISOString()})
    ON CONFLICT DO NOTHING;
  `.execute(db)

  const sale2Id = uuid()
  saleIds.push(sale2Id)
  await sql`
    INSERT INTO sales (id, branch_id, user_id, total, subtotal, discount_amount, payment_method, payment_status, status, customer_id, created_at) VALUES
      (${sale2Id}, ${branchIds.HQ}, ${userIds.staff1}, 1250000, 1250000, 0, 'TRANSFER', 'PAID', 'COMPLETED', ${customerIds.c2}, ${new Date(now.getTime() - 86400000).toISOString()})
    ON CONFLICT DO NOTHING;
  `.execute(db)

  const sale3Id = uuid()
  saleIds.push(sale3Id)
  await sql`
    INSERT INTO sales (id, branch_id, user_id, total, subtotal, discount_amount, payment_method, payment_status, status, created_at) VALUES
      (${sale3Id}, ${branchIds.HQ}, ${userIds.cashier1}, 356000, 356000, 0, 'CASH', 'PAID', 'COMPLETED', ${now.toISOString()})
    ON CONFLICT DO NOTHING;
  `.execute(db)

  console.log('  ✅ sales (3)')

  // ── Sale Items ─────────────────────────────────────────────────────────────
  const skus = Object.keys(productIds)
  const skuToPrice: Record<string, number> = {}
  const skuList = [
    { sku: 'STL-6MM-001', price: 45000 }, { sku: 'STL-8MM-001', price: 75000 },
    { sku: 'CMT-SOA-50K', price: 85000 }, { sku: 'PVC-2IN-006', price: 35000 },
    { sku: 'PNT-DULUX-5L', price: 185000 }, { sku: 'TOL-HAM-10IN', price: 55000 },
    { sku: 'ELC-WR-1.5-100', price: 280000 }, { sku: 'ELC-MCB-20A', price: 35000 },
  ]
  for (const s of skuList) skuToPrice[s.sku] = s.price

  // Sale 1 items
  for (const item of [
    { sku: 'STL-6MM-001', qty: 5, price: 45000 },
    { sku: 'STL-8MM-001', qty: 3, price: 75000 },
    { sku: 'CMT-SOA-50K', qty: 2, price: 85000 },
  ]) {
    const pid = productIds[item.sku]
    if (!pid) continue
    await sql`
      INSERT INTO sale_items (sale_id, product_id, quantity, sell_price, sell_unit)
      VALUES (${sale1Id}, ${pid}, ${item.qty}, ${item.price}, 'pcs')
      ON CONFLICT DO NOTHING;
    `.execute(db)
  }

  // Sale 2 items
  for (const item of [
    { sku: 'PNT-DULUX-5L', qty: 4, price: 185000 },
    { sku: 'PNT-MAX-5L', qty: 4, price: 95000 },
    { sku: 'ROF-CGI-035', qty: 3, price: 180000 },
  ]) {
    const pid = productIds[item.sku]
    if (!pid) continue
    await sql`
      INSERT INTO sale_items (sale_id, product_id, quantity, sell_price, sell_unit)
      VALUES (${sale2Id}, ${pid}, ${item.qty}, ${item.price}, 'pcs')
      ON CONFLICT DO NOTHING;
    `.execute(db)
  }

  // Sale 3 items
  for (const item of [
    { sku: 'TOL-HAM-10IN', qty: 4, price: 55000 },
    { sku: 'ELC-WR-1.5-100', qty: 1, price: 280000 },
    { sku: 'ELC-MCB-20A', qty: 2, price: 35000 },
  ]) {
    const pid = productIds[item.sku]
    if (!pid) continue
    await sql`
      INSERT INTO sale_items (sale_id, product_id, quantity, sell_price, sell_unit)
      VALUES (${sale3Id}, ${pid}, ${item.qty}, ${item.price}, 'pcs')
      ON CONFLICT DO NOTHING;
    `.execute(db)
  }

  console.log('  ✅ sale_items (9)')

  // ── Quotations ──────────────────────────────────────────────────────────────
  const quotationId = uuid()
  await sql`
    INSERT INTO quotations (id, customer_id, user_id, total, valid_until, status, created_at) VALUES
      (${quotationId}, ${customerIds.c3}, ${userIds.manager}, 3500000, ${today}, 'DRAFT', ${new Date(now.getTime() - 172800000).toISOString()})
    ON CONFLICT DO NOTHING;
  `.execute(db)

  for (const item of [
    { sku: 'STL-10MM-001', qty: 10, price: 120000 },
    { sku: 'CMT-SOA-50K', qty: 20, price: 85000 },
    { sku: 'ROF-CGI-040', qty: 15, price: 210000 },
  ]) {
    const pid = productIds[item.sku]
    if (!pid) continue
    await sql`
      INSERT INTO quotation_items (quotation_id, product_id, quantity, unit_price)
      VALUES (${quotationId}, ${pid}, ${item.qty}, ${item.price})
      ON CONFLICT DO NOTHING;
    `.execute(db)
  }

  console.log('  ✅ quotations (1) + quotation_items (3)')

  // ── Expenses ───────────────────────────────────────────────────────────────
  await sql`
    INSERT INTO expenses (id, branch_id, category_id, amount, description, date, user_id) VALUES
      (${uuid()}, ${branchIds.HQ}, ${expCatIds.utility}, 450000, 'ເ ເ ເ ເ', ${today}, ${userIds.manager}),
      (${uuid()}, ${branchIds.HQ}, ${expCatIds.salary}, 15000000, 'ເ ເ ເ', ${today}, ${userIds.admin}),
      (${uuid()}, ${branchIds.HQ}, ${expCatIds.transport}, 350000, 'Transport ເ', ${today}, ${userIds.staff1})
    ON CONFLICT DO NOTHING;
  `.execute(db)

  console.log('  ✅ expenses (3)')

  // ── Delivery Orders ────────────────────────────────────────────────────────
  await sql`
    INSERT INTO delivery_orders (id, sale_id, driver_id, vehicle_id, status, delivery_address, created_at) VALUES
      (${uuid()}, ${sale1Id}, ${driverIds.d1}, ${vehicleIds.v1}, 'DELIVERED', 'ເ 24 ເ ເ ເ, ເ 20', ${new Date(now.getTime() - 3600000).toISOString()}),
      (${uuid()}, ${sale2Id}, ${driverIds.d2}, ${vehicleIds.v2}, 'PENDING', 'ໂ 23, ເ 12', ${now.toISOString()})
    ON CONFLICT DO NOTHING;
  `.execute(db)

  console.log('  ✅ delivery_orders (2)')

  // ── Audit Log ──────────────────────────────────────────────────────────────
  await sql`
    INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, new_value) VALUES
      (${uuid()}, ${userIds.admin}, 'LOGIN', 'users', ${userIds.admin}, '{"msg":"Admin login"}'),
      (${uuid()}, ${userIds.admin}, 'CREATE', 'products', NULL, '{"msg":"Product catalog setup"}'),
      (${uuid()}, ${userIds.manager}, 'CREATE', 'shifts', ${shiftId2}, '{"msg":"Shift opened"}')
    ON CONFLICT DO NOTHING;
  `.execute(db)

  console.log('  ✅ audit_log (3)')
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 MHX-POS Seed Script')
  console.log('   PostgreSQL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'))
  console.log('')

  try {
    await createSchema()
    await seedData()
    console.log('')
    console.log('✅ Seed completed successfully!')
    console.log('')
    console.log('📋 Login credentials:')
    console.log('   admin    / password123 — ADMIN')
    console.log('   manager  / password123 — MANAGER')
    console.log('   staff01  / password123 — STAFF')
    console.log('   cashier01/ password123 — CASHIER')
  } catch (err) {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  } finally {
    await db.destroy()
    process.exit(0)
  }
}

main()
