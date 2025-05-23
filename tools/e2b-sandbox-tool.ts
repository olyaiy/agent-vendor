import 'dotenv/config'; // To ensure E2B_API_KEY is loaded
import { tool } from 'ai';
import { z } from 'zod';
import { Sandbox } from '@e2b/code-interpreter';
import path from 'path'; // Added for path.basename

export const e2bSandboxTool = tool({
  description: 'Executes code (Python, JavaScript, R, Java, Bash) in a secure E2B sandbox environment and returns the execution output. Optionally, can download a file generated by the code. IMPORTANT: The sandbox cannot import external files - any files needed must be created manually within your code (e.g., write file contents as strings in your code).',
  parameters: z.object({
    code: z.string().describe('The code to execute in the sandbox. Any files needed must be created within your code as the sandbox cannot import external files.'),
    language: z.enum(['python', 'javascript', 'js', 'r', 'java', 'bash']).optional().default('python').describe("The programming language of the code. Defaults to 'python'."),
    output_file_path: z.string().optional().describe('Absolute path of the file to download from the sandbox after code execution (e.g., /home/user/output.csv).'),
    output_file_name: z.string().optional().describe('Suggested name for the downloaded file (e.g., report.csv). If not provided, it will be derived from output_file_path.'),
  }),
  execute: async ({ code, language, output_file_path, output_file_name }) => {
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
      } = await sandbox.runCode(code, { language });

      let downloadableFile = null;
      if (output_file_path && sandbox) {
        try {
          const fileContentUint8Array = await sandbox.files.read(output_file_path);
          // Convert Uint8Array to Node.js Buffer to use .toString('base64')
          const fileContentBuffer = Buffer.from(fileContentUint8Array);
          downloadableFile = {
            name: output_file_name || path.basename(output_file_path),
            content_base64: fileContentBuffer.toString('base64'),
            // Consider adding mimetype if it can be determined or passed
          };
        } catch (fileError: unknown) {
          console.error(`Error reading file ${output_file_path} from sandbox:`, fileError);
          // Optionally, add this error to the main error reporting or stderr
          // For now, we'll just log it and not include the file if reading fails.
        }
      }

      return {
        text: text, // Primary textual output
        stdout: logs?.stdout, // stdout from logs
        stderr: logs?.stderr, // stderr from logs
        results: results,     // Structured results from execution
        error: executionError ? String(executionError) : null, // Convert ExecutionError to string
        downloadable_file: downloadableFile, // Added downloadable file object
      };
    } catch (error: unknown) {
      console.error('Error executing code in E2B sandbox:', error);
      let errorMessage = 'An unexpected error occurred during sandbox execution.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return {
        text: '', // Ensure all fields are present even in error cases
        stdout: '',
        stderr: errorMessage,
        results: [],
        // logs: { stdout: [], stderr: [errorMessage] }, // logs might not be available
        error: errorMessage,
        downloadable_file: null, // Ensure this is present
      };
    }
    // Removed the finally block that was causing the error
  },
});