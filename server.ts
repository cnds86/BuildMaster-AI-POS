
import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const app = new Elysia()
  .use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }))
  
  // --- Products ---
  .group('/api/products', (app) => app
    .get('/', async () => {
      const products = await db.product.findMany({
        include: { variants: true, inventory: true }
      });
      
      // Transform Prisma models to match frontend Product interface
      return products.map(p => ({
        ...p,
        // Aggregate stock from all warehouses
        stock: p.inventory.reduce((acc, inv) => acc + inv.quantity, 0),
        warehouseInventory: p.inventory,
        // Ensure category is a string ID as expected by the UI
        category: p.categoryId || 'Uncategorized'
      }));
    })
    .post('/', async ({ body }) => {
      const data = body as any;
      return await db.product.create({
        data: {
          name: data.name,
          sku: data.sku,
          barcode: data.barcode || '',
          price: data.price,
          unit: data.unit,
          categoryId: data.category,
          inventory: {
            create: { warehouseId: 'wh1', quantity: data.stock || 0 }
          },
          variants: {
            create: data.variants || []
          }
        },
        include: { variants: true, inventory: true }
      });
    }, {
      body: t.Object({
        name: t.String(),
        category: t.String(),
        price: t.Number(),
        unit: t.String(),
        sku: t.String(),
        barcode: t.Optional(t.String()),
        stock: t.Number(),
        variants: t.Optional(t.Array(t.Any()))
      })
    })
  )

  // --- Sales ---
  .group('/api/sales', (app) => app
    .get('/', async () => {
      return await db.sale.findMany({
        include: { items: true, customer: true },
        orderBy: { date: 'desc' },
        take: 100
      });
    })
    .post('/', async ({ body }: any) => {
      return await db.$transaction(async (tx) => {
        const sale = await tx.sale.create({
          data: {
            total: body.total,
            subtotal: body.subtotal,
            paymentMethod: body.paymentMethod,
            paymentStatus: body.paymentStatus,
            customerId: body.customerId,
            userId: body.userId,
            userName: body.userName,
            items: {
              create: body.items.map((item: any) => ({
                productId: item.id,
                variantId: item.selectedVariantId,
                name: item.name,
                quantity: item.quantity,
                sellPrice: item.sellPrice,
                sellUnit: item.sellUnit || item.unit
              }))
            }
          },
          include: { items: true }
        });

        // Deduct stock from default warehouse
        for (const item of body.items) {
          await tx.inventory.updateMany({
            where: { 
              productId: item.id,
              warehouseId: 'wh1' // Default warehouse
            },
            data: { 
              quantity: { decrement: item.quantity } 
            }
          });
        }
        return sale;
      });
    })
  )

  // --- Customers ---
  .get('/api/customers', async () => {
    return await db.customer.findMany({ 
      include: { level: true },
      orderBy: { name: 'asc' }
    });
  })

  .listen({
    port: 3001,
    hostname: '0.0.0.0' // Explicitly bind to all interfaces
  });

console.log(`🚀 Elysia backend running at http://0.0.0.0:3001`);
