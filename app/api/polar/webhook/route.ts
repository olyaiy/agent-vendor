// src/app/api/webhook/polar/route.ts
import { Webhooks } from "@polar-sh/nextjs";

export const POST = Webhooks({
	webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
	onPayload: async (payload) => {
    switch (payload.type) {
        case 'checkout.created':
          // Handle the checkout created event
          // supabase.from('checkouts').insert(webhookPayload.data)
          break
        case 'checkout.updated':
          // Handle the checkout updated event
          // supabase.from('checkouts').update(webhookPayload.data).match({ id: webhookPayload.data.id })
          break
        case 'subscription.created':
          // Handle the subscription created event
          break
        case 'subscription.updated':
          // Handle the subscription updated event
          break
        case 'subscription.active':
          // Handle the subscription active event
          break
        case 'subscription.revoked':
          // Handle the subscription revoked event
          break
        case 'subscription.canceled':
          // Handle the subscription canceled event
          break
        default:
          // Handle unknown event
          console.log('Unknown event', payload.type)
          break
      }
  }
});