// src/app/api/polar/webhook/route.ts
import { Webhooks } from "@polar-sh/nextjs";
import { updateUserCredits, recordTransaction } from "../../../../db/repository/transaction-repository";

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
              console.log(`✅ Order Paid: ID ${order.id}, 
                              Product: ${productName}, 
                              Amount: ${pricePaid} ${currency}, 
                              Customer: ${order.customer?.email || 'N/A'}
                              Customer ID: ${order.customer?.externalId || 'N/A'}
                              `);
            
              // --- Start Database Operations ---
              const userId = order.customer?.externalId;
              if (userId && order.totalAmount !== undefined && order.totalAmount !== null) {
                  try {
                    const amount = order.totalAmount - 0.40;
                      const amountString = (amount / 100).toString();
                      
                      console.log(`Attempting to update credits for user ${userId} with amount ${amountString}`);
                      await updateUserCredits(userId, amountString, 'top_up');
                      console.log(`Credits updated successfully for user ${userId}`);

                      console.log(`Attempting to record transaction for user ${userId}`);
                      await recordTransaction({ 
                          userId: userId, 
                          type: 'top_up', 
                          amount: amountString, 
                          description: `Polar Order ${order.id} Paid` 
                      });
                      console.log(`Transaction recorded successfully for user ${userId}`);

                  } catch (dbError) {
                      console.error(`❌ Database error processing order.paid for order ${order.id} and user ${userId}:`, dbError instanceof Error ? dbError.message : String(dbError));
                      // Potentially return an error response to Polar if needed, e.g., return new Response('Webhook processing failed', { status: 500 });
                  }
              } else {
                  console.warn(`⚠️ Missing userId (${userId}) or totalAmount (${order.totalAmount}) for order.paid event. Order ID: ${order.id}`);
              }
              // --- End Database Operations ---
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
