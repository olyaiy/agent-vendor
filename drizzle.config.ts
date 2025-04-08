import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' }); // Explicitly load .env.local

export default defineConfig({
  out: './drizzle',
  schema: ['./db/schema/auth-schema.ts', './db/schema/agent.ts'], // Point to specific schema files
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

