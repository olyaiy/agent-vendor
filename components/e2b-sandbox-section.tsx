'use client';

import React from 'react';
import type { ToolInvocation } from 'ai';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { CodeBlock } from '@/components/ui/code-block';
import { Loader2, Terminal, Code2, CheckCircle2, AlertCircle, DownloadCloud } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const LOCAL_STORAGE_DOWNLOADED_KEY = 'autoDownloadedFileSignatures';

interface E2BSandboxSectionProps {
  toolInvocation: ToolInvocation & { state: 'call' | 'result' };
}

interface E2BSandboxResult {
  text?: string;
  stdout?: string[];
  stderr?: string[];
  results?: Array<{ text: string }>;
  error?: string | null;
  downloadable_file?: {
    name: string;
    content_base64: string;
  } | null;
}

type E2BSandboxArgs = {
    code: string;
    [key: string]: unknown;
};

type ToolInvocationWithE2BResult = E2BSandboxSectionProps['toolInvocation'] & {
  state: 'result';
  args: E2BSandboxArgs;
  result: E2BSandboxResult;
  toolCallId: string; // Ensure toolCallId is part of this specific type
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 5 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  }
};

const accordionAnimation = {
  closed: {
    opacity: 0,
    height: 0
  },
  open: {
    opacity: 1,
    height: "auto",
    transition: {
      height: {
        duration: 0.3,
        ease: "easeOut"
      },
      opacity: {
        duration: 0.25,
        delay: 0.05
      }
    }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      height: {
        duration: 0.2,
        ease: "easeIn"
      },
      opacity: {
        duration: 0.15
      }
    }
  }
};

