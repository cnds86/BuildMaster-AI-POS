// ─── Simple in-memory rate limiter for auth endpoints ────────────────────────
// C2: Add rate limit on /auth/login and /auth/register — 5 attempts per 15 min per IP/username

interface RateLimitEntry {
  attempts: number
  firstAttempt: number
  blockedUntil: number | null
}

const WINDOW_MS = 15 * 60 * 1000       // 15 minutes
const MAX_ATTEMPTS = 5
const BLOCK_MS = 15 * 60 * 1000        // block for 15 minutes after limit exceeded

const ipRateLimitMap = new Map<string, RateLimitEntry>()
const usernameRateLimitMap = new Map<string, RateLimitEntry>()

function getOrCreateEntry(map: Map<string, RateLimitEntry>, key: string): RateLimitEntry {
  const existing = map.get(key)
  if (existing) return existing
  const entry: RateLimitEntry = { attempts: 0, firstAttempt: 0, blockedUntil: null }
  map.set(key, entry)
  return entry
}

// ─── Check if IP or username is rate limited ──────────────────────────────────
// Returns error object if blocked, null if OK to proceed
export function checkRateLimit(ip: string | undefined, username: string | undefined): { error: string; retryAfter: number } | null {
  const now = Date.now()

  if (ip) {
    const ipEntry = ipRateLimitMap.get(ip)
    if (ipEntry) {
      // Check if currently blocked
      if (ipEntry.blockedUntil !== null && ipEntry.blockedUntil > now) {
        return {
          error: 'Too many login attempts. Please try again after 15 minutes.',
          retryAfter: Math.ceil((ipEntry.blockedUntil - now) / 1000),
        }
      }
      // Check if at max attempts within window — block now BEFORE processing
      if (ipEntry.attempts >= MAX_ATTEMPTS && ipEntry.firstAttempt > now - WINDOW_MS) {
        ipEntry.blockedUntil = now + BLOCK_MS
        return {
          error: 'Too many login attempts. Please try again after 15 minutes.',
          retryAfter: Math.ceil(BLOCK_MS / 1000),
        }
      }
    }
  }

  if (username) {
    const userEntry = usernameRateLimitMap.get(username)
    if (userEntry) {
      if (userEntry.blockedUntil !== null && userEntry.blockedUntil > now) {
        return {
          error: 'Too many login attempts for this account. Please try again after 15 minutes.',
          retryAfter: Math.ceil((userEntry.blockedUntil - now) / 1000),
        }
      }
      if (userEntry.attempts >= MAX_ATTEMPTS && userEntry.firstAttempt > now - WINDOW_MS) {
        userEntry.blockedUntil = now + BLOCK_MS
        return {
          error: 'Too many login attempts for this account. Please try again after 15 minutes.',
          retryAfter: Math.ceil(BLOCK_MS / 1000),
        }
      }
    }
  }

  return null
}

// ─── Record failed auth attempt ───────────────────────────────────────────────
export function recordFailedAuthAttempt(ip: string | undefined, username: string | undefined) {
  const now = Date.now()

  if (ip) {
    const entry = getOrCreateEntry(ipRateLimitMap, ip)
    if (entry.firstAttempt === 0) {
      entry.firstAttempt = now
    }
    if (entry.firstAttempt < now - WINDOW_MS) {
      // Window expired — reset
      entry.attempts = 1
      entry.firstAttempt = now
      entry.blockedUntil = null
    } else {
      entry.attempts++
    }
  }

  if (username) {
    const entry = getOrCreateEntry(usernameRateLimitMap, username)
    if (entry.firstAttempt === 0) {
      entry.firstAttempt = now
    }
    if (entry.firstAttempt < now - WINDOW_MS) {
      entry.attempts = 1
      entry.firstAttempt = now
      entry.blockedUntil = null
    } else {
      entry.attempts++
    }
  }
}