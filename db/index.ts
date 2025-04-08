import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Use DATABASE_URL from environment variables
const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client); 