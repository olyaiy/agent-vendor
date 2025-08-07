import { appendResponseMessages, smoothStream, streamText, type Message, type UIMessage } from 'ai'; // Keep Message for casting input
// Remove direct openai import, we'll get the model instance via the helper
// import { openai } from "@ai-sdk/openai";
import { getModelInstanceById, getModelPricing } from '@/lib/models'; // Import the helper function
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { createChat, getChatById, saveMessages, updateChatTitle } from '@/db/repository/chat-repository'; // Import updateChatTitle
import { selectAgentById } from '@/db/repository/agent.repository';
import { generateTitleFromUserMessage } from '@/db/actions/chat-actions';
import { generateUUID, getMostRecentUserMessage, getTrailingMessageId } from '@/lib/utils';
import { chargeUser } from '@/db/actions/transaction-actions';
import { getUserCredits } from '@/db/repository/transaction-repository'; // Import getUserCredits
import { toolRegistry, type ToolRegistry } from '@/tools/registry'; // Import ToolRegistry

// Define types for attachments to avoid 'any'
interface Attachment {
  url: string;
  name?: string;
  contentType?: string;
}

// Interface for CSV attachment payloads from the frontend
interface CsvAttachmentPayload {
  url: string;
  name: string;
  contentType: string;
}

interface UserMessageWithAttachments extends Message {
  experimental_attachments?: Attachment[];
}

