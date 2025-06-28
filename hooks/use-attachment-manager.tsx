import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { uploadChatAttachmentAction, deleteChatAttachmentAction } from "@/db/actions/chat-attachment.actions";

export const CHAT_ATTACHMENT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const CHAT_ATTACHMENT_ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "text/*", "application/pdf", "text/csv"];

export interface PendingAttachment {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  uploadedUrl?: string;
  uploadedName?: string;
  uploadedContentType?: string;
}

export interface AttachmentPayload {
  url: string;
  name: string;
  contentType: string;
}

interface UseAttachmentManagerProps {
  userId: string;
  maxAttachments?: number;
}

export function useAttachmentManager({ userId, maxAttachments = 5 }: UseAttachmentManagerProps) {
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      pendingAttachments.forEach(att => {
        if (att.previewUrl && att.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(att.previewUrl);
        }
      });
    };
  }, [pendingAttachments]);

  const processFilesForAttachment = useCallback(async (filesToProcess: File[]) => {
    if (pendingAttachments.length + filesToProcess.length > maxAttachments) {
      toast.error(`You can attach a maximum of ${maxAttachments} files per message.`);
      return;
    }

    const newAttachmentsBatch: PendingAttachment[] = [];
    for (const file of filesToProcess) {
      if (file.size > CHAT_ATTACHMENT_MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" is too large. Max size is ${CHAT_ATTACHMENT_MAX_FILE_SIZE / 1024 / 1024}MB.`);
        continue;
      }
      if (!CHAT_ATTACHMENT_ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error(`File type for "${file.name}" is not allowed. Allowed types: ${CHAT_ATTACHMENT_ALLOWED_FILE_TYPES.join(', ')}`);
        continue;
      }
      const attachmentId = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      newAttachmentsBatch.push({ id: attachmentId, file, previewUrl, status: 'pending' });
    }

    if (newAttachmentsBatch.length > 0) {
      setPendingAttachments(prev => [...prev, ...newAttachmentsBatch]);
    } else {
      return;
    }

    // Upload each attachment
    for (const att of newAttachmentsBatch) {
      setPendingAttachments(prev => prev.map(pa => pa.id === att.id ? { ...pa, status: 'uploading' } : pa));
      const uploadFormData = new FormData();
      uploadFormData.append('file', att.file);
      try {
        const result = await uploadChatAttachmentAction(uploadFormData, userId);
        if (result.success && result.data) {
          setPendingAttachments(prev => prev.map(pa => pa.id === att.id ? {
            ...pa, status: 'success', uploadedUrl: result.data.url,
            uploadedName: result.data.name, uploadedContentType: result.data.contentType,
          } : pa));
        } else {
          const errorMessage = !result.success && 'error' in result ? result.error : 'Upload failed';
          setPendingAttachments(prev => prev.map(pa => pa.id === att.id ? { ...pa, status: 'error', errorMessage } : pa));
          toast.error(`Failed to upload ${att.file.name}: ${errorMessage}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        setPendingAttachments(prev => prev.map(pa => pa.id === att.id ? { ...pa, status: 'error', errorMessage: 'Network or server error during upload' } : pa));
        toast.error(`Error uploading ${att.file.name}.`);
      }
    }
  }, [pendingAttachments, userId, maxAttachments]);

  const handleRemoveAttachment = useCallback(async (attachmentId: string) => {
    const attachmentToRemove = pendingAttachments.find(att => att.id === attachmentId);

    // Optimistically remove from UI and revoke blob URL
    setPendingAttachments(prev => prev.filter(att => att.id !== attachmentId));
    if (attachmentToRemove && attachmentToRemove.previewUrl && attachmentToRemove.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(attachmentToRemove.previewUrl);
    }

    // If the attachment was successfully uploaded, attempt to delete from R2
    if (attachmentToRemove && attachmentToRemove.status === 'success' && attachmentToRemove.uploadedUrl) {
      const maxRetries = 3;
      let attempt = 0;
      let deletedFromR2 = false;

      while (attempt < maxRetries && !deletedFromR2) {
        attempt++;
        try {
          const result = await deleteChatAttachmentAction(attachmentToRemove.uploadedUrl, userId);
          if (result.success) {
            deletedFromR2 = true;
          } else {
            if (attempt >= maxRetries) {
              toast.error(`Failed to delete ${attachmentToRemove.file.name} from storage: ${result.error}`);
            } else {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        } catch (error) {
          console.error("Error calling deleteChatAttachmentAction:", error);
          if (attempt >= maxRetries) {
            toast.error(`Error deleting ${attachmentToRemove.file.name} from storage.`);
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
    }
  }, [pendingAttachments, userId]);

  const clearAttachments = useCallback(() => {
    setPendingAttachments(prev => {
      prev.forEach(att => {
        if (att.previewUrl && att.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(att.previewUrl);
        }
      });
      return [];
    });
  }, []);

  const getAttachmentPayloads = useCallback(() => {
    const successfulAttachments = pendingAttachments.filter(att => att.status === 'success' && att.uploadedUrl);

    const regularAttachments = successfulAttachments
      .filter(att => att.uploadedContentType !== 'text/csv')
      .map(att => ({
        url: att.uploadedUrl!,
        name: att.uploadedName || att.file.name,
        contentType: att.uploadedContentType || att.file.type,
      }));

    const csvAttachments = successfulAttachments
      .filter(att => att.uploadedContentType === 'text/csv')
      .map(att => ({
        url: att.uploadedUrl!,
        name: att.uploadedName || att.file.name,
        contentType: att.uploadedContentType || att.file.type,
      }));

    return { regularAttachments, csvAttachments };
  }, [pendingAttachments]);

  const hasSuccessfulAttachments = pendingAttachments.some(att => att.status === 'success');

  return {
    pendingAttachments,
    setPendingAttachments,
    processFilesForAttachment,
    handleRemoveAttachment,
    clearAttachments,
    getAttachmentPayloads,
    hasSuccessfulAttachments
  };
} 