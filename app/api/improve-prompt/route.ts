import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai'; 
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { prompt: currentPrompt, customInstructions } = await req.json();

    if (!currentPrompt) {
      return new NextResponse(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const model = openai('gpt-4.1-mini'); // User file shows gpt-4.1-mini, can be changed

    // System message defining the AI's role as a prompt engineer
    const systemMessage = `You are a prompt engineering assistant specialized in refining user-provided prompts for AI models. Your goal is to transform user prompts into clear, context-rich, and actionable instructions for AI applications, maximizing model effectiveness while preserving the user's original intent. Follow these guidelines:
- Clarify the agent's role, objectives, constraints, and required output.
- Structure the prompt with sections like Context, Task, and Output Format when needed.
- Include examples, edge cases, or parameter definitions when applicable.
- Use concise, direct language; remove ambiguity and redundancy.
- Preserve all essential details without adding new information.
- Avoid meta-commentary, apologies, or verbose preambles.
Output only the improved prompt text as plain text, without any additional explanation or formatting.`;

    const userDefinedInstructions = customInstructions || "Please improve the following prompt:";

    const finalPrompt = `${userDefinedInstructions}\n\nOriginal prompt:\n---\n${currentPrompt}\n---\n\nImproved prompt:`;

    const result = streamText({
      model: model,
      system: systemMessage,
      prompt: finalPrompt,
    });

    // Respond with the stream using toTextStreamResponse
    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Error improving prompt:', error);
    let errorMessage = 'Failed to improve prompt.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return new NextResponse(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}