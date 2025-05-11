import 'dotenv/config'; // To ensure E2B_API_KEY is loaded
import { tool } from 'ai';
import { z } from 'zod';
import { Sandbox } from '@e2b/code-interpreter';

export const e2bSandboxTool = tool({
  description: 'Executes Python code in a secure E2B sandbox environment and returns the execution output. Use this to run scripts, calculations, or any Python code.',
  parameters: z.object({
    code: z.string().describe('The Python code to execute in the sandbox.'),
  }),
  execute: async ({ code }) => {
    let sandbox: Sandbox | undefined = undefined;
    try {
      // Ensure E2B_API_KEY is available
      if (!process.env.E2B_API_KEY) {
        throw new Error('E2B_API_KEY is not set in environment variables.');
      }

      sandbox = await Sandbox.create({ apiKey: process.env.E2B_API_KEY });

      const {
        text,
        results,
        logs,
        error: executionError // Renamed to avoid conflict with the catch block variable
      } = await sandbox.runCode(code);

      return {
        text: text, // Primary textual output
        stdout: logs?.stdout, // stdout from logs
        stderr: logs?.stderr, // stderr from logs
        results: results,     // Structured results from execution
        // logs: logs,        // The full logs object, can be verbose. Optional to include.
        error: executionError ? String(executionError) : null, // Convert ExecutionError to string
      };
    } catch (error: unknown) {
      console.error('Error executing code in E2B sandbox:', error);
      let errorMessage = 'An unexpected error occurred during sandbox execution.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return {
        stdout: '',
        stderr: errorMessage,
        results: [],
        logs: { stdout: [], stderr: [errorMessage] },
        error: errorMessage,
      };
    }
    // Removed the finally block that was causing the error
  },
});