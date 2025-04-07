import { and, asc, desc, eq, gt } from 'drizzle-orm';
import { db } from '../client';
import { document, suggestion, type Suggestion } from '../schema';
import { handleDbError } from '../utils/errorHandler';
import { ArtifactKind } from '@/components/artifact/artifact';

/**
 * Save a document to the database
 */
export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    return handleDbError(error, 'Failed to save document in database');
  }
}

/**
 * Get all documents with a specific ID
 */
export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    return handleDbError(error, 'Failed to get document by id from database', []);
  }
}

/**
 * Get a single document by ID
 */
export async function getDocumentById({ id }: { id: string }): Promise<{
  id: string;
  title: string;
  kind: "text" | "code" | "image" | "sheet" | "react";
  content: string | null;
  userId: string;
  createdAt: Date;
} | undefined> {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    return handleDbError(error, 'Failed to get document by id from database');
  }
}

/**
 * Delete documents by ID after a timestamp
 */
export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    return handleDbError(error, 'Failed to delete documents by id after timestamp from database');
  }
}

/**
 * Save suggestions to the database
 */
export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    return handleDbError(error, 'Failed to save suggestions in database');
  }
}

/**
 * Get suggestions by document ID
 */
export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    return handleDbError(error, 'Failed to get suggestions by document version from database', []);
  }
} 