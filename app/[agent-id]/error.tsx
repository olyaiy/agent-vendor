'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Something went wrong!</h2>
      <p className="text-muted-foreground mb-6">
        An unexpected error occurred while trying to load this agent.
      </p>
      {/* Optional: Display error details during development */}
      {process.env.NODE_ENV === 'development' && (
         <details className="mb-6 p-4 bg-muted rounded-md text-left text-sm w-full max-w-lg overflow-auto">
           <summary className="cursor-pointer font-medium">Error Details</summary>
           <pre className="mt-2 whitespace-pre-wrap">
             <code>{error.message}</code>
             {error.digest && <p>Digest: {error.digest}</p>}
             {error.stack && <p>Stack: {error.stack}</p>}
           </pre>
         </details>
      )}
      <Button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Try Again
      </Button>
    </div>
  );
}