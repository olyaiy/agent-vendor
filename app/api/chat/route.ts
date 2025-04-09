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

  // Get the session
  const session = await auth.api.getSession({
      headers: await headers()
  })

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


    const chat = await getChatById(chatId);

      
    if (chat) {
      console.log("the chat is", chat);
  } else {
      console.log("the chat is not found");
  }


  // Fetch or Create the chat
  if (!chat) {
  console.log("the chat is not found, creating a new one");
  const title = await generateTitleFromUserMessage({
    message: messages[0],
  });

  console.log("the title is", title);
  await createChat({ id: chatId, userId: session.user.id, title });
  console.log("the chat is created");

  } else {

    console.log("the chat is found, checking if the user is authorized");
    if (chat.userId !== session.user.id) {
      
      return new Response('Unauthorized', { status: 401 });
    }
  }




    // Get the model instance using the helper function
    const modelInstance = getModelInstanceById(modelId);



    const result = streamText({
      model: modelInstance, // Use the dynamically obtained model instance
      system: systemPrompt,
      messages,
    });
  
    return result.toDataStreamResponse();

}
