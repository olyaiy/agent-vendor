import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local' }); // Load .env.local at the start

// Add a log right after loading dotenv
console.log('[db/index.ts] DATABASE_URL after dotenv load:', process.env.DATABASE_URL ? 'Defined' : 'Undefined');

// Log the DATABASE_URL to check if it's defined
console.log('DATABASE_URL defined:', !!process.env.DATABASE_URL);
console.log('[db/index.ts] Attempting to read DATABASE_URL just before neon() call:', typeof process.env.DATABASE_URL);
// Don't log the actual URL as it contains sensitive information

// Create a Neon SQL client first
// If the above log shows 'undefined', the connection will fail here.
const sql = neon(process.env.DATABASE_URL!);


// Then pass the SQL client to drizzle
export const db = drizzle(sql);
