'use client';

import { useState, useCallback } from 'react';
import type { Attachment } from 'ai';
import { toast } from 'sonner';

/**
 * Interface for successful file upload response
 */
interface UploadResponse {
  url: string;
  pathname: string;
  contentType: string;
}

/**
 * Custom hook for handling file uploads in multimodal chat
 * 
 * Features:
 * - File upload to server with progress tracking
 * - Image paste from clipboard
 * - Attachment state management
 * - Error handling
 * 
 * @param initialAttachments - Initial list of attachments
 * @returns Object containing attachment state and handler functions
 */
export function useFileUpload(initialAttachments: Attachment[] = []) {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);

  /**
   * Uploads a file to the server
   * @param file - File to upload
   * @returns Promise with attachment data or undefined on error
   */
  const uploadFile = useCallback(async (file: File): Promise<Attachment | undefined> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json() as UploadResponse;
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType,
        };
      }
      
      // Handle API error responses
      if (response.status >= 400) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file, please try again!');
    }
    
    return undefined;
  }, []);

  /**
   * Handles file input change event
   * Uploads selected files and updates attachments state
   */
  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      if (files.length === 0) return;

      // Update the upload queue with file names
      setUploadQueue(files.map((file) => file.name));

      try {
        // Upload all files in parallel
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        
        // Filter out failed uploads
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment): attachment is Attachment => attachment !== undefined
        );

        // Update attachments state
        setAttachments(currentAttachments => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
        toast.error('Upload failed. Please try again.');
      } finally {
        // Clear the upload queue when done
        setUploadQueue([]);
      }
    },
    [uploadFile],
  );

  /**
   * Handles paste events containing images
   * Extracts images from clipboard and uploads them
   */
  const handlePaste = useCallback(
    async (event: React.ClipboardEvent) => {
      const clipboardItems = event.clipboardData.items;
      const imageItems = Array.from(clipboardItems).filter(
        item => item.type.startsWith('image/')
      );

      if (imageItems.length === 0) {
        // No images in clipboard, proceed with normal paste
        return;
      }

      // Get the images from clipboard
      const imageFiles = imageItems.map(item => {
        const blob = item.getAsFile();
        if (!blob) return null;
        
        // Create a new file with a reasonable name
        const fileExtension = blob.type.split('/')[1] || 'png';
        const fileName = `clipboard-image-${Date.now()}.${fileExtension}`;
        return new File([blob], fileName, { type: blob.type });
      }).filter(Boolean) as File[];

      if (imageFiles.length === 0) return;

      // Add files to upload queue
      setUploadQueue(imageFiles.map(file => file.name));

      try {
        // Upload all images in parallel
        const uploadPromises = imageFiles.map(file => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        
        // Filter out failed uploads
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment): attachment is Attachment => attachment !== undefined
        );

        // Update attachments state
        setAttachments(currentAttachments => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading clipboard images!', error);
        toast.error('Failed to upload clipboard image, please try again!');
      } finally {
        // Clear the upload queue when done
        setUploadQueue([]);
      }
    },
    [uploadFile],
  );

  /**
   * Resets attachment state to empty
   */
  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  return {
    // State
    attachments,
    setAttachments,
    uploadQueue,
    
    // Handlers
    handleFileChange,
    handlePaste,
    uploadFile,
    clearAttachments,
  };
}
