// src/app/api/polar/webhook/route.ts
import { Webhooks } from "@polar-sh/nextjs";

// Add debugging logs before the handler
console.log('Polar webhook route loaded');

export const POST = Webhooks({
	webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
	onPayload: async (payload) => {
    try {
      console.log(`🔔 Received Polar Webhook: ${payload.type}`);
      
      switch (payload.type) {
          case 'checkout.created':
              console.log(`🛒 Checkout Created: ID ${payload.data.id}`);
            // Handle the checkout created event
            // supabase.from('checkouts').insert(webhookPayload.data)
            break;
          case 'checkout.updated':
              console.log(`🔄 Checkout Updated: ID ${payload.data.id}, Status ${payload.data.status}`);
            // Handle the checkout updated event
            // Check payload.data.status === 'succeeded' for confirmation
            break;
          case 'order.paid':
              const order = payload.data;
              const productName = order.product?.name || 'Unknown Product';
              // Corrected property name based on SDK types
              const pricePaid = order.totalAmount / 100; // Amount is in cents
              const currency = order.currency.toUpperCase();
              console.log(`✅ Order Paid: ID ${order.id}, Product: ${productName}, Amount: ${pricePaid} ${currency}, Customer: ${order.customer?.email || 'N/A'}`);
            // Handle the successful order payment
            // e.g., grant access, update database
            break;
          case 'customer.updated':
              console.log(`👤 Customer Updated: ID ${payload.data.id}, Email: ${payload.data.email || 'N/A'}`);
            break;
          case 'customer.state_changed':
              // Log the data object directly to inspect structure, as properties were unclear
              console.log(`🚦 Customer State Changed Data: ${JSON.stringify(payload.data)}`);
            break;
          // Add cases for other events like subscription updates if needed
          default:
            // Handle unknown event
            console.log(`❓ Unknown event type received: ${payload.type}`);
            break;
      }
    } catch (error) {
      console.error('❌ Error processing webhook:', error instanceof Error ? error.message : String(error));
    }
  }
});

// Debug route to verify the endpoint is working
export const GET = async () => {
  console.log('✅ GET request received on webhook route');
  return new Response('Webhook endpoint is running', { status: 200 });
};