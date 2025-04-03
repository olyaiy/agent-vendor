'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { PaperclipIcon } from '@/components/util/icons';
import { UseChatHelpers } from '@ai-sdk/react';

/**
 * Button component for attachment uploads
 * 
 * Features:
 * - Triggers file input dialog when clicked
 * - Disabled when chat is not in 'ready' state
 * - Visually indicates when attachments can be added
 */
function PureAttachmentButton({
  fileInputRef,
  status
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers['status'];
}) {
  return (
    <Button
      className="rounded-md rounded-bl-lg p-[6px] sm:p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== 'ready'}
      variant="ghost"
    >
      <PaperclipIcon size={14} />
    </Button>
  );
}

/**
 * Memoized version of the attachment button to prevent unnecessary re-renders
 */
export const AttachmentButton = memo(PureAttachmentButton);
