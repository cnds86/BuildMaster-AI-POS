import { treaty } from '@elysiajs/eden'
import type { App } from '../../server/index'

// In development, the proxy at /api handles requests. 
// In production, the server runs on the same port.
const baseUrl = window.location.origin
export const api = treaty<App>(baseUrl)
