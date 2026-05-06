import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { db } from './db.js'

// Create the Elysia App
const app = new Elysia()
  .use(cors())
  .ws('/ws', {
    // Elysia WS support
    message(ws, message) {
      ws.send({ received: message })
    }
  })
  .get('/api/health', () => {
    return { status: 'ok', message: 'Mahaxay AI POS API is running (Elysia + Bun)' }
  })
  .get('/api/products', async () => {
    // If db is not connected (no valid url), return mock data for now
    try {
      const products = await db.selectFrom('products').selectAll().execute()
      return { products }
    } catch(err) {
      console.warn("DB not ready:", err)
      return { products: [] }
    }
  })
  .get('/api/products/:id', async ({ params: { id } }) => {
    // Dynamic route for products
    try {
      const product = await db.selectFrom('products').selectAll().where('id', '=', id).executeTakeFirst()
      if (!product) return { error: 'Not found' }
      return { product }
    } catch(err) {
      return { error: 'DB Error' }
    }
  })
  .post('/api/auth/login', async ({ body, set }) => {
    // Basic mock logic or db logic
    const { username, password } = body
    if (username === 'admin' && password === '123') {
      return { user: { id: '1', username: 'admin', role: 'Admin' }, token: 'mock-token' }
    }
    
    set.status = 401
    return { error: 'Invalid credentials' }
  }, {
    body: t.Object({
      username: t.String(),
      password: t.String()
    })
  });

// Handle serving the frontend (production fallback) if needed
if (process.env.NODE_ENV === 'production') {
  // We can use @elysiajs/static or handle static serving
  const { staticPlugin } = await import('@elysiajs/static')
  app.use(staticPlugin({
    assets: 'dist',
    prefix: '/'
  }))
  // fallback to index.html
  app.get('*', () => {
    return Bun.file('./dist/index.html')
  })
}

const PORT = process.env.NODE_ENV === 'production' ? 3000 : 3001;
app.listen({ port: PORT, hostname: '0.0.0.0' }, () => {
  console.log(`🦊 Elysia server is running at ${app.server?.hostname}:${app.server?.port}`)
});

// Export type for Elysia Eden
export type App = typeof app;
