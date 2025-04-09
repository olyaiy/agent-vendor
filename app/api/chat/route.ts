import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
    const { messages, systemPrompt } = await req.json();

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages,
    });
  
    return result.toDataStreamResponse();

}

