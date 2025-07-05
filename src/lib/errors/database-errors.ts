import { Prisma } from '@prisma/client';
import { APIError, ConflictError, NotFoundError, ValidationError } from './api-errors';

/**
 * Database error handler for Prisma operations
 */
export function handleDatabaseError(error: unknown): never {
  // Handle Prisma-specific errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        throw new ConflictError('Resource already exists');
      case 'P2025': // Record not found
        throw new NotFoundError('Resource not found');
      case 'P2003': // Foreign key constraint
        throw new ValidationError('Invalid reference to related resource');
      case 'P2005': // Invalid value
        throw new ValidationError('Invalid data provided');
      default:
        console.error('Database error:', error);
        throw new APIError('Database operation failed');
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new ValidationError('Invalid data format');
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error('Database connection error:', error);
    throw new APIError('Database connection failed', 503);
  }

  // Re-throw if already an APIError
  if (error instanceof APIError) {
    throw error;
  }

  // Generic database error
  console.error('Unexpected database error:', error);
  throw new APIError('Database operation failed');
}

/**
 * Wrapper for database operations with error handling
 */
export async function withDatabaseErrorHandler<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    handleDatabaseError(error);
  }
}
