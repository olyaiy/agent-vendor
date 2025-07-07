'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { joinWaitlist } from '@/app/actions/waitlist'
import { useFormStatus } from 'react-dom'
import { Loader2, CheckCircle } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button
      type="submit"
      size="lg"
      className="w-full h-12 font-medium bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Joining waitlist...
        </>
      ) : (
        'Join Waitlist'
      )}
    </Button>
  )
}

export default function WaitlistForm() {
  const [result, setResult] = useState<{ success?: boolean; error?: string; fieldErrors?: Record<string, string[]> } | null>(null)
  const [detectedLocation, setDetectedLocation] = useState<{ city: string; country: string } | null>(null)

  useEffect(() => {
    detectLocation()
  }, [])

  const detectLocation = async () => {
    try {
      // Silently try browser geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              // Use a free geocoding service to get city/country from coordinates
              const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
              )
              const data = await response.json()
              
              if (data.city && data.countryName) {
                setDetectedLocation({
                  city: data.city,
                  country: data.countryName
                })
              }
            } catch (error) {
              console.log('Geocoding failed:', error)
            }
          },
          (error) => {
            console.log('Geolocation failed:', error)
          },
          { timeout: 10000 }
        )
      }
    } catch (error) {
      console.log('Location detection failed:', error)
    }
  }

  async function handleSubmit(formData: FormData) {
    // Only add detected location if fields are empty
    if (detectedLocation) {
      if (!formData.get('city') && detectedLocation.city) {
        formData.set('city', detectedLocation.city)
      }
      if (!formData.get('country') && detectedLocation.country) {
        formData.set('country', detectedLocation.country)
      }
    }
    
    const result = await joinWaitlist(formData)
    setResult(result)
  }

  if (result?.success) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">You&apos;re on the list!</h3>
          <p className="text-white/70 text-sm">
            Thanks for joining our waitlist. We&apos;ll notify you when Agent Vendor is ready for you.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium text-white/80">
            First Name
          </Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            required
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500 focus:ring-purple-500"
            placeholder="John"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium text-white/80">
            Last Name
          </Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            required
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500 focus:ring-purple-500"
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-white/80">
          Email Address
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500 focus:ring-purple-500"
          placeholder="john@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="referralSource" className="text-sm font-medium text-white/80">
          How did you hear about us? (Optional)
        </Label>
        <Input
          id="referralSource"
          name="referralSource"
          type="text"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500 focus:ring-purple-500"
          placeholder="Twitter, friend, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-sm font-medium text-white/80">
            City (Optional)
          </Label>
          <Input
            id="city"
            name="city"
            type="text"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500 focus:ring-purple-500"
            placeholder="New York"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country" className="text-sm font-medium text-white/80">
            Country (Optional)
          </Label>
          <Input
            id="country"
            name="country"
            type="text"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500 focus:ring-purple-500"
            placeholder="USA"
          />
        </div>
      </div>


      {result?.error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {result.error}
        </div>
      )}

      <SubmitButton />
    </form>
  )
}