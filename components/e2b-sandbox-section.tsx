'use client';

import React from 'react';
import type { ToolInvocation } from 'ai';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { CodeBlock } from '@/components/ui/code-block';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from "lucide-react";

interface E2BSandboxSectionProps {
  toolInvocation: ToolInvocation;
}

// Interface for the expected structure of the 'result' object from e2b_sandbox
interface E2BSandboxResult {
  text?: string;
  stdout?: string[];
  stderr?: string[];
  results?: Array<{ text: string }>;
  error?: string | null;
}

// Args type for e2b_sandbox tool
type E2BSandboxArgs = {
    code: string;
    [key: string]: unknown; // Allow other potential args safely
};

// More specific type for ToolInvocation when state is 'result'
// Using type intersection to combine ToolInvocation with specific properties for the 'result' state
type ToolInvocationWithResult = ToolInvocation & {
  state: 'result';
  args: E2BSandboxArgs;
  result: E2BSandboxResult;
};


export function E2BSandboxSection({ toolInvocation }: E2BSandboxSectionProps) {
  // Safely cast args to our expected type.
  // The 'code' property is essential for this component.
  const currentArgs = toolInvocation.args as E2BSandboxArgs;
  const codeToExecute = currentArgs.code;

  if (toolInvocation.state === 'call') {
    return (
      <div className="p-3 my-2 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Executing Python Code...</p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-b-0">
            <AccordionTrigger className="text-xs hover:no-underline py-2 text-muted-foreground hover:text-foreground">
              Show Code
            </AccordionTrigger>
            <AccordionContent className="mt-1">
              <CodeBlock language="python" code={codeToExecute || ''} filename="submitted_code.py" />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  }

  if (toolInvocation.state === 'result') {
    // Type assertion to inform TypeScript that 'result' is available
    const invocationWithResult = toolInvocation as ToolInvocationWithResult;
    const sandboxResult = invocationWithResult.result;

    const outputText = sandboxResult?.text || (sandboxResult?.results && sandboxResult.results.length > 0 && sandboxResult.results[0]?.text);
    const hasStdout = sandboxResult?.stdout && sandboxResult.stdout.length > 0;
    const hasStderr = sandboxResult?.stderr && sandboxResult.stderr.length > 0;
    
    const isDefaultOpen = !outputText && !sandboxResult?.error && !hasStdout && !hasStderr;

    return (
      <div className="p-3 my-2 border rounded-lg bg-muted/30 space-y-3">
        {sandboxResult?.error && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
            <Terminal className="h-4 w-4" />
            <AlertTitle className="font-semibold text-sm">Execution Error</AlertTitle>
            <AlertDescription className="text-xs">
              <pre className="whitespace-pre-wrap font-mono">{sandboxResult.error}</pre>
            </AlertDescription>
          </Alert>
        )}

        {outputText && !sandboxResult?.error && (
          <div>
            <h4 className="text-xs font-medium mb-1 text-muted-foreground">Output:</h4>
            <pre className="bg-background p-2 rounded-md text-sm whitespace-pre-wrap border">{outputText}</pre>
          </div>
        )}
        
        {!outputText && !sandboxResult?.error && !hasStdout && !hasStderr && (
             <p className="text-sm text-muted-foreground italic">Code executed successfully with no output.</p>
        )}

        <Accordion 
            type="single" 
            collapsible 
            className="w-full" 
            defaultValue={isDefaultOpen ? "executed-code-item" : undefined}
        >
          <AccordionItem value="executed-code-item" className="border-b-0">
            <AccordionTrigger className="text-xs hover:no-underline py-2 text-muted-foreground hover:text-foreground">
              Executed Code
            </AccordionTrigger>
            <AccordionContent className="mt-1">
              <CodeBlock language="python" code={codeToExecute || ''} filename="executed_code.py" />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {hasStdout && sandboxResult?.stdout && (
          <div>
            <h4 className="text-xs font-medium mb-1 text-muted-foreground">Stdout:</h4>
            <CodeBlock language="bash" code={sandboxResult.stdout.join('\n')} filename="stdout" />
          </div>
        )}

        {hasStderr && !sandboxResult?.error && sandboxResult?.stderr && ( 
          <div>
            <h4 className="text-xs font-medium mb-1 text-destructive/80">Stderr:</h4>
            <CodeBlock language="bash" code={sandboxResult.stderr.join('\n')} filename="stderr" />
          </div>
        )}
      </div>
    );
  }

  // Fallback for unexpected states or missing data
  return (
    <div className="p-3 my-2 border rounded-lg bg-muted/30">
      <Alert variant="default" className="bg-amber-500/10 border-amber-500/30 text-amber-700">
        <Terminal className="h-4 w-4" />
        <AlertTitle className="font-semibold text-sm">Code Execution Status</AlertTitle>
        <AlertDescription className="text-xs">
          Displaying raw tool invocation data as current state is not fully handled:
          <pre className='text-xs max-w-full overflow-auto mt-2 p-2 bg-background border rounded-md'>
            {JSON.stringify(toolInvocation, null, 2)}
          </pre>
        </AlertDescription>
      </Alert>
    </div>
  );
}