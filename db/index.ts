import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

config({ path: '.env.local' }); // Load .env.local at the start


const sql = neon(process.env.DATABASE_URL!);


// Then pass the SQL client and schema to drizzle
export const db = drizzle(sql, { schema });
