import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * CSRF Protection Middleware
 * This middleware adds CSRF protection to API routes
 */
export function csrfProtection(handler: Function) {
  return async (request: NextRequest) => {
    // Get the origin and referer headers
    const headersList = headers();
    const origin = headersList.get("origin");
    const referer = headersList.get("referer");
    
    // Skip CSRF check for GET requests as they should be idempotent
    if (request.method === "GET") {
      return handler(request);
    }
    
    // Check if the request is coming from our own domain
    const host = request.headers.get("host");
    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`,
      "https://esh7rni.me",
      "https://www.esh7rni.me",
    ];
    
    // In development, allow localhost
    if (process.env.NODE_ENV === "development") {
      allowedOrigins.push("http://localhost:3000");
    }
    
    // If origin header is present, check if it's allowed
    if (origin && !allowedOrigins.includes(origin)) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "CSRF check failed" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // If referer header is present, check if it's from an allowed origin
    if (referer && !allowedOrigins.some(origin => referer.startsWith(origin))) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "CSRF check failed" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // If both origin and referer are missing, reject the request
    if (!origin && !referer && process.env.NODE_ENV === "production") {
      return new NextResponse(
        JSON.stringify({ success: false, error: "CSRF check failed" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // If all checks pass, proceed with the handler
    return handler(request);
  };
}
