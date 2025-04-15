import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the token from the request
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  // Define public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/auth/signin",
    "/auth/signup",
    "/auth/verify-request",
    "/auth/error",
    "/services",
    "/pricing",
    "/about",
    "/contact",
    "/terms",
    "/privacy",
  ];
  
  // Check if the path starts with any of these prefixes
  const isPublicApiRoute = 
    pathname.startsWith("/api/auth") || 
    pathname.startsWith("/_next") || 
    pathname.startsWith("/images") || 
    pathname.startsWith("/fonts");
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Admin routes check
  const isAdminRoute = pathname.startsWith("/dashboard/admin");
  
  // Dashboard routes check
  const isDashboardRoute = pathname.startsWith("/dashboard");
  
  // If it's a public route or API route, allow access
  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next();
  }
  
  // If not authenticated and trying to access protected route, redirect to signin
  if (!token && isDashboardRoute) {
    const url = new URL("/auth/signin", request.url);
    url.searchParams.set("callbackUrl", encodeURI(request.url));
    return NextResponse.redirect(url);
  }
  
  // If authenticated but not admin and trying to access admin route, redirect to dashboard
  if (token && isAdminRoute && token.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  // Otherwise, allow access
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
