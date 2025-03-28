import { z } from 'zod';
import { streamObject } from 'ai';
import { myProvider } from '@/lib/ai/models';
import { codePrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';

export const reactDocumentHandler = createDocumentHandler<'react'>({
  kind: 'react',
  onCreateDocument: async ({ title, dataStream, messages}) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: `You are a React developer. 
      Generate a React component with a descriptive PascalCase name. 
      Do not include imports. no exports either. just the component definition.
      no returns either.

`,

      messages: messages,
      schema: z.object({
        componentName: z.string(),
        code: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { componentName, code } = object;

        if (componentName) {
          dataStream.writeData({
            type: 'metadata-update',
            content: componentName,
          });
        }

        if (code) {
          dataStream.writeData({
            type: 'react-delta',
            content: code,
          });
          draftContent = code;
        }
      }
    }

    console.log('fullStream');
    console.log(fullStream);

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(document.content, 'react'),
      prompt: description,
      schema: z.object({
        code: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { code } = object;

        if (code) {
          dataStream.writeData({
            type: 'react-delta',
            content: code ?? '',
          });

          draftContent = code;
        }
      }
    }

    return draftContent;
  },
});
