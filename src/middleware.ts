import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Paths that don't require authentication
const publicPaths = ["/", "/login", "/register", "/api/auth"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if path is public
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  )
  
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // Check for session cookie
  const sessionCookie = request.cookies.get("better-auth.session_token")
  
  if (!sessionCookie) {
    // Redirect to login
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
