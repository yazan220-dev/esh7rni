import { NextRequest, NextResponse } from "next/server";
import { csrfProtection } from "@/lib/auth/csrf";
import { sanitizeInput } from "@/lib/security/sanitize";
import { securityHeaders } from "@/lib/security/headers";

/**
 * API Route Security Middleware
 * This middleware combines CSRF protection, input sanitization, and security headers
 */
export function apiSecurity(handler: Function) {
  // Apply middlewares in sequence
  return securityHeaders(
    csrfProtection(
      sanitizeInput(handler)
    )
  );
}

/**
 * Validate request data against a schema
 */
export function validateRequest(request: NextRequest, schema: any) {
  try {
    // Clone the request to avoid modifying the original
    const clonedRequest = request.clone();
    
    // Get the request body
    return clonedRequest.json().then(body => {
      // Validate the body against the schema
      const { error, value } = schema.validate(body, {
        abortEarly: false,
        stripUnknown: true,
      });
      
      if (error) {
        // Return validation errors
        return {
          success: false,
          errors: error.details.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        };
      }
      
      // Return validated data
      return {
        success: true,
        data: value,
      };
    });
  } catch (error) {
    // Return error if request body cannot be parsed
    return Promise.resolve({
      success: false,
      errors: [{ field: 'body', message: 'Invalid JSON body' }],
    });
  }
}

/**
 * Rate limiting middleware
 */
const rateLimit = new Map();

export function rateLimiter(handler: Function, options: { limit: number, window: number }) {
  return async (request: NextRequest) => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const key = `${ip}:${request.url}`;
    const now = Date.now();
    
    // Get current rate limit data for this IP and endpoint
    const rateLimitData = rateLimit.get(key) || {
      count: 0,
      resetAt: now + options.window,
    };
    
    // Reset count if window has expired
    if (now > rateLimitData.resetAt) {
      rateLimitData.count = 0;
      rateLimitData.resetAt = now + options.window;
    }
    
    // Increment count
    rateLimitData.count += 1;
    
    // Update rate limit data
    rateLimit.set(key, rateLimitData);
    
    // Check if rate limit exceeded
    if (rateLimitData.count > options.limit) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Rate limit exceeded' }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': `${Math.ceil((rateLimitData.resetAt - now) / 1000)}`
          } 
        }
      );
    }
    
    // Proceed with the handler
    return handler(request);
  };
}
