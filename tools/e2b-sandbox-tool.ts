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

      const execution = await sandbox.runCode(code);

      return {
        stdout: execution.stdout,
        stderr: execution.stderr,
        results: execution.results,
        logs: execution.logs,
        error: execution.error ? execution.error.message : null,
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