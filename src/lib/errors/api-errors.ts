/**
 * Centralized error handling utilities for API routes
 */

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string, public details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends APIError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

/**
 * Error handler wrapper for API routes
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Log error for debugging
      console.error('API Error:', error);
      
      // Re-throw known API errors
      if (error instanceof APIError) {
        throw error;
      }
      
      // Convert known error messages to appropriate API errors
      if (error instanceof Error) {
        if (error.message === 'Authentication required') {
          throw new AuthenticationError();
        }
        if (error.message === 'Admin access required') {
          throw new AuthorizationError('Admin access required');
        }
        if (error.message === 'User not found') {
          throw new NotFoundError('User not found');
        }
        if (error.message === 'Email already exists') {
          throw new ConflictError('Email already exists');
        }
      }
      
      // Fallback to generic server error
      throw new APIError('Internal server error');
    }
  };
}

/**
 * Express-style error response handler for Next.js
 */
export function createErrorResponse(error: unknown) {
  if (error instanceof APIError) {
    return {
      error: error.message,
      code: error.code,
      ...(error instanceof ValidationError && { details: error.details })
    };
  }
  
  // Generic fallback
  return {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  };
}
