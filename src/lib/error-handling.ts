// Enhanced error handling for API routes
// Place this in /src/lib/error-handling.ts

export interface ApiError extends Error {
  statusCode: number;
  code?: string;
}

export function createApiError(message: string, statusCode: number, code?: string): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  if (code) error.code = code;
  return error;
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);
  
  if ((error as ApiError).statusCode) {
    return new Response(
      JSON.stringify({
        error: (error as Error).message || 'An unexpected error occurred',
        code: (error as ApiError).code || 'INTERNAL_SERVER_ERROR',
      }),
      { 
        status: (error as ApiError).statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Default error response for unhandled errors
  return new Response(
    JSON.stringify({
      error: 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
    }),
    { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Utility to safely parse JSON with error handling
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('JSON Parse Error:', error);
    return fallback;
  }
}

// Utility to safely fetch data with error handling
export async function safeFetch<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw createApiError(
        `Request failed with status ${response.status}`,
        response.status,
        'FETCH_ERROR'
      );
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error('Fetch Error:', error);
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}
