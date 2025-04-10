import { appendResponseMessages, streamText } from 'ai';
// Remove direct openai import, we'll get the model instance via the helper
// import { openai } from "@ai-sdk/openai";
import { getModelInstanceById } from '@/lib/models'; // Import the helper function
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { createChat, getChatById, saveMessages, updateChatTitle } from '@/db/repository/chat-repository'; // Import updateChatTitle
import { generateTitleFromUserMessage } from '@/db/actions/chat-actions';
import { generateUUID, getMostRecentUserMessage, getTrailingMessageId } from '@/lib/utils';





/* ---- POST Request for Chat ---- */
/*                                 */
export async function POST(req: Request) {
  console.time('Total request time');

  /* ---- AUTH CHECK ---- */
  console.time('Session retrieval');
  const session = await auth.api.getSession({
      headers: await headers()
  });
  console.timeEnd('Session retrieval');

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  /* ---- DESTRUCTURE REQUEST BODY ---- */
  const { 
    chatId,
    model: modelId, 
    messages, 
    systemPrompt,
    agentId
  } = await req.json();




  /* ---- GET MOST RECENT USER MESSAGE ---- */
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
        await createChat({ id: chatId, userId: session.user.id, title: "New Chat" , agentId: agentId});
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



  /* ---- SAVE USER MESSAGE ---- */
  console.time('Message saving');
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


  console.timeEnd('Message saving');



  /* ---- GET MODEL INSTANCE ---- */
  console.time('Model instance retrieval');
  const modelInstance = getModelInstanceById(modelId);
  console.timeEnd('Model instance retrieval');


  /* ---- STREAM TEXT ---- */
  console.time('Text streaming');
  const result = streamText({
    model: modelInstance,
    system: systemPrompt,
    messages,
    experimental_generateMessageId: generateUUID, // This tells the program to generate UUID's for the assistant messages
    onFinish: async ({ response }) => {
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
        } catch (error) {
          console.error('Failed to save chat', error);
        }
      }
    },
    onError: (error) => {
      console.error('Error streaming text', error);
    }
  });
  

  console.timeEnd('Text streaming');
  return result.toDataStreamResponse();
}
