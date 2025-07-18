import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { admin, anonymous, username } from "better-auth/plugins";

import { polar } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { userCredits } from "@/db/schema/transactions"; // Import userCredits table
import { waitlist } from "@/db/schema/waitlist";
import { eq } from "drizzle-orm";


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
        before: async (candidate) => {
          const email = candidate.email?.toLowerCase?.() || "";
          if (!email) {
            throw new Error("Email is required for sign up");
          }

          const approved = await db
            .select({ id: waitlist.id })
            .from(waitlist)
            .where(eq(waitlist.email, email))
            .limit(1);

          if (approved.length === 0) {
            throw new Error(
              "You’re not on the access list yet – please join the waitlist first."
            );
          }
        },
        after: async (user) => {
          // Create a user_credits record with $1 initial credit
          await db.insert(userCredits).values({
            userId: user.id,
            creditBalance: "1.00000000", // $1 based on your schema precision
            lifetimeCredits: "1.00000000"
          });
          

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
