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
import { generateTitleAsynchronously, generateTitleFromUserMessage } from '../../actions';
import { toolRegistry } from '@/lib/ai/tools/registry';
import { hasCredits, INSUFFICIENT_CREDITS_MESSAGE } from '@/lib/credits';
import { KnowledgeItem } from '@/lib/db/schema';

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
    knowledgeItems
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

  // Check if user has enough credits
  console.time('credits-check');
  const userHasCredits = await hasCredits(session.user.id);
  console.timeEnd('credits-check');
  if (!userHasCredits) {
    return new Response(INSUFFICIENT_CREDITS_MESSAGE, { status: 402 });
  }

  // Get the most recent user message
  console.time('get-user-message');
  const userMessage = getMostRecentUserMessage(messages);
  console.timeEnd('get-user-message');

  // If the user message is not found, return an error
  if (!userMessage) {
    console.log('No user message found');
    console.log(messages);
    return new Response('No user message found', { status: 400 });
  }

  // Get the chat
  console.log('THE ID IS', id);
  console.log('trying get chat by id');
  console.time('get-chat');
  const chat = await getChatById({ id });
  console.timeEnd('get-chat');
  console.log('The chat is', chat);


  // If the chat is not found, generate a title and save the chat FIRST
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
  });
  console.timeEnd('save-messages');

  // Get the model details
  console.time('get-model-details');
  const modelDetails = await getModelById(selectedModelId);
  const providerOptions = modelDetails?.provider_options;
  console.timeEnd('get-model-details');

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
      // Get all tools for this agent in a single database query
      const agentTools = await getAgentToolsWithSingleQuery(agentId);

      // Extract unique tool names
      const availableToolNames = [...new Set(agentTools.map(tool => tool.tool))];

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
        experimental_transform: smoothStream({
          delayInMs: 10, // optional: defaults to 10ms
          chunking: 'word', // optional: defaults to 'word'
        }),
        providerOptions: providerOptions as any,
        experimental_generateMessageId: generateUUID,
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
        },
        toolCallStreaming: true,

        
        /* ---- ON FINISH ---- */
        onFinish: async ({ response , usage }) => {
        

          // Save the messages
          if (session.user?.id) {
            try {

              const assistantId = getTrailingMessageId({
                messages: response.messages.filter(
                  (message) => message.role === 'assistant',
                ),
              });

              if (!assistantId) {
                throw new Error('No assistant message found!');
              }

              const [, assistantMessage] = appendResponseMessages({
                messages: [userMessage],
                responseMessages: response.messages,
              });

              
              await saveMessages({
                messages: [
                  {
                    id: assistantId,
                    chatId: id,
                    role: assistantMessage.role,
                    parts: assistantMessage.parts,
                    attachments:
                        assistantMessage.experimental_attachments ?? [],
                    createdAt: new Date(),
                    model_id: selectedModelId
                  },
                ],
              });


              // Instead of calculating cost here, use recordTransaction to track usage
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
      });
      console.timeEnd('dataStream-execute');
    },
    
    /* -------- ERROR HANDLING -------- */
    onError: (error: unknown) => {
      // Record the transaction using runningTally if we have accumulated tokens
      if (runningTally.totalTokens > 0 && session?.user?.id && modelDetails) {
        const userId = session.user.id; // Capture in variable for TypeScript
        // We use a fire-and-forget pattern here to avoid changing the return type of onError
        (async () => {
          try {
            await recordTransaction({
              agentId: agentId,
              userId: userId,
              type: creatorId === userId ? 'self_usage' : 'usage',
              messageId: userMessage.id || generateUUID(), // Ensure we have an ID
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
            // Failed to record transaction on error
          }
        })().catch(e => {/* Unhandled error in fire-and-forget transaction */});
      }
      
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
                await saveMessages({
                  messages: uniqueMessages,
                });
              }
            } else {
              // No duplicates, proceed with saving all accumulated messages
              await saveMessages({
                messages: accumulatedMessages,
              });
            }
          } catch (saveError) {
            // Failed to save accumulated messages on error
          }
        })().catch(e => {/* Unhandled error in fire-and-forget message save */});
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
