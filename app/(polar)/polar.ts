// src/polar.ts
import { Polar } from '@polar-sh/sdk'

export const api = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  // Conditionally set server based on NODE_ENV
  // Defaults to production if server is omitted or undefined
  ...(process.env.NODE_ENV === 'development' && { server: 'sandbox' }),
})