export function E2BSandboxSection({ toolInvocation }: E2BSandboxSectionProps) {
  const currentArgs = toolInvocation.args as E2BSandboxArgs;
  const codeToExecute = currentArgs.code;
  const [isOpen, setIsOpen] = React.useState(false);
  const layoutKey = React.useMemo(() => `sandbox-${Math.random().toString(36).substring(2, 9)}`, []);

  const previousStateRef = React.useRef<E2BSandboxSectionProps['toolInvocation']['state'] | null>(null);
  const isInitialMountRef = React.useRef(true);

  const handleDownload = React.useCallback((fileName: string, base64Content: string, mimeType: string = 'application/octet-stream') => {
    try {
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error during file download:", error);
    }
  }, []);

  React.useEffect(() => {
    if (!toolInvocation || !toolInvocation.toolCallId) { // Guard against missing toolInvocation or toolCallId
        previousStateRef.current = toolInvocation?.state || null;
        return;
    }

    const currentState = toolInvocation.state;
    const prevState = previousStateRef.current;

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousStateRef.current = currentState;
      return; 
    }

    if (prevState !== 'result' && currentState === 'result') {
      const invocationWithResult = toolInvocation as ToolInvocationWithE2BResult;
      const file = invocationWithResult.result?.downloadable_file;
      const toolCallId = invocationWithResult.toolCallId; // Already guarded above

      if (file && file.name && file.content_base64) {
        const currentFileSignature = `${toolCallId}-${file.name}`;
        try {
          const storedSignaturesRaw = localStorage.getItem(LOCAL_STORAGE_DOWNLOADED_KEY);
          const downloadedSignatures: string[] = storedSignaturesRaw ? JSON.parse(storedSignaturesRaw) : [];

          if (!downloadedSignatures.includes(currentFileSignature)) {
            handleDownload(file.name, file.content_base64);
            downloadedSignatures.push(currentFileSignature);
            localStorage.setItem(LOCAL_STORAGE_DOWNLOADED_KEY, JSON.stringify(downloadedSignatures));
          }
        } catch (error) {
          console.error("Error accessing localStorage for auto-download:", error);
          // Fallback: still attempt download if localStorage fails, as it's better than silently failing.
          // This might lead to re-downloads if localStorage is consistently failing, but it's a trade-off.
          // Alternatively, don't download if localStorage fails to avoid unexpected behavior.
          // For now, let's attempt download if localStorage access fails to ensure user gets the file at least once.
           handleDownload(file.name, file.content_base64);
        }
      }
    }
    previousStateRef.current = currentState;
  }, [toolInvocation, handleDownload]);

  if (!toolInvocation) return null; // Guard if toolInvocation is initially null/undefined

  if (toolInvocation.state === 'call') {
    return (
      <motion.div
        className="p-2 my-1 border rounded-lg bg-muted/30"
        variants={container}
        initial="hidden"
        animate="show"
        layoutId={layoutKey}
      >
        <motion.div variants={item} className="flex items-center gap-2">
          <motion.div
            animate={{
              rotate: [0, 360],
              transition: { duration: 1, repeat: Infinity, ease: "linear" }
            }}
          >
            <Loader2 className="h-4 w-4 text-primary" />
          </motion.div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">Executing Python Code</p>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
            >
              <Badge variant="outline" className="bg-primary/5 text-primary/80 text-[10px] py-0 px-1.5 h-4">
                <Code2 className="h-2.5 w-2.5 mr-1" />
                Python
              </Badge>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (toolInvocation.state === 'result') {
    const invocationWithResult = toolInvocation as ToolInvocationWithE2BResult;
    const sandboxResult = invocationWithResult.result;

    if (!sandboxResult) {
        return null;
    }

    const outputText = sandboxResult.text || (sandboxResult.results && sandboxResult.results.length > 0 && sandboxResult.results[0]?.text);
    const hasStdout = sandboxResult.stdout && sandboxResult.stdout.length > 0;
    const hasStderr = sandboxResult.stderr && sandboxResult.stderr.length > 0;
    const hasOutput = outputText || hasStdout || hasStderr;
    const hasError = !!sandboxResult.error;
    const downloadableFileFromResult = sandboxResult.downloadable_file;

    return (
      <motion.div
        className="my-1 border rounded-lg bg-muted/30"
        variants={container}
        initial="hidden"
        animate="show"
        layoutId={layoutKey}
        transition={{ duration: 0.3 }}
      >
        <Accordion
          type="single"
          collapsible
          className="w-full"
          onValueChange={(value) => setIsOpen(!!value)}
        >
          <AccordionItem value="results" className="border-b-0">
            <motion.div
              whileHover={{
                backgroundColor: 'rgba(0, 0, 0, 0.03)'
              }}
              transition={{ duration: 0.2 }}
              className="rounded-t-lg"
            >
              <AccordionTrigger className="hover:no-underline cursor-pointer">
                <div className="flex items-center justify-between w-full px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Badge variant="outline" className="bg-primary/5 text-primary/80 text-[10px] py-0 px-1.5 h-4">
                        <Code2 className="h-2.5 w-2.5 mr-1" />
                        Python
                      </Badge>
                    </motion.div>
                    {hasError ? (
                      <motion.span
                        className="text-xs text-destructive flex items-center gap-1"
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <motion.div
                          animate={{
                            scale: [1, 1.15, 1],
                            transition: { duration: 0.5, delay: 0.3 }
                          }}
                        >
                          <AlertCircle className="h-3 w-3" />
                        </motion.div>
                        Execution Failed
                      </motion.span>
                    ) : (
                      <motion.span
                        className="text-xs text-emerald-600 flex items-center gap-1"
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{
                            scale: 1,
                            opacity: 1,
                            transition: { delay: 0.2, duration: 0.3, type: "spring" }
                          }}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                        </motion.div>
                        Execution Complete
                      </motion.span>
                    )}
                  </div>
                  <motion.span
                    className="text-xs text-muted-foreground flex items-center gap-1"
                    whileHover={{ color: 'var(--foreground)' }}
                    transition={{ duration: 0.15 }}
                  >
                    <Terminal className="h-3.5 w-3.5" />
                    {hasError ? "View Error Details" : hasOutput ? "View Results" : "No Output"}
                  </motion.span>
                </div>
              </AccordionTrigger>
            </motion.div>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial="closed"
                  animate="open"
                  exit="exit"
                  variants={accordionAnimation}
                >
                  <AccordionContent
                    className="space-y-2 px-2 pb-2"
                    forceMount
                  >
                    <motion.div
                      className="rounded-md"
                      variants={item}
                    >
                      <CodeBlock language="python" code={codeToExecute || ''} filename="executed_code.py" />
                    </motion.div>
                    {hasError && (
                      <motion.div
                        variants={item}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 py-2">
                          <Terminal className="h-4 w-4" />
                          <AlertTitle className="font-semibold text-sm">Execution Error</AlertTitle>
                          <AlertDescription className="text-xs">
                            <pre className="whitespace-pre-wrap font-mono">{sandboxResult?.error}</pre>
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                    {outputText && !hasError && (
                      <motion.div
                        className="bg-background p-2 rounded-md border"
                        variants={item}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                      >
                        <h4 className="text-xs font-medium mb-1 text-primary flex items-center gap-1.5">
                          <Terminal className="h-3.5 w-3.5" />
                          Output
                        </h4>
                        <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-[200px] font-mono text-foreground">{outputText}</pre>
                      </motion.div>
                    )}
                    {!hasOutput && !hasError && (
                      <motion.div
                        className="bg-muted/20 p-2 rounded-md border"
                        variants={item}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                      >
                        <p className="text-sm text-muted-foreground italic flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Code executed successfully with no output.
                        </p>
                      </motion.div>
                    )}
                    {hasStdout && sandboxResult?.stdout && (
                      <motion.div
                        variants={item}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <h4 className="text-xs font-medium mb-0.5 text-muted-foreground flex items-center gap-1.5">
                          <Terminal className="h-3.5 w-3.5" />
                          Standard Output
                        </h4>
                        <CodeBlock language="bash" code={sandboxResult.stdout.join('\n')} filename="stdout" />
                      </motion.div>
                    )}
                    {hasStderr && !hasError && sandboxResult?.stderr && (
                      <motion.div
                        variants={item}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                      >
                        <h4 className="text-xs font-medium mb-0.5 text-destructive/80 flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Standard Error
                        </h4>
                        <CodeBlock language="bash" code={sandboxResult.stderr.join('\n')} filename="stderr" />
                      </motion.div>
                    )}
                    {downloadableFileFromResult && downloadableFileFromResult.name && downloadableFileFromResult.content_base64 && (
                      <motion.div
                        variants={item}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-2"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => handleDownload(downloadableFileFromResult.name, downloadableFileFromResult.content_base64)}
                        >
                          <DownloadCloud className="h-4 w-4 mr-2" />
                          Download {downloadableFileFromResult.name}
                        </Button>
                      </motion.div>
                    )}
                  </AccordionContent>
                </motion.div>
              )}
            </AnimatePresence>
          </AccordionItem>
        </Accordion>
      </motion.div>
    );
  }

  // Fallback for unexpected states or missing data
  return (
    <motion.div
      className="p-2 my-1 border rounded-lg bg-muted/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
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