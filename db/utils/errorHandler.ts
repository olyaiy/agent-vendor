/**
 * Standardized database error handler
 * Logs errors and optionally returns a default value or throws
 */
export function handleDbError<T>(
  error: unknown, 
  message: string, 
  defaultValue?: T
): T {
  console.error(`${message}:`, error);
  
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  
  throw error;
} 