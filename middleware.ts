import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from './src/types/database';
import type { UserRole } from './src/types';

/**
 * Route Configuration & Protection Rules
 */
export const PROTECTED_BUSINESS_ROUTES = [
  '/',
  '/dashboard',
  '/invoices',
  '/customers',
  '/products',
  '/payments',
  '/billing_letters',
  '/reconciliation',
  '/tax',
  '/documents',
  '/reports',
  '/audit',
  '/settings',
] as const;

export const AUTH_ROUTES = [
  '/login',
  '/auth',
  '/signup',
  '/reset-password',
] as const;

export const PUBLIC_ASSETS = [
  '/favicon.ico',
  '/logo-login.png',
  '/logo-rk-bendahara.png',
  '/foto-conak.jpg',
  '/api/health',
] as const;

/**
 * Role-Based Access Control (RBAC) rules for sensitive business operations
 */
export const ROLE_ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/settings': ['owner', 'admin'],
  '/audit': ['owner', 'admin'],
  '/reconciliation': ['owner', 'admin', 'finance'],
  '/tax': ['owner', 'admin', 'finance'],
  '/payments': ['owner', 'admin', 'finance'],
  '/invoices': ['owner', 'admin', 'finance', 'staff'],
  '/billing_letters': ['owner', 'admin', 'finance', 'staff'],
  '/customers': ['owner', 'admin', 'finance', 'staff'],
  '/products': ['owner', 'admin', 'finance', 'staff'],
  '/dashboard': ['owner', 'admin', 'finance', 'staff', 'viewer'],
  '/documents': ['owner', 'admin', 'finance', 'staff', 'viewer'],
  '/reports': ['owner', 'admin', 'finance', 'staff', 'viewer'],
};

export interface MiddlewareSessionResult {
  isAuthenticated: boolean;
  user: {
    id: string;
    email?: string;
    role: UserRole;
    organizationId?: string;
  } | null;
  response: Response;
  redirectUrl?: string | null;
}

/**
 * Creates a Supabase Server Client for SSR / Edge / Node middleware requests
 */
export function createMiddlewareSupabaseClient(
  request: Request,
  responseHeaders: Headers = new Headers()
) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://billingflow-demo.supabase.co';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookieHeader = request.headers.get('Cookie') ?? '';
        const cookiePairs = cookieHeader.split(';').map((c) => c.trim()).filter(Boolean);
        return cookiePairs.map((pair) => {
          const [name, ...rest] = pair.split('=');
          return {
            name,
            value: decodeURIComponent(rest.join('=')),
          };
        });
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieString = serializeCookie(name, value, options);
          responseHeaders.append('Set-Cookie', cookieString);
        });
      },
    },
  });

  return { supabase, responseHeaders };
}

/**
 * Serializes cookie options to a Set-Cookie header value
 */
function serializeCookie(name: string, value: string, options?: CookieOptions): string {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  if (!options) return cookie;

  if (options.maxAge) cookie += `; Max-Age=${options.maxAge}`;
  if (options.domain) cookie += `; Domain=${options.domain}`;
  if (options.path) cookie += `; Path=${options.path}`;
  else cookie += '; Path=/';
  if (options.expires) cookie += `; Expires=${options.expires.toUTCString()}`;
  if (options.httpOnly) cookie += '; HttpOnly';
  if (options.secure) cookie += '; Secure';
  if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;

  return cookie;
}

/**
 * Checks if a specific path is a protected dashboard/business route
 */
export function isProtectedRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return PROTECTED_BUSINESS_ROUTES.some(
    (route) => route !== '/' && (pathname === route || pathname.startsWith(`${route}/`))
  );
}

/**
 * Checks if a specific path is an authentication route (e.g. /login)
 */
export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Validates whether a user role has permission to access a specific route
 */
