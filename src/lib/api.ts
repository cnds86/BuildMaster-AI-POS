/**
 * MHX-POS API Client
 * Fetch wrapper with JWT cookie injection + error handling.
 * Uses Elysia/Eden treaty-style calls but falls back to native fetch
 * so it works through the Vite proxy (/api/* → backend :3006).
 */

import { treaty } from '@elysiajs/eden'
import type { App } from '../../server/index'

// ─── Error Types ────────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── Token Storage ─────────────────────────────────────────────────────────────
const TOKEN_KEY = 'mhx_auth_token'

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Ignore quota exceeded, etc.
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ignore
  }
}

// ─── Fetch with JWT ────────────────────────────────────────────────────────────
async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = getStoredToken()
  const headers = new Headers(init?.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  // Always send cookies (Needed for auth_token cookie from backend)
  return fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  })
}

// ─── Typed API responses ───────────────────────────────────────────────────────
export interface HealthResponse {
  status: 'ok'
  timestamp: string
  version: string
  environment: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token?: string
  user?: {
    id: string
    username: string
    name: string
    role: string
    branchId?: string
  }
  error?: string
}

export interface CartPayload {
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
    sellPrice: number
    sellUnit: string
    sellConversionFactor: number
  }>
  customerId?: string
  branchId?: string
  posId?: string
}

export interface SalePayload {
  items: CartPayload['items']
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  roundingDifference?: number
  paymentMethod: 'cash' | 'card' | 'transfer' | 'qr' | 'credit'
  paymentStatus: 'paid' | 'unpaid' | 'partial'
  amountReceived?: number
  change?: number
  customerId?: string
  userId?: string
  branchId?: string
  posId?: string
  type?: 'sale' | 'return'
  originalSaleId?: string
}

// ─── API Client ────────────────────────────────────────────────────────────────
const baseUrl = '/api'  // Proxy through Vite

export const api = {
  health: (): Promise<HealthResponse> =>
    fetchWithAuth(`${baseUrl}/health`).then(r => r.json()),

  auth: {
    login: (body: LoginRequest): Promise<LoginResponse> =>
      fetchWithAuth(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include', // Needed to RECEIVE the auth_token cookie
      }).then(async r => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new ApiError(data.error || 'Login failed', r.status, data)
        // Extract JWT from Bearer response or from cookie
        if (data.token) setStoredToken(data.token)
        return data as LoginResponse
      }),

    logout: (): Promise<void> =>
      fetchWithAuth(`${baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      }).then(() => {
        clearStoredToken()
      }),

    me: (): Promise<{ user: LoginResponse['user'] }> =>
      fetchWithAuth(`${baseUrl}/auth/me`, {
        credentials: 'include',
      }).then(async r => {
        if (r.status === 401) return { user: undefined as any }
        if (!r.ok) throw new ApiError('Failed to fetch user', r.status)
        return r.json()
      }),
  },

  cart: {
    sync: (payload: CartPayload): Promise<{ success: boolean }> =>
      fetchWithAuth(`${baseUrl}/pos/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async r => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}))
          throw new ApiError('Cart sync failed', r.status, data)
        }
        return r.json()
      }),

    get: (branchId?: string, posId?: string): Promise<CartPayload> =>
      fetchWithAuth(`${baseUrl}/pos/cart?branchId=${branchId || ''}&posId=${posId || ''}`, {
        credentials: 'include',
      }).then(async r => {
        if (!r.ok) throw new ApiError('Failed to get cart', r.status)
        return r.json()
      }),
  },

  orders: {
    create: (payload: SalePayload): Promise<{ id: string }> =>
      fetchWithAuth(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async r => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}))
          throw new ApiError('Order creation failed', r.status, data)
        }
        return r.json()
      }),

    list: (params?: { page?: number; limit?: number; branchId?: string }): Promise<{
      data: SalePayload[]
      total: number
    }> =>
      fetchWithAuth(`${baseUrl}/orders?page=${params?.page || 1}&limit=${params?.limit || 50}&branchId=${params?.branchId || ''}`, {
        credentials: 'include',
      }).then(async r => {
        if (!r.ok) throw new ApiError('Failed to list orders', r.status)
        return r.json()
      }),

    void: (id: string): Promise<{ success: boolean }> =>
      fetchWithAuth(`${baseUrl}/orders/${id}/void`, {
        method: 'POST',
        credentials: 'include',
      }).then(async r => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}))
          throw new ApiError('Void failed', r.status, data)
        }
        return r.json()
      }),
  },

  shifts: {
    open: (payload: { branchId: string; posId?: string; startCash: number }): Promise<Shift> =>
      fetchWithAuth(`${baseUrl}/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async r => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}))
          throw new ApiError('Failed to open shift', r.status, data)
        }
        return r.json()
      }),

    close: (id: string, payload: { endCash: number; notes?: string }): Promise<Shift> =>
      fetchWithAuth(`${baseUrl}/shifts/${id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async r => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}))
          throw new ApiError('Failed to close shift', r.status, data)
        }
        return r.json()
      }),

    cashIn: (shiftId: string, payload: { amount: number; reason: string }): Promise<{ success: boolean }> =>
      fetchWithAuth(`${baseUrl}/shifts/${shiftId}/cash-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async r => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}))
          throw new ApiError('Cash in failed', r.status, data)
        }
        return r.json()
      }),

    cashOut: (shiftId: string, payload: { amount: number; reason: string }): Promise<{ success: boolean }> =>
      fetchWithAuth(`${baseUrl}/shifts/${shiftId}/cash-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async r => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}))
          throw new ApiError('Cash out failed', r.status, data)
        }
        return r.json()
      }),
  },

  products: {
    list: (params?: { category?: string; search?: string }): Promise<Product[]> =>
      fetchWithAuth(`${baseUrl}/products?category=${params?.category || ''}&search=${params?.search || ''}`, {
        credentials: 'include',
      }).then(async r => {
        if (!r.ok) throw new ApiError('Failed to list products', r.status)
        return r.json()
      }),
  },

 branches: {
    list: (): Promise<Branch[]> =>
      fetchWithAuth(`${baseUrl}/branches`, {
        credentials: 'include',
      }).then(async r => {
        if (!r.ok) throw new ApiError('Failed to list branches', r.status)
        return r.json()
      }),
  },
}
