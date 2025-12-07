import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Only protect /admin routes (but not /admin/signin or /admin/login)
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Allow access to admin signin/login pages without token
  if (pathname === '/admin/signin' || pathname === '/admin/login') {
    return NextResponse.next()
  }

  // Get auth token from cookies or localStorage (passed in header)
  const token = request.cookies.get('authToken')?.value

  // If no token and trying to access protected admin route, redirect to admin signin
  if (!token) {
    return NextResponse.redirect(new URL('/admin/signin', request.url))
  }

  // Optional: You could validate the token here by making a request to your backend
  // For now, we'll let the client-side validation handle the admin_role check

  return NextResponse.next()
}

// Configure which routes to protect
export const config = {
  matcher: [
    // Protect all admin routes
    '/admin/:path*',
  ],
}
