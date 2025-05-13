// In db/actions/chat-attachment.actions.ts
'use server';

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { ActionResult } from "./types"; // Assuming ActionResult is defined

// Reuse R2 configuration from agent.actions.ts or centralize it
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY;
const R2_SECRET_KEY = process.env.R2_SECRET_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL_BASE = process.env.R2_PUBLIC_URL_BASE;

let s3Client: S3Client | null = null;
if (R2_ENDPOINT && R2_ACCESS_KEY && R2_SECRET_KEY) {
    s3Client = new S3Client({
        region: "auto",
        endpoint: R2_ENDPOINT,
        credentials: {
            accessKeyId: R2_ACCESS_KEY,
            secretAccessKey: R2_SECRET_KEY,
        },
    });
} else {
    console.warn("R2 S3 client for chat attachments is not fully configured.");
}

const CHAT_ATTACHMENT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const CHAT_ATTACHMENT_ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "text/*", "application/pdf", "text/csv"];

interface UploadedAttachmentData {
  url: string;
  name: string;
  contentType: string;
}

export async function uploadChatAttachmentAction(
    formData: FormData,
    userId: string // Passed from client, verified against session
): Promise<ActionResult<UploadedAttachmentData>> {
    if (!s3Client || !R2_BUCKET_NAME || !R2_PUBLIC_URL_BASE) {
        return { success: false, error: "Server configuration error for file uploads." };
    }

    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user || session.user.id !== userId) {
            console.error("Unauthorized user attempted to upload chat attachment.");
            return { success: false, error: "Unauthorized." };
        }

        const file = formData.get("file") as File | null;

        if (!file) {
            return { success: false, error: "No file provided." };
        }
        if (!CHAT_ATTACHMENT_ALLOWED_FILE_TYPES.includes(file.type)) {
            return { success: false, error: `Invalid file type. Allowed: ${CHAT_ATTACHMENT_ALLOWED_FILE_TYPES.join(', ')}.` };
        }
        if (file.size > CHAT_ATTACHMENT_MAX_FILE_SIZE) {
            return { success: false, error: `File size exceeds ${CHAT_ATTACHMENT_MAX_FILE_SIZE / 1024 / 1024}MB.` };
        }

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_'); // Basic sanitization
        const key = `chat-attachments/${userId}/${Date.now()}-${sanitizedFilename}`;

        await s3Client.send(
            new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
                Body: fileBuffer,
                ContentType: file.type,
                ACL: 'public-read', // Make object publicly readable via its URL
            })
        );

        const publicUrl = `${R2_PUBLIC_URL_BASE}/${key}`;

        return {
            success: true,
            data: {
                url: publicUrl,
                name: file.name, // Original filename for display
                contentType: file.type,
            },
        };
    } catch (error) {
        console.error("Failed to upload chat attachment:", error);
        return { success: false, error: `Upload failed: ${(error as Error).message}` };
    }
}

export async function deleteChatAttachmentAction(
    attachmentUrl: string,
    userId: string // Passed from client, verified against session
): Promise<ActionResult<{ deleted: boolean }>> {
    if (!s3Client || !R2_BUCKET_NAME || !R2_PUBLIC_URL_BASE) {
        return { success: false, error: "Server configuration error for file operations." };
    }

    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user || session.user.id !== userId) {
            console.error("Unauthorized user attempted to delete chat attachment.");
            return { success: false, error: "Unauthorized." };
        }

        if (!attachmentUrl.startsWith(R2_PUBLIC_URL_BASE)) {
            console.error("Invalid attachment URL for deletion:", attachmentUrl);
            return { success: false, error: "Invalid attachment URL." };
        }

        const key = attachmentUrl.substring(R2_PUBLIC_URL_BASE.length + (R2_PUBLIC_URL_BASE.endsWith('/') ? 0 : 1));

        // Security check: Ensure the key is within the user's chat attachments directory
        if (!key.startsWith(`chat-attachments/${userId}/`)) {
            console.error(`User ${userId} attempted to delete an unauthorized key: ${key}`);
            return { success: false, error: "Permission denied to delete this attachment." };
        }
        
        await s3Client.send(
            new DeleteObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
            })
        );

        return {
            success: true,
            data: { deleted: true },
        };
    } catch (error) {
        console.error("Failed to delete chat attachment:", error);
        return { success: false, error: `Deletion failed: ${(error as Error).message}` };
    }
}