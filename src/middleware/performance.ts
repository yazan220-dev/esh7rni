import { NextRequest, NextResponse } from 'next/server';

// This file contains performance monitoring middleware
// It measures page load times and can be used to track performance metrics

export async function middleware(request: NextRequest) {
  // Start timing
  const start = Date.now();
  
  // Continue to the next middleware or route handler
  const response = NextResponse.next();
  
  // Calculate response time
  const responseTime = Date.now() - start;
  
  // Add Server-Timing header
  response.headers.set('Server-Timing', `total;dur=${responseTime}`);
  
  // In a production environment, you would send this data to your analytics service
  // console.log(`[Performance] ${request.nextUrl.pathname} - ${responseTime}ms`);
  
  return response;
}
