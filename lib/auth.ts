import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { anonymous, username } from "better-auth/plugins";

import { polar } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";


const client = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  // Use 'sandbox' if you're using the Polar Sandbox environment
  // Remember that access tokens, products, etc. are completely separated between environments.
  // Access tokens obtained in Production are for instance not usable in the Sandbox environment.
  server: 'sandbox'
});



import * as schema from "@/db/schema"; // <-- Import the schema index
export const auth = betterAuth({
  
  // database
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema.auth // <-- Pass the auth schema directly
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
    anonymous(),
    polar({
      client,
      // Enable automatic Polar Customer creation on signup
      createCustomerOnSignUp: true,
      // Enable customer portal
      enableCustomerPortal: true, // Deployed under /portal for authenticated users
  
    
  })

  ]

});

