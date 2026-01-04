
import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { PrismaClient } from '@prisma/client';

// Fix: Declare Bun global to resolve "Cannot find name 'Bun'" compilation errors
declare const Bun: any;

const db = new PrismaClient();

const app = new Elysia()
  .use(cors())
  
  // --- 1. API Routes (MUST BE FIRST) ---
  // Note: Using absolute paths inside the group to ensure exact matching without trailing slash issues
  .group('/api', (app) => app
    .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
    
    // Products
    .get('/products', async () => {
      try {
        const products = await db.product.findMany({
          include: { variants: true, inventory: true }
        });
        return products.map(p => ({
          ...p,
          stock: p.inventory.reduce((acc, inv) => acc + inv.quantity, 0),
          warehouseInventory: p.inventory,
          category: p.categoryId || 'Uncategorized'
        }));
      } catch (e) {
        console.error("DB Error:", e);
        return [];
      }
    })

    // Sales
    .get('/sales', async () => {
      try {
        return await db.sale.findMany({
          include: { items: true, customer: true },
          orderBy: { date: 'desc' },
          take: 50
        });
      } catch (e) {
        console.error("DB Sales Error:", e);
        return [];
      }
    })
    .post('/sales', async ({ body }: any) => {
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

        for (const item of body.items) {
          await tx.inventory.updateMany({
            where: { productId: item.id, warehouseId: 'wh1' },
            data: { quantity: { decrement: item.quantity } }
          });
        }
        return sale;
      });
    })

    // Customers
    .get('/customers', async () => {
      try {
        return await db.customer.findMany({ include: { level: true } });
      } catch (e) {
        console.error("DB Customers Error:", e);
        return [];
      }
    })
  )

  // --- 2. Static File Serving ---
  .get('/', () => Bun.file('index.html'))
  .get('/index.tsx', () => Bun.file('index.tsx'))
  .get('/index.css', () => Bun.file('index.css'))
  .get('/sw.js', () => Bun.file('sw.js'))
  // Greedy route with check to avoid stealing API calls
  .get('/:file', ({ params: { file } }) => {
    // Explicitly do not handle /api paths as files
    if (file.startsWith('api/')) return new Response('Not Found', { status: 404 });
    const f = Bun.file(file);
    return f.exists().then(exists => exists ? f : new Response('Not Found', { status: 404 }));
  })
  .get('/components/*', ({ path }) => Bun.file(path.slice(1)))
  .get('/context/*', ({ path }) => Bun.file(path.slice(1)))
  .get('/services/*', ({ path }) => Bun.file(path.slice(1)))
  .get('/store/*', ({ path }) => Bun.file(path.slice(1)))
  .get('/lib/*', ({ path }) => Bun.file(path.slice(1)))
  .get('/types.ts', () => Bun.file('types.ts'))

  .listen({
    port: 3001,
    hostname: '0.0.0.0'
  });

console.log(`🚀 BuildMaster Server running at http://localhost:3001`);
