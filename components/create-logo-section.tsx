import React from 'react';
import type { ToolInvocation } from 'ai';
import { Loader2 } from 'lucide-react'; // Using lucide-react for loading icon

interface CreateLogoSectionProps {
  toolInvocation: ToolInvocation;
}

// Define the expected structure of the successful result based on create-logo-tool.ts
interface LogoResult {
  images: Array<{
    url: string;
    content_type?: string;
    file_name?: string;
    file_size?: number;
  }>;
  error?: undefined; // Explicitly undefined when successful
}

// Define the expected structure of the error result
interface ErrorResult {
  error: string;
  images?: undefined; // Explicitly undefined on error
}

// Type guard to check if the result is an error (accepts unknown)
function isErrorResult(result: unknown): result is ErrorResult {
  return typeof result === 'object' && result !== null && typeof (result as ErrorResult).error === 'string';
}

// Type guard to check if the result is successful logo data (accepts unknown)
function isLogoResult(result: unknown): result is LogoResult {
    return typeof result === 'object' && result !== null && Array.isArray((result as LogoResult).images) && (result as LogoResult).error === undefined;
}


export function CreateLogoSection({ toolInvocation }: CreateLogoSectionProps) {
  // Destructure state and args. Access result conditionally based on state.
  const { state, args } = toolInvocation;
  const prompt = typeof args === 'object' && args !== null && 'prompt' in args ? String(args.prompt) : 'Unknown prompt';

  // --- Loading State ---
  if (state === 'call') {
    return (
      <div className="p-4 border rounded-md bg-muted/30">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {/* Use template literal */}
          <span>{`Generating logo for: "${prompt}"...`}</span>
        </div>
      </div>
    );
  }

  // --- Result State ---
  if (state === 'result') {
    // Access result only when state is 'result'. Cast to unknown for type guards.
    const result = toolInvocation.result as unknown;

    // Handle Error Result
    if (isErrorResult(result)) {
      return (
        <div className="p-4 border rounded-md bg-destructive/10 text-destructive">
          <p className="text-sm font-semibold">Logo Generation Failed</p>
          <p className="text-xs mt-1">Error: {result.error}</p>
        </div>
      );
    }

    // Handle Successful Result
    if (isLogoResult(result)) {
      return (
        <div className="p-4 border rounded-md">
          {/* Use template literal */}
          <p className="text-sm font-medium mb-2">{`Generated Logo(s) for: "${prompt}"`}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {result.images.map((image, index) => (
              <a key={index} href={image.url} target="_blank" rel="noopener noreferrer" className="block border rounded overflow-hidden hover:opacity-80 transition-opacity">
                <img
                  src={image.url}
                  alt={`Generated logo ${index + 1}`}
                  className="w-full h-auto object-cover aspect-square" // Ensure images are square
                />
              </a>
            ))}
          </div>
        </div>
      );
    }

    // Handle unexpected result structure
    return (
        <div className="p-4 border rounded-md bg-yellow-100 text-yellow-800">
            <p className="text-sm font-semibold">Unexpected Result Structure</p>
            <pre className='text-xs max-w-full overflow-auto border rounded-md p-2 mt-1 bg-white'>
                {JSON.stringify(result, null, 2)}
            </pre>
        </div>
    );
  }

  // Should not happen if state is 'call' or 'result'
  return null;
}

export default CreateLogoSection;