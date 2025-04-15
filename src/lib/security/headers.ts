import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Security Headers Middleware
 * This middleware adds security headers to all responses
 */
export function securityHeaders(handler: Function) {
  return async (request: NextRequest) => {
    // Get the response from the handler
    const response = await handler(request);
    
    // Clone the response to avoid modifying the original
    const newResponse = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
    
    // Copy the original response status and body
    newResponse.status = response.status;
    newResponse.body = response.body;
    
    // Add security headers
    const responseHeaders = new Headers(response.headers);
    
    // Content-Security-Policy
    responseHeaders.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.google-analytics.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.smmcost.com https://www.google-analytics.com; frame-src 'self' https://www.youtube.com https://player.vimeo.com; object-src 'none';"
    );
    
    // X-XSS-Protection
    responseHeaders.set("X-XSS-Protection", "1; mode=block");
    
    // X-Frame-Options
    responseHeaders.set("X-Frame-Options", "SAMEORIGIN");
    
    // X-Content-Type-Options
    responseHeaders.set("X-Content-Type-Options", "nosniff");
    
    // Referrer-Policy
    responseHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
    
    // Permissions-Policy
    responseHeaders.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), interest-cohort=()"
    );
    
    // Strict-Transport-Security
    if (process.env.NODE_ENV === "production") {
      responseHeaders.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload"
      );
    }
    
    // Copy all headers to the new response
    responseHeaders.forEach((value, key) => {
      newResponse.headers.set(key, value);
    });
    
    return newResponse;
  };
}
