/**
 * MHX-POS — Delivery Routes
 * /api/deliveries (list), /api/deliveries/:id (get/update/delete)
 * Vehicle & driver management is at top-level /api/vehicles and /api/drivers
 */
import { Elysia, t } from 'elysia'
import { db } from '../db.js'

function normalizeStatus(s: string): string {
  switch (s?.toUpperCase()) {
    case 'PENDING': return 'Pending'
    case 'SCHEDULED': return 'Scheduled'
    case 'IN TRANSIT': return 'In Transit'
    case 'DELIVERED': return 'Delivered'
    case 'FAILED': return 'Failed'
    case 'CANCELLED': return 'Cancelled'
    default: return s ?? 'Pending'
  }
}

function mapDelivery(d: any) {
  return {
    id: d.id,
    saleId: d.sale_id ?? '',
    customerName: d.customer_name ?? '',
    customerPhone: d.customer_phone ?? '',
    deliveryAddress: d.delivery_address ?? '',
    status: normalizeStatus(d.status),
    scheduledDate: d.scheduled_date ?? d.created_at,
    vehicleId: d.vehicle_id ?? undefined,
    driverId: d.driver_id ?? undefined,
    notes: d.notes ?? undefined,
    createdAt: d.created_at ? new Date(d.created_at).toISOString() : new Date().toISOString(),
    updatedAt: d.updated_at ? new Date(d.updated_at).toISOString() : new Date().toISOString(),
    completedAt: d.delivered_at ? new Date(d.delivered_at).toISOString() : undefined,
    estimatedWeight: d.estimated_weight ?? undefined,
  }
}

export const deliveryRoutes = (app: Elysia) =>
  app.group('/api/deliveries', (app) =>
    app
      // GET /api/deliveries — list all
      .get('/', async ({ query: { status, driver_id, from_date, to_date } }) => {
        try {
          let q = db.selectFrom('delivery_orders').selectAll()
          if (status) q = q.where('status', '=', status as string)
          if (driver_id) q = q.where('driver_id', '=', driver_id as string)
          if (from_date) q = q.where('created_at', '>=', new Date(from_date as string))
          if (to_date) {
            const end = new Date(to_date as string)
            end.setDate(end.getDate() + 1)
            q = q.where('created_at', '<', end)
          }
          const deliveries = await q.orderBy('created_at', 'desc').limit(200).execute()
          return { deliveries: deliveries.map(mapDelivery) }
        } catch { return { deliveries: [], error: 'Database error' } }
      })

      // GET /api/deliveries/:id
      .get('/:id', async ({ params: { id }, set }) => {
        try {
          const delivery = await db.selectFrom('delivery_orders').selectAll().where('id', '=', id).executeTakeFirst()
          if (!delivery) { set.status = 404; return { error: 'Not found' } }
          return { delivery: mapDelivery(delivery) }
        } catch { return { error: 'Database error' } }
      })

      // POST /api/deliveries
      .post('/', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const token = auth_token?.value
        if (!token) { set.status = 401; return { error: 'Auth required' } }
        try {
          const payload = await (jwtFn as any).verify(token) as { sub?: string } | false
          if (!payload) { set.status = 401; return { error: 'Invalid token' } }
          const { saleId, customerName, customerPhone, deliveryAddress, scheduledDate, estimatedWeight, vehicleId, driverId, notes } = body as any
          if (!customerName || !deliveryAddress || !scheduledDate) {
            set.status = 400; return { error: 'customerName, deliveryAddress, scheduledDate required' }
          }
          const delivery = await db.insertInto('delivery_orders').values({
            sale_id: saleId || null,
            customer_name: customerName,
            customer_phone: customerPhone || null,
            delivery_address: deliveryAddress,
            scheduled_date: new Date(scheduledDate),
            estimated_weight: estimatedWeight || null,
            vehicle_id: vehicleId || null,
            driver_id: driverId || null,
            notes: notes || null,
            status: 'Pending',
          } as any).returningAll().executeTakeFirst()
          return { delivery: mapDelivery(delivery) }
        } catch { return { error: 'Failed to create delivery' } }
      }, {
        body: t.Object({
          saleId: t.Optional(t.String()),
          customerName: t.String(),
          customerPhone: t.Optional(t.String()),
          deliveryAddress: t.String(),
          scheduledDate: t.String(),
          estimatedWeight: t.Optional(t.Number()),
          vehicleId: t.Optional(t.String()),
          driverId: t.Optional(t.String()),
          notes: t.Optional(t.String()),
        }),
      })

      // PUT /api/deliveries/:id
      .put('/:id', async ({ params: { id }, body, set }) => {
        try {
          const { status, vehicleId, driverId, notes, deliveryAddress } = body as any
          const updates: Record<string, unknown> = {}
          if (status !== undefined) {
            const normalized = normalizeStatus(status)
            updates.status = normalized
            if (normalized === 'Delivered') updates.delivered_at = new Date()
          }
          if (vehicleId !== undefined) updates.vehicle_id = vehicleId
          if (driverId !== undefined) updates.driver_id = driverId
          if (notes !== undefined) updates.notes = notes
          if (deliveryAddress !== undefined) updates.delivery_address = deliveryAddress
          updates.updated_at = new Date()
          const delivery = await db.updateTable('delivery_orders').set(updates as any).where('id', '=', id).returningAll().executeTakeFirst()
          if (!delivery) { set.status = 404; return { error: 'Not found' } }
          return { delivery: mapDelivery(delivery) }
        } catch { return { error: 'Failed to update delivery' } }
      })

      // DELETE /api/deliveries/:id
      .delete('/:id', async ({ params: { id }, set }) => {
        try {
          const delivery = await db.selectFrom('delivery_orders').selectAll().where('id', '=', id).executeTakeFirst()
          if (!delivery) { set.status = 404; return { error: 'Not found' } }
          await db.deleteFrom('delivery_orders').where('id', '=', id).execute()
          return { success: true }
        } catch { return { error: 'Failed to delete delivery' } }
      })
  )
