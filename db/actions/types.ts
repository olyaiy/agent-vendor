import { ZodIssue } from 'zod';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: ZodIssue[] /* or Record<string, string[]> or any */ };
