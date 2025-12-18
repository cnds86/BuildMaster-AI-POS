
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Only protect API routes
  if (path.startsWith('/api/')) {
    
    // 1. Skip public/auth routes
    if (path.includes('/auth/login')) {
      return NextResponse.next();
    }

    // 2. Verify Authentication (Cookie Check)
    // In a production app, verify a signed JWT here.
    const userRole = request.cookies.get('user_role')?.value;

    if (!userRole) {
      return NextResponse.json(
        { error: 'Unauthorized: Please login first' },
        { status: 401 }
      );
    }

    // 3. Enforce Role-Based Access Control (RBAC)
    
    // User Management: Admin Only
    if (path.startsWith('/api/users') && request.method !== 'GET') {
       // Allow GET for Managers to see list, but modify strictly for Admin
       if (userRole !== 'Admin') {
         return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
       }
    }

    // Settings: Admin Only
    if (path.startsWith('/api/settings') && request.method !== 'GET') {
       if (userRole !== 'Admin') {
         return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
       }
    }

    // Stock Approvals: Admin or Manager
    if (path.includes('/approvals')) {
       if (userRole !== 'Admin' && userRole !== 'Manager') {
         return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
       }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
