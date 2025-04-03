'use client';

import type { Attachment } from 'ai';
import { memo } from 'react';

/**
 * Component to display attachment previews with loading state
 * 
 * Features:
 * - Displays image attachments with proper rendering
 * - Shows loading indicator for in-progress uploads
 * - Displays filename with truncation for long names
 * - Consistent sizing for better UX
 * - Subtle hover interaction with scale effect
 */
export interface AttachmentPreviewProps {
  /** Attachment data including URL, name and content type */
  attachment: Attachment;
  /** Whether the attachment is currently being uploaded */
  isUploading?: boolean;
  /** Optional callback when remove button is clicked */
  onRemove?: (attachment: Attachment) => void;
}

/**
 * Pure component for previewing file attachments
 * Handles both uploaded attachments and ones in the upload queue
 */
function PureAttachmentPreview({
  attachment,
  isUploading = false,
  onRemove,
}: AttachmentPreviewProps) {
  const { name, url, contentType } = attachment;

  return (
    <div className="flex flex-col gap-2 relative group hover:scale-105 transition-transform duration-200 ease-out cursor-pointer">
      <div className="w-20 h-16 aspect-video bg-muted rounded-md relative flex flex-col items-center justify-center  shadow-sm group-hover:shadow-md transition-shadow border border-red-500/10">
        {contentType ? (
          contentType.startsWith('image') ? (
            // NOTE: it is recommended to use next/image for images
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={name ?? 'An image attachment'}
              className="rounded-md size-full object-cover"
            />
          ) : (
            <div className="" />
          )
        ) : (
          <div className="" />
        )}

        {isUploading && (
          <div className="animate-spin absolute text-zinc-500">
            <LoaderIcon />
          </div>
        )}

        {/* Remove button */}
        {!isUploading && onRemove && (
          <button
            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 size-5 flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors "
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(attachment);
            }}
            aria-label="Remove attachment"
          >
            <XIcon />
          </button>
        )}
      </div>
      <div className="text-xs text-zinc-500 max-w-16 truncate">{name}</div>
    </div>
  );
}

/**
 * Loading spinner icon for upload state
 */
function LoaderIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

/**
 * X icon for remove button
 */
function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

/**
 * Memoized version of attachment preview to prevent unnecessary re-renders
 */
export const AttachmentPreview = memo(PureAttachmentPreview);
