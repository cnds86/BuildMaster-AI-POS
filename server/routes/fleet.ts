/**
 * MHX-POS — Fleet Routes
 * Top-level vehicle & driver management (mirrors /api/deliveries/vehicles|drivers)
 * GET/POST/PUT/DELETE /api/vehicles, /api/drivers
 */
import { Elysia, t } from 'elysia'
import { db } from '../db.js'

// ─── Mappers (same as delivery.ts) ────────────────────────────────────────────

function mapVehicle(v: any) {
  return {
    id: v.id,
    plateNumber: v.plate_number,
    type: v.vehicle_type,
    capacityWeight: v.capacity_weight ?? 0,
    capacityVolume: v.capacity_volume ?? undefined,
    status: v.status ?? 'Available',
    branchId: v.branch_id ?? '',
  }
}

function mapDriver(d: any) {
  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    licenseNumber: d.license_plate ?? '',
    status: d.status ?? 'Available',
    branchId: d.branch_id ?? '',
  }
}

export const fleetRoutes = (app: Elysia) =>
  app.group('/api', (app) =>

    // ── Vehicles ─────────────────────────────────────────────────────────────
    app.group('/vehicles', (app) =>
      app
        .get('/', async ({ query: { branch_id, status } }) => {
          try {
            let q = db.selectFrom('vehicles').selectAll().where('active', '=', true)
            if (branch_id) q = q.where('branch_id', '=', branch_id as string)
            if (status) q = q.where('status', '=', status as string)
            const vehicles = await q.execute()
            return { vehicles: vehicles.map(mapVehicle) }
          } catch { return { vehicles: [], error: 'Database error' } }
        })

        .post('/', async ({ body, set }) => {
          try {
            const { plateNumber, type, capacityWeight, capacityVolume, branchId } = body as {
              plateNumber: string; type: string; capacityWeight?: number; capacityVolume?: number; branchId?: string
            }
            if (!plateNumber || !type) { set.status = 400; return { error: 'plateNumber and type required' } }
            const vehicle = await db.insertInto('vehicles').values({
              plate_number: plateNumber,
              vehicle_type: type,
              capacity_weight: capacityWeight || 0,
              capacity_volume: capacityVolume || null,
              branch_id: branchId || null,
              status: 'Available',
              active: true,
            } as any).returningAll().executeTakeFirst()
            return { vehicle: mapVehicle(vehicle) }
          } catch { return { error: 'Failed to create vehicle' } }
        }, {
          body: t.Object({
            plateNumber: t.String(),
            type: t.String(),
            capacityWeight: t.Optional(t.Number()),
            capacityVolume: t.Optional(t.Number()),
            branchId: t.Optional(t.String()),
          }),
        })

        .put('/:id', async ({ params: { id }, body, set }) => {
          try {
            const { plateNumber, type, capacityWeight, capacityVolume, status } = body as any
            const updates: Record<string, unknown> = {}
            if (plateNumber !== undefined) updates.plate_number = plateNumber
            if (type !== undefined) updates.vehicle_type = type
            if (capacityWeight !== undefined) updates.capacity_weight = capacityWeight
            if (capacityVolume !== undefined) updates.capacity_volume = capacityVolume
            if (status !== undefined) updates.status = status
            updates.updated_at = new Date()
            const vehicle = await db.updateTable('vehicles').set(updates as any).where('id', '=', id).returningAll().executeTakeFirst()
            if (!vehicle) { set.status = 404; return { error: 'Not found' } }
            return { vehicle: mapVehicle(vehicle) }
          } catch { return { error: 'Failed to update vehicle' } }
        })

        .delete('/:id', async ({ params: { id }, set }) => {
          try {
            const vehicle = await db.updateTable('vehicles').set({ active: false, updated_at: new Date() } as any).where('id', '=', id).returningAll().executeTakeFirst()
            if (!vehicle) { set.status = 404; return { error: 'Not found' } }
            return { success: true }
          } catch { return { error: 'Failed to delete vehicle' } }
        })
    )

    // ── Drivers ─────────────────────────────────────────────────────────────────
    .group('/drivers', (app) =>
      app
        .get('/', async ({ query: { branch_id, status } }) => {
          try {
            let q = db.selectFrom('drivers').selectAll().where('active', '=', true)
            if (branch_id) q = q.where('branch_id', '=', branch_id as string)
            if (status) q = q.where('status', '=', status as string)
            const drivers = await q.execute()
            return { drivers: drivers.map(mapDriver) }
          } catch { return { drivers: [], error: 'Database error' } }
        })

        .post('/', async ({ body, set }) => {
          try {
            const { name, phone, licenseNumber, branchId } = body as {
              name: string; phone: string; licenseNumber?: string; branchId?: string
            }
            if (!name || !phone) { set.status = 400; return { error: 'name and phone required' } }
            const driver = await db.insertInto('drivers').values({
              name,
              phone,
              license_plate: licenseNumber || null,
              branch_id: branchId || null,
              status: 'Available',
              active: true,
            } as any).returningAll().executeTakeFirst()
            return { driver: mapDriver(driver) }
          } catch { return { error: 'Failed to create driver' } }
        }, {
          body: t.Object({
            name: t.String(),
            phone: t.String(),
            licenseNumber: t.Optional(t.String()),
            branchId: t.Optional(t.String()),
          }),
        })

        .put('/:id', async ({ params: { id }, body, set }) => {
          try {
            const { name, phone, licenseNumber, status } = body as any
            const updates: Record<string, unknown> = {}
            if (name !== undefined) updates.name = name
            if (phone !== undefined) updates.phone = phone
            if (licenseNumber !== undefined) updates.license_plate = licenseNumber
            if (status !== undefined) updates.status = status
            updates.updated_at = new Date()
            const driver = await db.updateTable('drivers').set(updates as any).where('id', '=', id).returningAll().executeTakeFirst()
            if (!driver) { set.status = 404; return { error: 'Not found' } }
            return { driver: mapDriver(driver) }
          } catch { return { error: 'Failed to update driver' } }
        })

        .delete('/:id', async ({ params: { id }, set }) => {
          try {
            const driver = await db.updateTable('drivers').set({ active: false, updated_at: new Date() } as any).where('id', '=', id).returningAll().executeTakeFirst()
            if (!driver) { set.status = 404; return { error: 'Not found' } }
            return { success: true }
          } catch { return { error: 'Failed to delete driver' } }
        })
    )
  )
