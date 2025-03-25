import { generateUUID } from '@/lib/utils';
import { DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import { Session } from 'next-auth';
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from '@/lib/artifacts/server';

interface CreateDocumentProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const createDocument = ({ session, dataStream }: CreateDocumentProps) =>
  tool({
    description: 'Create a document with a specific type',
    parameters: z.object({
      title: z.string(),
      kind: z.enum(artifactKinds),
    }),
    execute: async ({ title, kind }, { messages }) => {
      const id = generateUUID();
 

      dataStream.writeData({
        type: 'kind',
        content: kind,
      });

      dataStream.writeData({
        type: 'id',
        content: id,
      });

      dataStream.writeData({
        type: 'title',
        content: title,
      });

      dataStream.writeData({
        type: 'clear',
        content: '',
      });

      const documentHandler = documentHandlersByArtifactKind.find(
        (documentHandlerByArtifactKind) =>
          documentHandlerByArtifactKind.kind === kind,
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${kind}`);
      }

      await documentHandler.onCreateDocument({
        id,
        title,
        dataStream,
        session,
        messages,
      });

      dataStream.writeData({ type: 'finish', content: '' });

      return {
        id,
        title,
        kind,
        content: 'A document was created and is now visible to the user.',
      };
    },
  });

// New specialized document creators
export const createTextDocument = ({ session, dataStream }: CreateDocumentProps) =>
  tool({
    description: 'Create a new text document',
    parameters: z.object({ title: z.string() }),
    execute: async ({ title }, options) => {


      return createDocument({ session, dataStream }).execute(
        { title: title, kind: 'text' },
        options
      );
    },
  });

export const createCodeDocument = ({ session, dataStream }: CreateDocumentProps) =>
  tool({
    description: 'Create a new code document',
    parameters: z.object({ title: z.string() }),
    execute: async ({ title }, options) => {
      return createDocument({ session, dataStream }).execute(
        { title, kind: 'code' },
        options
      );
    },
  });

export const createImageDocument = ({ session, dataStream }: CreateDocumentProps) =>
  tool({
    description: 'Create a new image document',
    parameters: z.object({ title: z.string() }),
    execute: async ({ title }, options) => {
      return createDocument({ session, dataStream }).execute(
        { title, kind: 'image' },
        options
      );
    },
  });

export const createSheetDocument = ({ session, dataStream }: CreateDocumentProps) =>
  tool({
    description: 'Create a new spreadsheet document',
    parameters: z.object({ title: z.string() }),
    execute: async ({ title }, options) => {
      return createDocument({ session, dataStream }).execute(
        { title, kind: 'sheet' },
        options
      );
    },
  });
