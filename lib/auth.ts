import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { admin, anonymous, username } from "better-auth/plugins";

import { polar } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { userCredits } from "@/db/schema/transactions"; // Import userCredits table


const client = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  // Use 'sandbox' if you're using the Polar Sandbox environment
  // Remember that access tokens, products, etc. are completely separated between environments.
  // Access tokens obtained in Production are for instance not usable in the Sandbox environment.
  // Conditionally set server based on NODE_ENV (defaults to production if omitted)
  ...(process.env.NODE_ENV === 'development' && { server: 'sandbox' })
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
  
  // Add database hooks
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Create a user_credits record with $1 initial credit
          await db.insert(userCredits).values({
            userId: user.id,
            creditBalance: "1.00000000", // $1 based on your schema precision
            lifetimeCredits: "1.00000000"
          });
          
          console.log(`Created initial credits for user: ${user.id}`);
        },
      },
    },
  },

  // plugins
  plugins: [
    username(),
    anonymous(),
    admin(),
    polar({
      client,
      // Enable automatic Polar Customer creation on signup
      createCustomerOnSignUp: true,
      // Enable customer portal
      enableCustomerPortal: true, // Deployed under /portal for authenticated users
  
    
  })

  ]

});
