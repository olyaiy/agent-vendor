// src/app/api/polar/checkout/route.ts
import { Checkout } from '@polar-sh/nextjs'

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: `${process.env.BETTER_AUTH_URL}/confirmation`,
  // server: 'sandbox', // Use this option if you're using the sandbox environment - else use 'production' or omit the parameter
});