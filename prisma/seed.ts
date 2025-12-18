
import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = hashSync('123', 10);

  // 1. Users
  await prisma.user.createMany({
    data: [
      { id: 'u1', username: 'admin', password: hashedPassword, name: 'Owner Admin', role: 'Admin', email: 'admin@buildmaster.com' },
      { id: 'u2', username: 'manager', password: hashedPassword, name: 'Manager Somchai', role: 'Manager', email: 'manager@buildmaster.com' },
      { id: 'u3', username: 'staff', password: hashedPassword, name: 'Staff Somsri', role: 'Staff' },
      { id: 'u4', username: 'cashier', password: hashedPassword, name: 'Cashier Noi', role: 'Cashier' },
    ],
    skipDuplicates: true,
  });

  // ... (Rest of seeding logic for customers, products, etc. remains same)
  // 2. Customers
  await prisma.customer.createMany({
    data: [
      { id: 'c1', code: 'CUST-001', name: 'General Customer', phone: '', loyaltyPoints: 0, address: '' },
      { id: 'c2', code: 'CUST-002', name: 'ABC Construction Co.', phone: '081-234-5678', taxId: '1234567890', address: '88 Sukhumvit Rd', loyaltyPoints: 500 },
      { id: 'c3', code: 'CUST-003', name: 'John Doe', phone: '089-987-6543', loyaltyPoints: 120, email: 'john@example.com' },
    ],
    skipDuplicates: true,
  });

  // 3. Branches
  await prisma.branch.createMany({
    data: [
      { id: 'b1', name: 'Main HQ', address: '123 Construction Ave', phone: '02-123-4567' },
      { id: 'b2', name: 'Downtown Branch', address: '45 City Center Rd', phone: '02-987-6543' },
    ],
    skipDuplicates: true,
  });

  // 4. Warehouses
  await prisma.warehouse.createMany({
    data: [
      { id: 'wh1', branchId: 'b1', name: 'Main Warehouse', code: 'WH-HQ', type: 'General' },
      { id: 'wh2', branchId: 'b1', name: 'Showroom Floor', code: 'SH-HQ', type: 'Showroom' },
      { id: 'wh3', branchId: 'b2', name: 'Downtown Storage', code: 'WH-DT', type: 'General' },
    ],
    skipDuplicates: true,
  });

  // 5. Categories
  await prisma.category.upsert({ where: { id: 'c1' }, update: {}, create: { id: 'c1', name: 'Cement & Concrete' } });
  await prisma.category.upsert({ where: { id: 'c2' }, update: {}, create: { id: 'c2', name: 'Steel & Metal' } });
  await prisma.category.upsert({ where: { id: 'c4' }, update: {}, create: { id: 'c4', name: 'Paints & Finishes' } });
  
  await prisma.category.upsert({ where: { id: 'c1-1' }, update: {}, create: { id: 'c1-1', name: 'Bagged Cement', parentId: 'c1' } });
  await prisma.category.upsert({ where: { id: 'c2-1' }, update: {}, create: { id: 'c2-1', name: 'Rebar', parentId: 'c2' } });

  // 6. Products
  const p1 = await prisma.product.upsert({
    where: { id: 'p1' },
    update: {},
    create: {
      id: 'p1',
      name: 'Portland Cement Type 1',
      sku: 'CEM-001',
      barcode: '885000001',
      categoryId: 'c1-1',
      price: 6.50,
      unit: 'bag',
      minStock: 50,
      physical: { weight: 50, width: 40, height: 10, depth: 60 }
    }
  });

  await prisma.inventory.createMany({
    data: [
      { productId: 'p1', warehouseId: 'wh1', quantity: 400 },
      { productId: 'p1', warehouseId: 'wh2', quantity: 50 }
    ],
    skipDuplicates: true
  });

  const p2 = await prisma.product.upsert({
    where: { id: 'p2' },
    update: {},
    create: {
      id: 'p2',
      name: 'Red Brick',
      sku: 'BRK-002',
      barcode: '885000002',
      categoryId: 'c1',
      price: 0.85,
      unit: 'pc',
      minStock: 2000,
      variants: {
        create: [
          { id: 'v2-1', name: 'Pallet', code: 'BRK-002-PAL', barcode: '885000002P', conversionFactor: 500, price: 400.00 }
        ]
      }
    }
  });

  await prisma.inventory.create({
    data: { productId: 'p2', warehouseId: 'wh1', quantity: 12500 },
    skipDuplicates: true
  });

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    (process as any).exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
