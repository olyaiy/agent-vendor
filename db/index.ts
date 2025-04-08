import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

// Log the DATABASE_URL to check if it's defined
console.log('DATABASE_URL defined:', !!process.env.DATABASE_URL);
// Don't log the actual URL as it contains sensitive information

// Create a Neon SQL client first
const sql = neon(process.env.DATABASE_URL!);
// Then pass the SQL client to drizzle
export const db = drizzle(sql);
