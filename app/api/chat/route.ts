import { streamText } from 'ai';
// Remove direct openai import, we'll get the model instance via the helper
// import { openai } from "@ai-sdk/openai";
import { getModelInstanceById } from '@/lib/models'; // Import the helper function

export async function POST(req: Request) {
    // Destructure model, messages, and systemPrompt from the request body
    const { model: modelId, messages, systemPrompt } = await req.json();

    // Get the model instance using the helper function
    const modelInstance = getModelInstanceById(modelId);

    const result = streamText({
      model: modelInstance, // Use the dynamically obtained model instance
      system: systemPrompt,
      messages,
    });


    console.log("THE MODEL INSTANCE IS", modelInstance);
  
    return result.toDataStreamResponse();

}
