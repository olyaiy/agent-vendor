import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { anonymous, username } from "better-auth/plugins";
export const auth = betterAuth({
  
  // database
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  // social providers
  socialProviders: {
    google: { 
        clientId: process.env.GOOGLE_CLIENT_ID as string, 
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
    }, 
  },
  // plugins
  plugins: [
    username(),
    anonymous()
  ]

});

