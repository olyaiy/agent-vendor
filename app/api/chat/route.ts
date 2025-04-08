import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
    const { messages } = await req.json();

    // Log the incoming messages
    console.log("Received messages:", messages);

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: 'You are a helpful assistant.',
      messages,
    });
  
    return result.toDataStreamResponse();

}