// Extended request body to include csv_attachment_payloads
interface RequestBody {
  chatId: string;
  model: string;
  messages: Message[];
  systemPrompt: string;
  agentId?: string;
  assignedToolNames?: string[];
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  csv_attachment_payloads?: CsvAttachmentPayload[];
}

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

    /* ---- CREDIT CHECK ---- */
    /**
     * Verifies user has sufficient credits before processing request
     * @returns 402 Payment Required if insufficient credits
     */
    console.time('Credit check');
    const userCreditsData = await getUserCredits(session.user.id);
    const creditBalance = userCreditsData ? parseFloat(userCreditsData.creditBalance) : 0;
    console.timeEnd('Credit check');

    // Check if user has sufficient credits (minimum threshold: $0.001)
    if (creditBalance < 0.001) {
      console.log(`[Credit Check] User ${session.user.id} has insufficient credits: ${creditBalance}`);
      return new Response(JSON.stringify({
        error: 'insufficient_credits',
        creditBalance: creditBalance,
        message: 'Insufficient credits to process this request'
      }), { 
        status: 402, // Payment Required
        headers: { 'Content-Type': 'application/json' }
      });
    }

    /* ---- REQUEST DATA HANDLING ---- */
    /**
     * Destructures request body containing:
     * @param chatId - UUID of the chat session
     * @param model - Identifier for the AI model
     * @param messages - Array of chat messages
     * @param systemPrompt - System instructions for the AI
     * @param agentId - Optional identifier for AI agent configuration
     * @param assignedToolNames - Optional array of tool names to activate
     * @param ...settings - Optional model settings (temperature, topP, etc.)
     * @param csv_attachment_payloads - Optional CSV file metadata for processing
     */
    const {
      chatId,
      model: modelId,
      messages, // This will be an array of messages, potentially UserMessageWithAttachments
      systemPrompt,
      agentId = null, // Set a default value of null to avoid undefined
      assignedToolNames, // Added assignedToolNames
      // Destructure potential settings from the body
      temperature,
      topP,
      topK,
      maxTokens, // Note: using maxTokens here as mapped from frontend
      presencePenalty,
      frequencyPenalty,
      // Add custom field for CSV attachments
      csv_attachment_payloads,
      // Add others if defined in ModelSettings and passed from frontend
    } = await req.json() as RequestBody;

    // Fetch the agent configuration if an ID was provided
    const agent = agentId ? await selectAgentById(agentId) : undefined;

    /* ---- MESSAGE VALIDATION ---- */
    /**
     * Extracts the most recent user message for processing
     * @throws Error if no user message found
     */
    const userMessage = getMostRecentUserMessage(messages as unknown as UIMessage[]) as UserMessageWithAttachments | undefined;
    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    /* ---- GET CHAT BY ID OR CREATE NEW CHAT ---- */
    console.time('Chat lookup');
    const chat = await getChatById(chatId);
    console.timeEnd('Chat lookup');
    console.time('Chat creation check'); // Renamed timer
    if (!chat) {

      console.time('Chat creation');
      await createChat({
        id: chatId,
        userId: session.user!.id,
        title: 'New Conversation',
        agentId: agentId // This now has null as a default value
      });
      console.timeEnd('Chat creation');

      // --- Start: Background title generation ---
      (async () => {
        try {
          console.time('Background title generation and update');
          const generatedTitle = await generateTitleFromUserMessage({
            message: userMessage as Message, // Cast userMessage for this specific function
          });
          await updateChatTitle(chatId, generatedTitle);
          console.timeEnd('Background title generation and update');
        } catch (error) {
          console.error(`Error generating/updating title for ${chatId}:`, error);
        }
      })();
      // --- End: Background title generation ---
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
    if (maxTokens !== undefined) receivedSettings.maxTokens = maxTokens; // Keep original key here
    if (presencePenalty !== undefined) receivedSettings.presencePenalty = presencePenalty;
    if (frequencyPenalty !== undefined) receivedSettings.frequencyPenalty = frequencyPenalty;
    // Add checks for other potential settings if needed

    // Prepare final settings, potentially renaming maxTokens
    const finalSettings: Record<string, number | undefined> = { ...receivedSettings };
    const modelsRequiringMaxCompletionTokens = ['gpt-4o-mini', 'o1', 'o1-mini', 'o3', 'o3-mini', 'o4-mini', 'gpt-5-mini', 'gpt-5-nano']; // Add other relevant models as needed

    if (modelsRequiringMaxCompletionTokens.includes(modelId) && finalSettings.maxTokens !== undefined) {
      finalSettings.maxCompletionTokens = finalSettings.maxTokens;
      delete finalSettings.maxTokens;
      console.log(`Mapping maxTokens to maxCompletionTokens for model: ${modelId}`); // Log the mapping
    }

    // Ensure temperature is 1 for models that require it
    const modelsRequiringTemp1 = ['o4-mini']; // Add o1, o3 etc. if they also have this restriction
    if (modelsRequiringTemp1.includes(modelId)) {
        if (finalSettings.temperature !== 1) {
             console.log(`Forcing temperature to 1 for model: ${modelId}. Original value was: ${finalSettings.temperature}`); // Log the change
             finalSettings.temperature = 1; // Force temperature to 1
        }
    }

    /* ---- TOOL FILTERING ---- */
    let activeToolsForThisCall: Partial<ToolRegistry> = {}; // Use Partial<ToolRegistry>
    if (assignedToolNames && Array.isArray(assignedToolNames) && assignedToolNames.length > 0) {
      console.log('Filtering tools based on assignedToolNames:', assignedToolNames);
      activeToolsForThisCall = Object.fromEntries(
        Object.entries(toolRegistry).filter(([toolName]) =>
          assignedToolNames.includes(toolName)
        )
      ) as Partial<ToolRegistry>; // Cast to ensure type compatibility
      console.log('Active tools for this call:', Object.keys(activeToolsForThisCall));
    } else {
      console.log('No assignedToolNames provided or empty, no tools will be activated.');
      activeToolsForThisCall = {}; // Ensure it's an empty object if no tools are assigned
    }

    /* ---- CSV PROCESSING ---- */
    // Process CSV files if present
    // Create a deep copy of messages that will be safe to modify
    const messagesForAi = messages.map(msg => ({...msg}));

    if (csv_attachment_payloads && csv_attachment_payloads.length > 0) {
      console.time('CSV processing');
      console.log(`Processing ${csv_attachment_payloads.length} CSV attachments`);
      
      try {
        // Get the latest user message in our copy, which we'll modify with CSV content
        const lastUserMessageIndex = messagesForAi.findLastIndex(msg => msg.role === 'user');
        
        if (lastUserMessageIndex === -1) {
          throw new Error('No user message found for CSV content addition');
        }
        
        // Collect all CSV content with headers
        let combinedCsvContent = '';
        
        for (const csvPayload of csv_attachment_payloads) {
          try {
            // Fetch the CSV content from the URL
            const response = await fetch(csvPayload.url);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch CSV content from ${csvPayload.url}. Status: ${response.status}`);
            }
            
            const csvText = await response.text();
            
            // Add a header for this CSV file
            combinedCsvContent += `\n\n--- Begin CSV Content: ${csvPayload.name} ---\n${csvText}\n--- End CSV Content: ${csvPayload.name} ---\n\n`;
            
          } catch (csvFetchError) {
            console.error(`Error fetching CSV content:`, csvFetchError);
            // Add error note instead of content
            combinedCsvContent += `\n\nError loading CSV content from ${csvPayload.name}: ${csvFetchError instanceof Error ? csvFetchError.message : 'Unknown error'}\n\n`;
          }
        }
        
        // Get the user message we want to modify
        const lastUserMessage = messagesForAi[lastUserMessageIndex];
        
        // Check if content is a string or array of parts
        if (typeof lastUserMessage.content === 'string') {
          // If string, append CSV content directly
          lastUserMessage.content += combinedCsvContent;
        } else if (Array.isArray(lastUserMessage.content)) {
          // We need to safely handle the content array type
          // Cast to a type with known structure to satisfy TypeScript
          interface ContentPart {
            type: string;
            text?: string;
            [key: string]: unknown;
          }
          
          const contentArray = lastUserMessage.content as ContentPart[];
          
          // Find first text part
          const textPartIndex = contentArray.findIndex(part => part.type === 'text');
          
          if (textPartIndex !== -1 && contentArray[textPartIndex].text !== undefined) {
            // Append to existing text part
            contentArray[textPartIndex].text += combinedCsvContent;
          } else {
            // Add new text part with CSV content
            contentArray.push({
              type: 'text',
              text: combinedCsvContent
            });
          }
        } else {
          // If content is unexpected format, convert to string and append
          lastUserMessage.content = String(lastUserMessage.content) + combinedCsvContent;
        }
        
        console.log('CSV content successfully appended to user message');
      } catch (error) {
        console.error('Error processing CSV attachments:', error);
        // Continue with original messages if CSV processing fails
      }
      
      console.timeEnd('CSV processing');
    }

    /* ---- STREAMING HANDLER ---- */
    /**
     * Configures text streaming with error handling and message persistence
     * @param onFinish - Callback after successful stream completion
     * @param onError - Error handler for streaming failures
     */
    console.time('Text streaming');

// Define a specific type for OpenAI provider options
interface OpenAIProviderOptions {
  openai?: {
    reasoningEffort?: 'low' | 'medium' | 'high'; // Or just 'medium' if that's the only value
  };
  // Add other potential provider keys here if needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Add index signature to match LanguageModelV1ProviderMetadata
}

    // --- Start: Conditionally set providerOptions ---
    let providerOptions: OpenAIProviderOptions | undefined = undefined; // Use the specific type
    if (modelId.startsWith('o3') || modelId.startsWith('o4-mini')) {
        providerOptions = {
            openai: {
                reasoningEffort: 'medium',
            },
        };
        console.log(`Applying reasoningEffort: 'medium' for model: ${modelId}`);
    } else {
        console.log(`Skipping reasoningEffort for model: ${modelId}`);
    }
    // --- End: Conditionally set providerOptions ---

    console.log('Settings being passed to streamText:', finalSettings); // DEBUG: Log FINAL settings before call
    console.log('Provider options being passed:', providerOptions); // DEBUG: Log provider options
    const result = streamText({
      model: modelInstance,
      system: systemPrompt,
      messages: messagesForAi as Message[], // Modified messages with CSV content
      // Tool Call Set Up
      tools: activeToolsForThisCall, // Use the filtered tools
      maxSteps: 5,
      toolCallStreaming: true,
      experimental_generateMessageId: generateUUID, // This tells the program to generate UUID's for the assistant messages
      experimental_transform: smoothStream({
        delayInMs: 20, // optional: defaults to 10ms
      }),    
      // Spread the FINAL (potentially modified) settings into the streamText call
      ...finalSettings,
      // Pass the dynamically determined provider options
      providerOptions: providerOptions,




      // Let TypeScript infer the event type for onFinish
      onFinish: async (event) => {
        
        /**
         * Handles post-stream operations:
         * - Validates assistant message
         * - Persists user and assistant messages
         */

        console.log('SETTINGS APPLIED WERE', receivedSettings);

        // Destructure needed properties from the inferred event type
        const { response, usage, finishReason } = event;

        console.log('Finish reason:', finishReason);
        console.log('model is', modelInstance.modelId, 'modelId is', modelId); // Log modelId from instance


        // --- Start: Save messages --- //
        if (session.user?.id && userMessage) { // Ensure userMessage is not undefined
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
              messages: [userMessage as Message], // Cast userMessage for this specific function
              responseMessages: response.messages, // Pass ResponseMessage[]
            });

            // Save user message first in onFinish - using ORIGINAL user message, not modified with CSV
            // Combine experimental_attachments with csv_attachment_payloads (if any) for db storage
            const attachmentsForDb = [
              ...(userMessage as UserMessageWithAttachments).experimental_attachments?.map(att => ({
                url: att.url,
                name: att.name || 'attachment', 
                contentType: att.contentType || 'application/octet-stream',
              })) || [],
              ...(csv_attachment_payloads?.map(att => ({
                url: att.url,
                name: att.name || 'attachment',
                contentType: att.contentType || 'application/octet-stream',
              })) || [])
            ];
            
            const userMessageForDb = {
              id: userMessage.id,
              chatId: chatId,
              role: 'user' as const,
              parts: userMessage.parts, // Use original parts, not with CSV content appended
              attachments: attachmentsForDb,
              createdAt: new Date(), // Or use userMessage timestamp if available
              model_id: null // User messages don't have a model_id
            };
            
            await saveMessages({
              messages: [userMessageForDb],
            });

            // Then save assistant message
            const assistantModelDbId = null; // Placeholder: Replace with actual DB ID lookup

            await saveMessages({
              messages: [
                {
                  id: assistantId,
                  chatId: chatId,
                  role: assistantMessage.role,
                  parts: assistantMessage.parts,
                  attachments:
                    (assistantMessage as UserMessageWithAttachments).experimental_attachments ?? [],
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
        if (session?.user?.id && userMessage) { // Check session and userMessage exist
          try {
            // Also save CSV attachments to the database on error
            const attachmentsForDbOnError = [
              ...(userMessage as UserMessageWithAttachments).experimental_attachments?.map(att => ({
                url: att.url,
                name: att.name || 'attachment',
                contentType: att.contentType || 'application/octet-stream',
              })) ?? [],
              ...(csv_attachment_payloads?.map(att => ({
                url: att.url,
                name: att.name || 'csv_attachment', // Ensure name is never undefined
                contentType: att.contentType || 'text/csv',
              })) ?? [])
            ];

            const userMessageForDbOnError = {
              id: userMessage.id,
              chatId: chatId,
              role: 'user' as const,
              parts: userMessage.parts,
              attachments: attachmentsForDbOnError,
              createdAt: new Date(),
              model_id: null
            };
            await saveMessages({
              messages: [userMessageForDbOnError],
            });

          } catch (saveError) {
            console.error('Failed to save user message during streaming error:', saveError);
          }
        }
      }
    });


    console.timeEnd('Text streaming');
    return result.toDataStreamResponse({
      sendSources: true,
      sendReasoning: agent?.showReasoning !== false,
    });

  } catch (error) { // Catch overall errors
    console.error("Error in POST /api/chat:", error);
    // Determine appropriate status code based on error type if possible
    const status = error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500;
    return new Response(error instanceof Error ? error.message : 'Internal Server Error', { status });
  } finally {
    console.timeEnd('Total request time');
  }
}
