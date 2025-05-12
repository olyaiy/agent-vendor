import { tool } from 'ai';
import { z } from 'zod';
import { fal } from '@fal-ai/client';

// Define the input schema based on the fal.ai Ideogram V3 API
// Starting with just the required 'prompt'
const createLogoParams = z.object({
  prompt: z.string().describe('The text prompt for the logo generation.'),
  // Future enhancements could include:
  // num_images: z.number().min(1).max(4).optional().default(1).describe('Number of images to generate (1-4).'),
  // image_size: z.enum(['square_hd', 'square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9']).optional().default('square_hd').describe('Aspect ratio/size of the image.'),
  // style: z.enum(['AUTO', 'GENERAL', 'REALISTIC', 'DESIGN']).optional().default('AUTO').describe('Style type for generation.'),
});

// Define the expected successful output schema from fal.ai Ideogram V3
const falIdeogramResponseSchema = z.object({
  images: z.array(
    z.object({
      url: z.string().url(),
      content_type: z.string().optional(),
      file_name: z.string().optional(),
      file_size: z.number().optional(),
    })
  ).min(1), // Expect at least one image
  seed: z.number(),
  // Potentially add other fields if needed later
});

// Define a type for potential FalError structure based on observation/docs
interface FalError extends Error {
    detail?: string | { message?: string }; // Can be string or object
}

export const createLogoTool = tool({
  description: "Generates a logo or image based on a text 'prompt' using the Ideogram V3 model via fal.ai. Returns an array of generated image URLs.",
  parameters: createLogoParams,
  execute: async (params) => {
    const { prompt } = params; // Extract validated parameters

    // Ensure the Fal AI API key is set in environment variables
    const apiKey = process.env.FAL_KEY;
    if (!apiKey) {
      // It's better practice to configure the key once globally if possible,
      // but checking here ensures the tool won't run without it.
      // Consider initializing fal.config({ credentials: apiKey }); elsewhere if needed.
      console.error('Fal AI API key (FAL_KEY) is not set in environment variables.');
      return { error: 'Fal AI API key is not configured.' };
    }

    try {
      console.log(`[createLogoTool] Calling fal.ai with prompt: "${prompt}"`);

      // Use fal.subscribe for potentially long-running image generation
      // We are not using the streaming logs here, just waiting for the final result.
      // Use 'unknown' and let Zod validation handle the type checking.
      const result: unknown = await fal.subscribe("fal-ai/ideogram/v3", {
        input: {
          prompt: prompt,
          // Add other parameters here if the schema is expanded
          // num_images: params.num_images,
          // image_size: params.image_size,
          // style: params.style,
        },
        logs: false, // Don't need intermediate logs for this implementation
        // onQueueUpdate could be used for progress updates in the UI if needed later
      });

      console.log('[createLogoTool] Received response from fal.ai:', result);

      // Validate the response structure
      const validatedResponse = falIdeogramResponseSchema.safeParse(result);

      if (!validatedResponse.success) {
        console.error("[createLogoTool] Fal AI response validation error:", validatedResponse.error);
        // Try to extract a more specific error message if the response structure is known
        let errorMessage = validatedResponse.error.message;
        if (typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'object' && result.error !== null && 'message' in result.error) {
            errorMessage = String(result.error.message);
        } else if (typeof result === 'object' && result !== null && 'detail' in result) {
             errorMessage = String(result.detail);
        }
        return { error: `Fal AI response validation failed: ${errorMessage}`, rawResponse: result };
      }

      // Return only the images array as the successful result for the tool
      return {
        images: validatedResponse.data.images,
        // seed: validatedResponse.data.seed // Could include seed if useful for UI/debugging
      };

    } catch (error) {
      console.error('[createLogoTool] Error executing fal.ai request:', error);
      let detailMessage = error instanceof Error ? error.message : String(error);

      // Type-safe check for FalError structure
      if (typeof error === 'object' && error !== null && 'detail' in error) {
          const falError = error as FalError;
          if (typeof falError.detail === 'string') {
              detailMessage = falError.detail;
          } else if (typeof falError.detail === 'object' && falError.detail !== null && 'message' in falError.detail) {
              detailMessage = falError.detail.message ?? detailMessage;
          }
      }

      return { error: `Failed to generate logo: ${detailMessage}` };
    }
  },
});