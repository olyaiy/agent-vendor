'use server'

import { z } from 'zod'
import { db } from '@/db'
import { waitlist } from '@/db/schema/waitlist'
import { redirect } from 'next/navigation'

const waitlistSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  referralSource: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
})

export type WaitlistFormData = z.infer<typeof waitlistSchema>

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

  try {
    await db.insert(waitlist).values({
      email: result.data.email,
      firstName: result.data.firstName,
      lastName: result.data.lastName,
      referralSource: result.data.referralSource || null,
      city: result.data.city || null,
      country: result.data.country || null,
    })

    return { success: true }
  } catch (error: any) {
    // Handle duplicate email error
    if (error.code === '23505' && error.constraint === 'waitlist_email_unique') {
      return {
        error: 'This email is already on our waitlist. We\'ll be in touch soon!',
      }
    }
    
    console.error('Waitlist signup error:', error)
    return {
      error: 'Something went wrong. Please try again.',
    }
  }
}