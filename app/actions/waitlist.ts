'use server'

import { z } from 'zod'
import { db } from '@/db'
import { waitlist } from '@/db/schema/waitlist'
import { headers } from 'next/headers'

const waitlistSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  referralSource: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
})

export type WaitlistFormData = z.infer<typeof waitlistSchema>

async function getLocationFromIP() {
  try {
    const headersList = await headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIP = headersList.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0] || realIP || 'unknown'
    
    // Skip location detection for localhost/private IPs
    if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return null
    }

    // Use a free IP geolocation service
    const response = await fetch(`https://ipapi.co/${ip}/json/`)
    const data = await response.json()
    
    if (data.city && data.country_name) {
      return {
        city: data.city,
        country: data.country_name
      }
    }
  } catch (error) {
    console.log('IP geolocation failed:', error)
  }
  return null
}

export async function joinWaitlist(formData: FormData) {
  const result = waitlistSchema.safeParse({
    email: formData.get('email'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    referralSource: formData.get('referralSource'),
    city: formData.get('city'),
    country: formData.get('country'),
  })

  if (!result.success) {
    return {
      error: 'Please check your form inputs',
      fieldErrors: result.error.flatten().fieldErrors,
    }
  }

  // Get location from IP if not provided
  let finalCity = result.data.city
  let finalCountry = result.data.country
  
  if (!finalCity || !finalCountry) {
    const ipLocation = await getLocationFromIP()
    if (ipLocation) {
      finalCity = finalCity || ipLocation.city
      finalCountry = finalCountry || ipLocation.country
    }
  }

  try {
    await db.insert(waitlist).values({
      email: result.data.email,
      firstName: result.data.firstName,
      lastName: result.data.lastName,
      referralSource: result.data.referralSource || null,
      city: finalCity || null,
      country: finalCountry || null,
      approved: false,
    })

    return { success: true }
  } catch (err: unknown) {
    const pgError = err as { code?: string; constraint?: string }
    // Handle duplicate email error
    if (pgError.code === '23505' && pgError.constraint === 'waitlist_email_unique') {
      return {
        error: 'This email is already on our waitlist. We\'ll be in touch soon!',
      }
    }
    
    console.error('Waitlist signup error:', err)
    return {
      error: 'Something went wrong. Please try again.',
    }
  }
}