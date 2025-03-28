import {
  type 
  UIMessage,
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { supportsTools, myProvider } from '@/lib/ai/models';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  saveChat,
  saveMessages,
  getModelById,
  recordTransaction,
  getAgentToolsWithSingleQuery,
  getChatById,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from '@/lib/utils';
import { generateTitleAsynchronously } from '../../actions';
import { toolRegistry } from '@/lib/ai/tools/registry';
import { hasCredits, INSUFFICIENT_CREDITS_MESSAGE } from '@/lib/credits';
import { KnowledgeItem } from '@/lib/db/schema';
import type { ModelSettings } from '@/components/chat/chat';

export async function POST(request: Request) {
  console.time('total-request');
  console.time('parse-request');
  const {
    id,
    messages,
    selectedChatModel, // The model name/identifier for the AI request
    selectedModelId, // The actual database model ID for saving
    agentId,
    agentSystemPrompt,  
    creatorId,
    searchEnabled,
    knowledgeItems,
    modelSettings = {} // Add model settings with default empty object
  }: { 
    id: string; 
    messages: Array<UIMessage>; 
    selectedChatModel: string; 
    selectedModelId: string;
    agentId: string;
    agentSystemPrompt?: string;
    creatorId: string;
    searchEnabled?: boolean;
    knowledgeItems?: KnowledgeItem[];
    modelSettings?: ModelSettings;
  } = await request.json();
  console.timeEnd('parse-request');
  

  // Get the session
  console.time('auth-check');
  const session = await auth();
  console.timeEnd('auth-check');

  // If the user is not logged in, return an error
  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Fetch critical dependencies in parallel
  console.time('parallel-dependencies');
  const [
    userHasCredits, 
    modelDetails, 
    agentTools,
    userMessage,
    chat
  ] = await Promise.all([
    // Check if user has enough credits
    hasCredits(session.user.id),
    // Get model details
    getModelById(selectedModelId),
    // Get agent tools
    getAgentToolsWithSingleQuery(agentId),
    // Prepare user message - small CPU operation that can run in parallel
    Promise.resolve(getMostRecentUserMessage(messages)),
    // Get chat details
    getChatById({ id })
  ]);
  console.timeEnd('parallel-dependencies');

  // Extract provider options early
  const providerOptions = modelDetails?.provider_options;

  // Check if credit check failed
  if (!userHasCredits) {
    return new Response(INSUFFICIENT_CREDITS_MESSAGE, { status: 402 });
  }

  // If the user message is not found, return an error
  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  // If the chat is not found, generate a title and save the chat
  if (!chat) {
    console.time('save-new-chat');
    try {
      // Save the chat immediately with "New Chat" as the temporary title
      await saveChat({ id, userId: session.user.id, title: "New Chat", agentId });
      
      // Asynchronously generate a better title without blocking
      generateTitleAsynchronously({ 
        message: userMessage, 
        chatId: id
      }).catch(err => console.error('Async title generation failed:', err));
    } catch (error) {
      console.timeEnd('save-new-chat');
      return new Response('Failed to create chat', { status: 500 });
    }
    console.timeEnd('save-new-chat');
  }

  // THEN save messages 
  console.time('save-messages');
  await saveMessages({
    messages: [{
      chatId: id,
      id: userMessage.id,
      role: 'user',
      parts: userMessage.parts,
      attachments: userMessage.experimental_attachments ?? [],
      model_id: selectedModelId,
      createdAt: new Date(),
    }],
    // User messages are critical, don't defer
    deferNonCritical: false
  });
  console.timeEnd('save-messages');

  // Initialize running tally for usage outside execute to make it accessible to onError
  const runningTally = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0
  };

  // Initialize array to accumulate messages outside execute to make it accessible to onError
  const accumulatedMessages: any[] = [];

  // Initialize step counter
  let stepCounter = 0;

  // Track saved message IDs to avoid duplicates
  const savedMessageIds = new Set<string>();

  // 
  return createDataStreamResponse({
    execute: async (dataStream) => {
      console.time('dataStream-execute');

      /* -------- TOOLS SET UP -------- */
      console.time('tools-setup');
      // Extract unique tool names
      const availableToolNames = [
        ...new Set(agentTools.map(tool => tool.tool)),
        'createReactDocument' // Hardcoded addition
      ];

      // Create tools object with the appropriate tools
      const registry = toolRegistry({ 
        session, 
        dataStream,
      });

      const tools: Record<string, any> = {};
      for (const toolName of availableToolNames) {
        // Special handling for searchTool based on the searchEnabled flag
        // Only exclude the search tool if searchEnabled is explicitly false
        if (toolName === 'searchTool' && searchEnabled === false) {
          continue; // Skip adding the search tool if searchEnabled is false
        }

        if (toolName === 'retrieveTool' && searchEnabled === false) {
          continue; // Skip adding the search tool if searchEnabled is false
        }
        
        if (registry[toolName as keyof typeof registry]) {
          tools[toolName] = registry[toolName as keyof typeof registry];
        }
      }

      // Get the list of tool names that are actually available
      const activeToolNames = Object.keys(tools);
      console.timeEnd('tools-setup');

    /* -------- STREAM TEXT -------- */
      console.time('stream-text-start');
      
      // Extract model settings without the _changed tracking property
      const { 
        _changed,
        ...settings
      } = modelSettings;
      
      // Only include settings that have been explicitly changed
      const processedSettings: Partial<ModelSettings> = {};
      
      if (_changed) {
        Object.keys(_changed).forEach((key) => {
          const settingKey = key as keyof typeof settings;
          if (_changed[settingKey]) {
            processedSettings[settingKey] = settings[settingKey];
          }
        });
      }
      
      const result = streamText({
        
        // Model
          model: myProvider.languageModel(selectedChatModel),
        // System Prompt
          system: systemPrompt({ 
            selectedChatModel, 
            agentSystemPrompt,
            hasSearchTool: activeToolNames.includes('searchTool'),
            knowledgeItems
          }),
          experimental_transform: smoothStream({
            delayInMs: 20, // optional: defaults to 10ms
            chunking: 'word', // optional: defaults to 'word'
          }),
        
        // Messages
          messages,
        // Max Steps
          maxSteps: 20,
        // Active Tools
          experimental_activeTools:
            supportsTools(selectedChatModel) && activeToolNames.length > 0
              ? activeToolNames
              : [],
        // Tools
          tools,
        // config
        // experimental_transform: smoothStream({
          // delayInMs: 20, // optional: defaults to 10ms
          // chunking: 'line', // optional: defaults to 'word'
        // }),
        providerOptions: providerOptions as any,
        experimental_generateMessageId: generateUUID,
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
        },
        toolCallStreaming: true,
        
        // Add model settings that have been explicitly changed
        ...processedSettings,
        
        /* ---- ON FINISH ---- */
        onFinish: async ({ response , usage, sources }) => {

          // Save the messages
          if (session.user?.id) {
            try {
              // Get the assistant ID and prepare the message concurrently
              const [assistantId, assistantMessagePrep] = await Promise.all([
                // Get the trailing message ID
                Promise.resolve(getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                })),
                // Append response messages
                Promise.resolve(appendResponseMessages({
                  messages: [userMessage],
                  responseMessages: response.messages,
                }))
              ]);

              if (!assistantId) {
                throw new Error('No assistant message found!');
              }

              // Extract the assistant message
              const assistantMessage = assistantMessagePrep[1];

              // Create a new parts array that includes sources first, then the text content
              const augmentedParts = [
                // Add each source as a separate part
                ...(sources || []).map(source => ({
                  type: 'source',
                  source: {
                    sourceType: source.sourceType,
                    id: source.id,
                    url: source.url
                  }
                })),
                // Then add the existing text parts
                ...(assistantMessage.parts || [])
              ];

              // Record the message ID as saved to prevent duplicates in error handling
              savedMessageIds.add(assistantId);
              
              // When we need to record a transaction, we can't defer message saving
              // because the transaction needs the message to exist first
              // First save the message
              await saveMessages({
                messages: [
                  {
                    id: assistantId,
                    chatId: id,
                    role: assistantMessage.role,
                    parts: augmentedParts,
                    attachments: assistantMessage.experimental_attachments ?? [],
                    createdAt: new Date(),
                    model_id: selectedModelId
                  },
                ],
                // Don't defer when we need to record transactions that reference this message
                deferNonCritical: false
              });

              // Second, record usage transaction if necessary
              if (usage && modelDetails) {
                await recordTransaction({
                  agentId: agentId,
                  userId: session.user.id,
                  type: creatorId === session.user.id ? 'self_usage' : 'usage',
                  messageId: assistantId,
                  modelId: selectedModelId,
                  costPerMillionInput: modelDetails.cost_per_million_input_tokens || '0',
                  costPerMillionOutput: modelDetails.cost_per_million_output_tokens || '0',
                  usage: {
                    promptTokens: usage.promptTokens,
                    completionTokens: usage.completionTokens
                  }
                });
              }
                  
            } catch (error) {
              console.log('failed to save chat')
              console.log(error)
              // Failed to save chat
            }
          }
        },
      });
      console.timeEnd('stream-text-start');
      console.timeEnd('total-request');

      result.consumeStream();      
      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
        sendSources: true,
      });
      console.timeEnd('dataStream-execute');
    },
    
    /* -------- ERROR HANDLING -------- */
    onError: (error: unknown) => {
      // Save accumulated messages to the database if we have any
      if (accumulatedMessages.length > 0 && session?.user?.id) {
        (async () => {
          try {
            // Check if we have any message IDs that were already saved in onFinish
            const duplicateIds = accumulatedMessages
              .map(msg => msg.id)
              .filter(id => savedMessageIds.has(id));
            
            if (duplicateIds.length > 0) {
              // Filter out messages that were already saved
              const uniqueMessages = accumulatedMessages.filter(msg => !savedMessageIds.has(msg.id));
              
              if (uniqueMessages.length > 0) {
                // Don't defer these messages if we need to reference them in transactions
                await saveMessages({
                  messages: uniqueMessages,
                  // Only use deferred writes if no transactions will reference these messages
                  deferNonCritical: false
                });
              }
            } else {
              // No duplicates, proceed with saving all accumulated messages
              await saveMessages({
                messages: accumulatedMessages,
                // Only use deferred writes if no transactions will reference these messages
                deferNonCritical: false
              });
            }
            
            // After messages are saved, we can safely record the transaction
            if (runningTally.totalTokens > 0 && session?.user?.id && modelDetails) {
              try {
                // Ensure user exists and extract ID
                if (!session.user || !session.user.id) {
                  console.error('User session missing when trying to record transaction');
                  return;
                }
                
                const userId = session.user.id;
                await recordTransaction({
                  agentId: agentId,
                  userId: userId,
                  type: creatorId && creatorId === userId ? 'self_usage' : 'usage',
                  messageId: userMessage.id || generateUUID(),
                  modelId: selectedModelId,
                  costPerMillionInput: modelDetails.cost_per_million_input_tokens || '0',
                  costPerMillionOutput: modelDetails.cost_per_million_output_tokens || '0',
                  usage: {
                    promptTokens: runningTally.promptTokens,
                    completionTokens: runningTally.completionTokens
                  },
                  description: 'Error occurred during generation - this was the usage up until the error'
                });
              } catch (txError) {
                console.error('Failed to record transaction on error:', txError);
              }
            }
          } catch (saveError) {
            console.error('Failed to save accumulated messages on error:', saveError);
          }
        })().catch(e => {
          console.error('Unhandled error in error handling:', e);
        });
      } 
      // If no accumulated messages but we still have token usage to record
      else if (runningTally.totalTokens > 0 && session?.user?.id && modelDetails) {
        (async () => {
          try {
            // Ensure user exists and extract ID
            if (!session.user || !session.user.id) {
              console.error('User session missing when trying to record transaction');
              return;
            }
            
            const userId = session.user.id;
            await recordTransaction({
              agentId: agentId,
              userId: userId,
              type: creatorId && creatorId === userId ? 'self_usage' : 'usage',
              messageId: userMessage.id || generateUUID(),
              modelId: selectedModelId,
              costPerMillionInput: modelDetails.cost_per_million_input_tokens || '0',
              costPerMillionOutput: modelDetails.cost_per_million_output_tokens || '0',
              usage: {
                promptTokens: runningTally.promptTokens,
                completionTokens: runningTally.completionTokens
              },
              description: 'Error occurred during generation - this was the usage up until the error'
            });
          } catch (txError) {
            console.error('Failed to record transaction on error:', txError);
          }
        })().catch(e => {
          console.error('Unhandled error in transaction recording:', e);
        });
      }
      
      // Return a more descriptive error message
      if (error instanceof Error) {
        return `Error: ${error.message} (Usage tally: ${JSON.stringify(runningTally)})`;
      } else if (typeof error === 'string') {
        return `Error: ${error} (Usage tally: ${JSON.stringify(runningTally)})`;
      } else {
        return `Oops, an error occurred! Please try again. (Usage tally: ${JSON.stringify(runningTally)})`;
      }
    },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();
  
  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (!chat) {
      return new Response('Not Found', { status: 404 });
    }

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
