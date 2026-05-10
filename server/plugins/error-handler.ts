import { Elysia } from 'elysia'
import { t } from 'elysia'

// ─── Error Types ──────────────────────────────────────────────────────────────
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const msg = id ? `${resource} '${id}' not found` : `${resource} not found`
    super(404, msg, 'NOT_FOUND', { resource, id })
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, message, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(403, message, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(409, message, 'CONFLICT', details)
    this.name = 'ConflictError'
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(500, message, 'DATABASE_ERROR')
    this.name = 'DatabaseError'
  }
}

// ─── Centralized Error Handler Plugin ─────────────────────────────────────────
const isProd = process.env.NODE_ENV === 'production'

export const errorHandler = new Elysia({ name: 'error-handler' })
  .onError(({ error, set }) => {
    // Check if it's our custom AppError
    if (error instanceof AppError) {
      set.status = error.statusCode
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          timestamp: new Date().toISOString(),
          details: error.details,
        },
      }
    }

    // Elysia validation error
    if (error.type === 'VALIDATION' || (error as any).validator) {
      set.status = 400
      return {
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
          timestamp: new Date().toISOString(),
          details: (error as any).issues || error.message,
        },
      }
    }

    // Generic error
    const statusCode = (error as any).statusCode || 500
    set.status = statusCode

    console.error(`[ERROR] ${error.name}:`, error.stack || error.message)

    return {
      success: false,
      error: {
        message: isProd && statusCode >= 500 ? 'Internal server error' : error.message || 'Unknown error',
        code: (error as any).code || 'INTERNAL_ERROR',
        statusCode,
        timestamp: new Date().toISOString(),
      },
    }
  })

// ─── Helpers (used in route handlers) ─────────────────────────────────────────
export function handleDBError(err: unknown, action = 'database operation'): never {
  console.error(`[DB ERROR] ${action}:`, err)
  if (err instanceof Error && err.message.includes('connection')) {
    throw new AppError(503, 'Database connection unavailable', 'DB_UNAVAILABLE')
  }
  throw new DatabaseError(`Failed to ${action}`)
}