import { streamText } from 'ai';
// Remove direct openai import, we'll get the model instance via the helper
// import { openai } from "@ai-sdk/openai";
import { getModelInstanceById } from '@/lib/models'; // Import the helper function
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { createChat, getChatById } from '@/db/repository/chat-repository';
import { generateTitleFromUserMessage } from '@/db/actions/chat-actions';





/* ---- POST Request for Chat ---- */
/*                                 */
export async function POST(req: Request) {
  console.time('Total request time');

  // Get the session
  console.time('Session retrieval');
  const session = await auth.api.getSession({
      headers: await headers()
  });
  console.timeEnd('Session retrieval');

  // If the user is not logged in, return an error
  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Destructure model, messages, and systemPrompt from the request body
  const { 
    chatId,
    model: modelId, 
    messages, 
    systemPrompt 
  } = await req.json();

  // Get the chat by id
  console.time('Chat lookup');
  const chat = await getChatById(chatId);
  console.timeEnd('Chat lookup');

  // Fetch or Create the chat
  console.time('Chat creation check'); // Renamed timer
  if (!chat) {
    // --- Start: Fire-and-forget chat creation ---
    (async () => {
      try {
        console.time('Background chat creation');
        const title = await generateTitleFromUserMessage({
          message: messages[0],
        });
        await createChat({ id: chatId, userId: session.user.id, title });
        console.timeEnd('Background chat creation');
        console.log(`Background chat created successfully: ${chatId}`);
      } catch (error) {
        console.error(`Error creating chat in background for ${chatId}:`, error);
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

  // Get the model instance (This will now run much sooner if chat didn't exist)
  console.time('Model instance retrieval');
  const modelInstance = getModelInstanceById(modelId);
  console.timeEnd('Model instance retrieval');

  // Stream text
  console.time('Text streaming');
  const result = streamText({
    model: modelInstance,
    system: systemPrompt,
    messages,
  });
  console.timeEnd('Text streaming');

  console.timeEnd('Total request time');
  return result.toDataStreamResponse();
}
