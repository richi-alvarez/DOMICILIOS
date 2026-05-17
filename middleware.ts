import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { nextUrl } = request

  // Obtener el token JWT desde las cookies
  const token = request.cookies.get('authjs.session-token')?.value ||
                request.cookies.get('__Secure-authjs.session-token')?.value

  const isLoggedIn = !!token

  // Rutas que requieren autenticación
  const isAppRoute = nextUrl.pathname.startsWith('/app')
  const isAuthRoute = ['/login', '/signup'].includes(nextUrl.pathname)

  // Proteger rutas de app
  if (isAppRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/app', nextUrl))
  }

  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:"
  )
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

export const config = {
  matcher: [
    '/app/:path*',
    '/login',
    '/signup',
  ],
}
