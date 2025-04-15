// Enhanced API route wrapper with error handling
// Place this in /src/lib/api-wrapper.ts

import { handleApiError } from './error-handling';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

type ApiHandler = (
  req: Request,
  params: { [key: string]: string }
) => Promise<Response>;

export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (req: Request, params: { [key: string]: string }) => {
    try {
      return await handler(req, params);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function methodRouter(handlers: Partial<Record<HttpMethod, ApiHandler>>) {
  return async (req: Request, params: { [key: string]: string }): Promise<Response> => {
    const method = req.method as HttpMethod;
    
    // Check if the method is supported
    if (!handlers[method]) {
      return new Response(
        JSON.stringify({ error: `Method ${method} not allowed` }),
        { 
          status: 405,
          headers: { 'Content-Type': 'application/json', 'Allow': Object.keys(handlers).join(', ') }
        }
      );
    }
    
    // Call the handler with error handling
    return withErrorHandling(handlers[method]!)(req, params);
  };
}
