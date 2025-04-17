import { appendResponseMessages, smoothStream, streamText } from 'ai';
// Remove direct openai import, we'll get the model instance via the helper
// import { openai } from "@ai-sdk/openai";
import { getModelInstanceById, getModelPricing } from '@/lib/models'; // Import the helper function
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { createChat, getChatById, saveMessages, updateChatTitle } from '@/db/repository/chat-repository'; // Import updateChatTitle
import { generateTitleFromUserMessage } from '@/db/actions/chat-actions';
import { generateUUID, getMostRecentUserMessage, getTrailingMessageId } from '@/lib/utils';
import { chargeUser } from '@/db/actions/transaction-actions';

/**
 * Handles POST requests for chat conversations
 * @param req - Request object containing chat data
 * @returns Response with streaming text or error status
 */
export async function POST(req: Request) {
  console.time('Total request time');

    /* ---- AUTH CHECK ---- */
    /** 
     * Retrieves user session for authorization
     * @returns Session object or undefined if not authenticated
     */
    console.time('Session retrieval');
    const session = await auth.api.getSession({
        headers: await headers()
    });
    console.timeEnd('Session retrieval');

    if (!session || !session.user || !session.user.id) {
      console.log('Unauthorized!--------------------------------');
      return new Response('Unauthorized', { status: 401 });
    }

    /* ---- REQUEST DATA HANDLING ---- */
    /** 
     * Destructures request body containing:
     * @param chatId - UUID of the chat session
     * @param model - Identifier for the AI model
     * @param messages - Array of chat messages
     * @param systemPrompt - System instructions for the AI
     * @param agentId - Optional identifier for AI agent configuration
     */
    const { 
      chatId,
      model: modelId, 
      messages, 
      systemPrompt,
      agentId
    } = await req.json();

    /* ---- MESSAGE VALIDATION ---- */
    /**
     * Extracts the most recent user message for processing
     * @throws Error if no user message found
     */
    const userMessage = getMostRecentUserMessage(messages);
    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    /* ---- GET CHAT BY ID OR CREATE NEW CHAT ---- */
    console.time('Chat lookup');
    const chat = await getChatById(chatId);
    console.timeEnd('Chat lookup');
    console.time('Chat creation check'); // Renamed timer
    if (!chat) {

      // --- Start: Fire-and-forget chat creation ---
      (async () => {
        try {
          console.time('Background chat placeholder creation');
          // 1. Create chat with placeholder title immediately
          await createChat({ id: chatId, userId: session.user.id, title: "New Conversation" , agentId: agentId});
          console.timeEnd('Background chat placeholder creation');


          console.time('Background title generation and update');
          // 2. Generate the actual title
          const generatedTitle = await generateTitleFromUserMessage({
            message: userMessage,
          });

          // 3. Update the chat with the generated title
          await updateChatTitle(chatId, generatedTitle);
          console.timeEnd('Background title generation and update');


        } catch (error) {
          console.error(`Error in background chat creation/update for ${chatId}:`, error);
          // Optional: Add more robust error logging/reporting here
        }
      })(); // Immediately invoke without await
      // --- End: Fire-and-forget chat creation ---
    } else {
      // Existing chat: Verify ownership
      if (chat.userId !== session.user.id) {
        console.timeEnd('Chat creation check');
        return new Response('Unauthorized', { status: 401 });
      }
    }
    console.timeEnd('Chat creation check'); // End timer for the main path check


    /* ---- MODEL INITIALIZATION ---- */
    /**
     * Retrieves configured model instance
     * @param modelId - Identifier for the AI model configuration
     * @returns Initialized model instance for text generation
     */
    console.time('Model instance retrieval');
    const modelInstance = getModelInstanceById(modelId);
    console.timeEnd('Model instance retrieval');


    /* ---- STREAMING HANDLER ---- */
    /**
     * Configures text streaming with error handling and message persistence
     * @param onFinish - Callback after successful stream completion
     * @param onError - Error handler for streaming failures
     */
    console.time('Text streaming');
    const result = streamText({
      model: modelInstance,
      system: systemPrompt,
      messages,
      experimental_generateMessageId: generateUUID, // This tells the program to generate UUID's for the assistant messages
      experimental_transform: smoothStream({
        delayInMs: 20, // optional: defaults to 10ms
        // chunking: 'line', // optional: defaults to 'word'
      }),
    
      

      onFinish: async ({ response, usage } ) => {
        /**
         * Handles post-stream operations:
         * - Validates assistant message
         * - Persists user and assistant messages
         */

        console.log('model is', modelInstance, 'modelId is', modelId);


        // --- Start: Save messages --- //
        if (session.user?.id) {
          try {

            // Get Assistant Message ID
            const assistantId = getTrailingMessageId({
              messages: response.messages.filter(
                (message) => message.role === 'assistant',
              ),
            });
            if (!assistantId) {
              throw new Error('No assistant message found!');
            }

            // Append Assistant Message
            const [, assistantMessage] = appendResponseMessages({
              messages: [userMessage],
              responseMessages: response.messages,
            });

            // Save user message first in onFinish
            await saveMessages({
              messages: [
                {
                  id: userMessage.id,
                  chatId: chatId,
                  role: 'user',
                  parts: userMessage.parts,
                  attachments: [], // Assuming user messages don't have attachments here
                  createdAt: new Date(), // Or use userMessage timestamp if available
                  model_id: "f86723da-2b45-4679-823d-24da0b474436" // Or null/undefined if not applicable
                },
              ],
            });

            // Then save assistant message
            await saveMessages({
              messages: [
                {
                  id: assistantId,
                  chatId: chatId,
                  role: assistantMessage.role,
                  parts: assistantMessage.parts,
                  attachments:
                    assistantMessage.experimental_attachments ?? [],
                  createdAt: new Date(),
                  model_id: "f86723da-2b45-4679-823d-24da0b474436"
                },
              ],
            });


            const model_cost = getModelPricing(modelId);

            console.log('model_cost', model_cost);
            console.log('usage', usage);

            if (Number.isNaN(usage.promptTokens) || Number.isNaN(usage.completionTokens)) {
              console.log('usage is NaN');
            }

            let input_cost = usage.promptTokens * model_cost.inputCostPerMillion / 1000000;
            let output_cost = usage.completionTokens * model_cost.outputCostPerMillion / 1000000;

            console.log('input_cost', input_cost);
            console.log('output_cost', output_cost);

            input_cost = input_cost ? input_cost : 0;
            output_cost = output_cost ? output_cost : 0;
            
            const totalCost = input_cost + output_cost;
            
            // Round the cost to 8 decimal places to match DB precision and validation
            const roundedCost = parseFloat(totalCost.toFixed(8));
            const amountString = roundedCost.toString();

            // Charge User for the message
            await chargeUser({
              userId: session.user.id,
              amount: amountString, // Use the rounded string
              messageId: assistantId,
              description: "Chat input cost"
            });
          } catch (error) {
            console.error('Failed to save chat', error);
          }
        }
      },
      onError: async (error) => {
        /**
         * Error recovery handler:
         * - Attempts to save user message despite streaming failure
         * - Logs error details for diagnostics
         */
        console.error('Error streaming text', error);
        // Attempt to save user message even on error
        if (session.user?.id) {
          try {
            await saveMessages({
              messages: [
                {
                  id: userMessage.id,
                  chatId: chatId,
                  role: 'user',
                  parts: userMessage.parts,
                  attachments: [],
                  createdAt: new Date(),
                  model_id: "f86723da-2b45-4679-823d-24da0b474436"
                },
              ],
            });

          } catch (saveError) {
            console.error('Failed to save user message during streaming error:', saveError);
          }
        }
      }
    });
    

  console.timeEnd('Text streaming');
  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}
