import { appendResponseMessages, smoothStream, streamText, type Message } from 'ai'; // Keep Message for casting input
// Remove direct openai import, we'll get the model instance via the helper
// import { openai } from "@ai-sdk/openai";
import { getModelInstanceById, getModelPricing } from '@/lib/models'; // Import the helper function
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { createChat, getChatById, saveMessages, updateChatTitle } from '@/db/repository/chat-repository'; // Import updateChatTitle
import { generateTitleFromUserMessage } from '@/db/actions/chat-actions';
import { generateUUID, getMostRecentUserMessage, getTrailingMessageId } from '@/lib/utils';
import { chargeUser } from '@/db/actions/transaction-actions';
// import { toolRegistry } from '@/tools/registry'; // Import the tool registry

/**
 * Handles POST requests for chat conversations
 * @param req - Request object containing chat data
 * @returns Response with streaming text or error status
 */
export async function POST(req: Request) {
  console.time('Total request time');

  try { // Added try block for overall error handling
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
     * @param ...settings - Optional model settings (temperature, topP, etc.)
     */
    const {
      chatId,
      model: modelId,
      messages,
      systemPrompt,
      agentId,
      // Destructure potential settings from the body
      temperature,
      topP,
      topK,
      maxTokens, // Note: using maxTokens here as mapped from frontend
      presencePenalty,
      frequencyPenalty,
      // Add others if defined in ModelSettings and passed from frontend
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
          await createChat({ id: chatId, userId: session.user!.id, title: "New Conversation" , agentId: agentId}); // Added non-null assertion
          console.timeEnd('Background chat placeholder creation');


          console.time('Background title generation and update');
          // 2. Generate the actual title
          const generatedTitle = await generateTitleFromUserMessage({
            message: userMessage as Message, // Cast userMessage
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

    /* ---- PREPARE SETTINGS FOR AI SDK ---- */
    // Create an object containing only the settings that were actually passed in the request
    const receivedSettings: Record<string, number | undefined> = {}; // Changed 'any' to 'number | undefined'
    if (temperature !== undefined) receivedSettings.temperature = temperature;
    if (topP !== undefined) receivedSettings.topP = topP;
    if (topK !== undefined) receivedSettings.topK = topK;
    if (maxTokens !== undefined) receivedSettings.maxTokens = maxTokens;
    if (presencePenalty !== undefined) receivedSettings.presencePenalty = presencePenalty;
    if (frequencyPenalty !== undefined) receivedSettings.frequencyPenalty = frequencyPenalty;
    // Add checks for other potential settings if needed

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
      messages: messages as Message[], // Cast messages to Message[]
      // Tool Call Set Up
      // tools: toolRegistry,
      maxSteps: 5,
      toolCallStreaming: true,
      experimental_generateMessageId: generateUUID, // This tells the program to generate UUID's for the assistant messages
      experimental_transform: smoothStream({ delayInMs: 20 }),
      // Spread the received settings into the streamText call
      ...receivedSettings,


      // Let TypeScript infer the event type for onFinish
      onFinish: async (event) => {
        /**
         * Handles post-stream operations:
         * - Validates assistant message
         * - Persists user and assistant messages
         */

        console.log('SETTINGS APPLIED WERE', receivedSettings);

        // Destructure needed properties from the inferred event type
        const { response, usage } = event;

        console.log('model is', modelInstance.modelId, 'modelId is', modelId); // Log modelId from instance


        // --- Start: Save messages --- //
        if (session.user?.id) {
          try {

            // Get Assistant Message ID using response.messages (ResponseMessage[])
            const assistantId = getTrailingMessageId({
              messages: response.messages.filter(
                (message) => message.role === 'assistant',
              ),
            });
            if (!assistantId) {
              throw new Error('No assistant message found!');
            }

            // Append Assistant Message using response.messages (ResponseMessage[])
            const [, assistantMessage] = appendResponseMessages({
              messages: [userMessage as Message], // Cast userMessage
              responseMessages: response.messages, // Pass ResponseMessage[]
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
                  model_id: null // User messages don't have a model_id
                },
              ],
            });

            // Then save assistant message
            // Find the DB model ID corresponding to the string modelId used in the request
            // This requires fetching models from DB or having a map available
            // For now, using a placeholder or null. Replace with actual lookup logic.
            const assistantModelDbId = null; // Placeholder: Replace with actual DB ID lookup

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
                  model_id: assistantModelDbId // Use the looked-up DB ID
                },
              ],
            });


            const model_cost = getModelPricing(modelId);

            console.log('model_cost', model_cost);
            console.log('usage', usage);

            // Check if usage values are valid numbers before calculation
            const promptTokens = Number.isFinite(usage.promptTokens) ? usage.promptTokens : 0;
            const completionTokens = Number.isFinite(usage.completionTokens) ? usage.completionTokens : 0;

            let input_cost = promptTokens * model_cost.inputCostPerMillion / 1000000;
            let output_cost = completionTokens * model_cost.outputCostPerMillion / 1000000;

            console.log('input_cost', input_cost);
            console.log('output_cost', output_cost);

            input_cost = Number.isFinite(input_cost) ? input_cost : 0; // Ensure costs are finite
            output_cost = Number.isFinite(output_cost) ? output_cost : 0;

            const totalCost = input_cost + output_cost;

            // Round the cost to 8 decimal places to match DB precision and validation
            const roundedCost = parseFloat(totalCost.toFixed(8));
            const amountString = roundedCost.toString();

            // Charge User for the message
            await chargeUser({
              userId: session.user!.id, // Added non-null assertion
              amount: amountString, // Use the rounded string
              messageId: assistantId,
              description: "Chat input cost"
            });
          } catch (error) {
            console.error('Failed to save chat or charge user:', error); // Updated log
          }
        }
      },
      onError: async ({ error }: { error: unknown }) => { // Updated onError signature
        /**
         * Error recovery handler:
         * - Attempts to save user message despite streaming failure
         * - Logs error details for diagnostics
         */
        console.error('Error streaming text:', error); // Log the error object
        // Attempt to save user message even on error
        if (session?.user?.id) { // Check session exists before accessing user
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
                  model_id: null // User messages don't have a model_id
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

  } catch (error) { // Catch overall errors
    console.error("Error in POST /api/chat:", error);
    // Determine appropriate status code based on error type if possible
    const status = error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500;
    return new Response(error instanceof Error ? error.message : 'Internal Server Error', { status });
  } finally {
    console.timeEnd('Total request time');
  }
} // Added missing closing brace for POST function