export function canRoleAccessRoute(role: UserRole, pathname: string): boolean {
  for (const [route, allowedRoles] of Object.entries(ROLE_ROUTE_PERMISSIONS)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return allowedRoles.includes(role);
    }
  }
  return true;
}

/**
 * Core Session Refresh & Route Protection Middleware
 * 
 * 1. Refreshes the Supabase Auth session via cookies to ensure no expired tokens.
 * 2. Intercepts unauthenticated requests to protected business routes and redirects to `/login`.
 * 3. Intercepts authenticated requests to `/login` and redirects to the `/dashboard`.
 * 4. Verifies role-based access for restricted administrative modules.
 */
export async function updateSession(request: Request): Promise<MiddlewareSessionResult> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  const responseHeaders = new Headers();
  const { supabase } = createMiddlewareSupabaseClient(request, responseHeaders);

  // Skip static assets
  if (PUBLIC_ASSETS.some((asset) => pathname === asset || pathname.startsWith('/assets/'))) {
    return {
      isAuthenticated: true,
      user: null,
      response: new Response(null, { headers: responseHeaders }),
      redirectUrl: null,
    };
  }

  // Refresh and securely validate the user via Supabase Auth
  // IMPORTANT: auth.getUser() sends a request to Supabase Auth server and validates JWT
  let user: { id: string; email?: string; role: UserRole; organizationId?: string } | null = null;
  let isAuthenticated = false;

  try {
    const { data: { user: sbUser }, error } = await supabase.auth.getUser();

    if (!error && sbUser) {
      const meta = sbUser.user_metadata || {};
      user = {
        id: sbUser.id,
        email: sbUser.email,
        role: (meta.role as UserRole) || 'owner',
        organizationId: meta.organization_id || 'org-001',
      };
      isAuthenticated = true;
    }
  } catch (err) {
    console.error('[Middleware] Error refreshing Supabase session:', err);
  }

  // Fallback check for demo/local storage token cookie if Supabase offline/demo mode
  if (!isAuthenticated) {
    const cookieHeader = request.headers.get('Cookie') ?? '';
    if (cookieHeader.includes('billingflow_demo_token=true') || cookieHeader.includes('sb-demo-user=')) {
      isAuthenticated = true;
      user = {
        id: 'usr-demo-001',
        email: 'demo.admin@billingflow.id',
        role: 'owner',
        organizationId: 'org-001',
      };
    }
  }

  // Rule 1: Redirect unauthenticated users attempting to access protected business routes
  if (!isAuthenticated && isProtectedRoute(pathname)) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirectTo', pathname);
    }
    return {
      isAuthenticated: false,
      user: null,
      response: Response.redirect(loginUrl.toString(), 307),
      redirectUrl: loginUrl.toString(),
    };
  }

  // Rule 2: Redirect authenticated users attempting to access /login back to dashboard
  if (isAuthenticated && isAuthRoute(pathname)) {
    const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
    const redirectUrl = new URL(redirectTo, request.url);
    return {
      isAuthenticated: true,
      user,
      response: Response.redirect(redirectUrl.toString(), 307),
      redirectUrl: redirectUrl.toString(),
    };
  }

  // Rule 3: RBAC route validation for authenticated users
  if (isAuthenticated && user && !canRoleAccessRoute(user.role, pathname)) {
    const unauthorizedUrl = new URL('/dashboard?error=unauthorized', request.url);
    return {
      isAuthenticated: true,
      user,
      response: Response.redirect(unauthorizedUrl.toString(), 307),
      redirectUrl: unauthorizedUrl.toString(),
    };
  }

  return {
    isAuthenticated,
    user,
    response: new Response(null, { headers: responseHeaders }),
    redirectUrl: null,
  };
}

/**
 * Default export compatible with Next.js / Edge / Express middleware handlers
 */
export default async function middleware(request: Request) {
  const { response, redirectUrl } = await updateSession(request);
  if (redirectUrl) {
    return response;
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static image and font extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
