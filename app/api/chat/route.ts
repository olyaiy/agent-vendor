import { streamText } from 'ai';
// Remove direct openai import, we'll get the model instance via the helper
// import { openai } from "@ai-sdk/openai";
import { getModelInstanceById } from '@/lib/models'; // Import the helper function
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';





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
      model: modelId, 
      messages, 
      systemPrompt 
    } = await req.json();


    // Get the model instance using the helper function
    const modelInstance = getModelInstanceById(modelId);



    const result = streamText({
      model: modelInstance, // Use the dynamically obtained model instance
      system: systemPrompt,
      messages,
    });
  
    return result.toDataStreamResponse();

}
