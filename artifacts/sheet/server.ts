import { myProvider } from '@/lib/ai/models';
import { sheetPrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { streamObject } from 'ai';
import { z } from 'zod';

export const sheetDocumentHandler = createDocumentHandler<'sheet'>({
  kind: 'sheet',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = ''; // Stores the accumulated CSV content

    // Create a stream for generating the initial document content
    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'), // Use configured AI model
      system: sheetPrompt, // System prompt for sheet generation
      prompt: title, // User-provided title as the main prompt
      schema: z.object({
        csv: z.string().describe('CSV data'), // Define expected output schema
      }),
    });

    // Process the stream of data from the AI model
    for await (const delta of fullStream) {
      const { type } = delta;

      // Handle object-type deltas containing CSV data
      if (type === 'object') {
        const { object } = delta;
        const { csv } = object;

        if (csv) {
          // Write the CSV data to the stream for real-time updates
          dataStream.writeData({
            type: 'sheet-delta',
            content: csv,
          });

          // Update the draft content with the latest CSV data
          draftContent = csv;
        }
      }
    }

    // Finalize the document with the complete content
    dataStream.writeData({
      type: 'sheet-delta',
      content: draftContent,
    });

    return draftContent; // Return the final CSV content
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = ''; // Stores the updated CSV content

    // Create a stream for updating the existing document
    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'), // Use configured AI model
      system: updateDocumentPrompt(document.content, 'sheet'), // System prompt for updates
      prompt: description, // User-provided description of changes
      schema: z.object({
        csv: z.string(), // Define expected output schema
      }),
    });

    // Process the stream of data from the AI model
    for await (const delta of fullStream) {
      const { type } = delta;

      // Handle object-type deltas containing CSV data
      if (type === 'object') {
        const { object } = delta;
        const { csv } = object;

        if (csv) {
          // Write the CSV data to the stream for real-time updates
          dataStream.writeData({
            type: 'sheet-delta',
            content: csv,
          });

          // Update the draft content with the latest CSV data
          draftContent = csv;
        }
      }
    }

    return draftContent; // Return the updated CSV content
  },
});
