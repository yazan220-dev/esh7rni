import { NextRequest, NextResponse } from "next/server";

/**
 * Input Sanitization Middleware
 * This middleware sanitizes input data to prevent XSS attacks
 */
export function sanitizeInput(handler: Function) {
  return async (request: NextRequest) => {
    // Only process POST, PUT, and PATCH requests
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      try {
        // Clone the request to avoid modifying the original
        const clonedRequest = request.clone();
        
        // Get the request body
        const body = await clonedRequest.json();
        
        // Sanitize the body recursively
        const sanitizedBody = sanitizeObject(body);
        
        // Create a new request with the sanitized body
        const sanitizedRequest = new NextRequest(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(sanitizedBody),
        });
        
        // Pass the sanitized request to the handler
        return handler(sanitizedRequest);
      } catch (error) {
        // If there's an error parsing the body, proceed with the original request
        console.error("Error sanitizing input:", error);
        return handler(request);
      }
    }
    
    // For other methods, proceed with the original request
    return handler(request);
  };
}

/**
 * Sanitize a string to prevent XSS attacks
 */
function sanitizeString(input: string): string {
  if (!input) return input;
  
  // Replace potentially dangerous characters with HTML entities
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === "string") {
    return sanitizeString(obj);
  }
  
  if (typeof obj === "number" || typeof obj === "boolean") {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === "object") {
    const sanitized: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}
