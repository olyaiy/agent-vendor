'use client';

import React from 'react';
import type { ToolInvocation } from 'ai';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { CodeBlock } from '@/components/ui/code-block';
import { Loader2, Terminal, Code2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

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

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 5 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export function E2BSandboxSection({ toolInvocation }: E2BSandboxSectionProps) {
  // Safely cast args to our expected type.
  // The 'code' property is essential for this component.
  const currentArgs = toolInvocation.args as E2BSandboxArgs;
  const codeToExecute = currentArgs.code;

  if (toolInvocation.state === 'call') {
    return (
      <motion.div 
        className="p-2 my-1 border rounded-lg bg-muted/30"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item} className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">Executing Python Code</p>
            <Badge variant="outline" className="bg-primary/5 text-primary/80 text-[10px] py-0 px-1.5 h-4">
              <Code2 className="h-2.5 w-2.5 mr-1" />
              Python
            </Badge>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (toolInvocation.state === 'result') {
    // Type assertion to inform TypeScript that 'result' is available
    const invocationWithResult = toolInvocation as ToolInvocationWithResult;
    const sandboxResult = invocationWithResult.result;

    const outputText = sandboxResult?.text || (sandboxResult?.results && sandboxResult.results.length > 0 && sandboxResult.results[0]?.text);
    const hasStdout = sandboxResult?.stdout && sandboxResult.stdout.length > 0;
    const hasStderr = sandboxResult?.stderr && sandboxResult.stderr.length > 0;
    const hasOutput = outputText || hasStdout || hasStderr;
    const hasError = !!sandboxResult?.error;

    return (
      <motion.div 
        className="p-2 my-1 border rounded-lg bg-muted/30"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/5 text-primary/80 text-[10px] py-0 px-1.5 h-4">
              <Code2 className="h-2.5 w-2.5 mr-1" />
              Python
            </Badge>
            
            {hasError ? (
              <span className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Execution Failed
              </span>
            ) : (
              <span className="text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Execution Complete
              </span>
            )}
          </div>
        </motion.div>

        <motion.div variants={item} className="mt-1">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="results" className="border-b-0">
              <AccordionTrigger className="text-xs hover:no-underline py-1 text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer">
                <Terminal className="h-3.5 w-3.5" />
                {hasError ? "View Error Details" : hasOutput ? "View Execution Results" : "No Output"}
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pt-2">
                {/* Code block */}
                <div className="bg-muted/20 p-2 rounded-md border">
                  <h4 className="text-xs font-medium mb-1 text-muted-foreground flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5" />
                    Executed Code
                  </h4>
                  <CodeBlock language="python" code={codeToExecute || ''} filename="executed_code.py" />
                </div>

                {/* Error output */}
                {hasError && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 py-2">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle className="font-semibold text-sm">Execution Error</AlertTitle>
                    <AlertDescription className="text-xs">
                      <pre className="whitespace-pre-wrap font-mono">{sandboxResult?.error}</pre>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Text output */}
                {outputText && !hasError && (
                  <div className="bg-background p-2 rounded-md border">
                    <h4 className="text-xs font-medium mb-1 text-primary flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5" />
                      Output
                    </h4>
                    <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-[200px] font-mono text-foreground">{outputText}</pre>
                  </div>
                )}
                
                {/* No output message */}
                {!hasOutput && !hasError && (
                  <div className="bg-muted/20 p-2 rounded-md border">
                    <p className="text-sm text-muted-foreground italic flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Code executed successfully with no output.
                    </p>
                  </div>
                )}

                {/* Stdout */}
                {hasStdout && sandboxResult?.stdout && (
                  <div>
                    <h4 className="text-xs font-medium mb-0.5 text-muted-foreground flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5" />
                      Standard Output
                    </h4>
                    <CodeBlock language="bash" code={sandboxResult.stdout.join('\n')} filename="stdout" />
                  </div>
                )}

                {/* Stderr */}
                {hasStderr && !hasError && sandboxResult?.stderr && ( 
                  <div>
                    <h4 className="text-xs font-medium mb-0.5 text-destructive/80 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Standard Error
                    </h4>
                    <CodeBlock language="bash" code={sandboxResult.stderr.join('\n')} filename="stderr" />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </motion.div>
    );
  }

  // Fallback for unexpected states or missing data
  return (
    <motion.div 
      className="p-2 my-1 border rounded-lg bg-muted/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Alert variant="default" className="bg-amber-500/10 border-amber-500/30 text-amber-700 py-2">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="font-semibold text-sm">Code Execution Status</AlertTitle>
        <AlertDescription className="text-xs">
          Displaying raw tool invocation data as current state is not fully handled:
          <pre className='text-xs max-w-full overflow-auto mt-1 p-2 bg-background border rounded-md'>
            {JSON.stringify(toolInvocation, null, 2)}
          </pre>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}