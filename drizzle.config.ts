import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' }); // Explicitly load .env.local

export default defineConfig({
  out: './drizzle',
  schema: ['./db/schema/auth-schema.ts',
     './db/schema/agent.ts', 
     './db/schema/chat.ts',
     './db/schema/transactions.ts',
     './db/schema/user_credits.ts',
     './db/schema/transactions.ts',
     './db/schema/tool.ts',
     './db/schema/waitlist.ts',
     ], 
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

