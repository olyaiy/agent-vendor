'use client';

import { useState, useCallback, type ChangeEvent } from 'react';
import type { Attachment } from 'ai';
import { toast } from 'sonner';

/**
 * Props for the AttachmentUploader component
 */
export interface AttachmentUploaderProps {
  /** Current list of attachments */
  attachments: Array<Attachment>;
  /** Function to update attachments */
  setAttachments: (attachments: Array<Attachment>) => void;
  /** Function to update the upload queue */
  setUploadQueue: (queue: Array<string>) => void;
}

/**
 * Interface for successful file upload response
 */
interface UploadResponse {
  url: string;
  pathname: string;
  contentType: string;
}

/**
 * Component responsible for handling file uploads
 * 
 * Features:
 * - Handles file input change events
 * - Manages file upload processing
 * - Handles clipboard paste events for images
 * - Provides error handling and user feedback
 */
export function AttachmentUploader({
  attachments,
  setAttachments,
  setUploadQueue
}: AttachmentUploaderProps) {
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
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
    
    return undefined;
  }, []);

  /**
   * Handles file input change event
   * Uploads selected files and updates attachments state
   */
  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
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
        setAttachments([
          ...attachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        // Clear the upload queue when done
        setUploadQueue([]);
      }
    },
    [attachments, setAttachments, setUploadQueue, uploadFile],
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
        setAttachments([
          ...attachments,
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
    [attachments, setAttachments, setUploadQueue, uploadFile]
  );

  return {
    handleFileChange,
    handlePaste,
    uploadFile,
  };
}
