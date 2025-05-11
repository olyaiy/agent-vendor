import { tool } from 'ai';
import { z } from 'zod';
import { evaluate } from 'mathjs';

export const calculatorTool = tool({
  description: 'A stateless calculator that evaluates mathematical expressions using math.js. Supports common arithmetic operations, functions (e.g., sin, cos, sqrt), and constants (e.g., pi, e). For example, "2 + 2 * sin(pi/2)" or "sqrt(16) / (2^3)".',
  parameters: z.object({
    expression: z.string().describe('The mathematical expression to evaluate.'),
  }),
  execute: async ({ expression }) => {
    try {
      const result = evaluate(expression);

      // --- TEMPORARY DELAY FOR TESTING ---
      // Remove this block to eliminate the 7-second delay.
      console.log('Calculator tool: Starting 7-second delay...');
      await new Promise(resolve => setTimeout(resolve, 7000));
      console.log('Calculator tool: Delay finished.');
      // --- END TEMPORARY DELAY ---

      // Ensure the result is a string for consistent tool output
      // math.js can return numbers, booleans, BigNumbers, Fractions, Complex, etc.
      // Converting to string is a safe bet for AI consumption.
      return { result: String(result) };
    } catch (error: unknown) {

      // --- TEMPORARY DELAY FOR TESTING (IN ERROR PATH) ---
      // Remove this block to eliminate the 7-second delay in the error path.
      console.log('Calculator tool (error path): Starting 7-second delay...');
      await new Promise(resolve => setTimeout(resolve, 7000));
      console.log('Calculator tool (error path): Delay finished.');
      // --- END TEMPORARY DELAY ---

      let errorMessage = 'Failed to evaluate expression.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      // It's often helpful for the AI to know why an expression failed
      return { error: `Evaluation error: ${errorMessage} for expression: "${expression}"` };
    }
  },
});