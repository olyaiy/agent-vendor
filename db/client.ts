import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Create and export the database client
// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client); 