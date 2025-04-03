'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpIcon } from '@/components/util/icons';

/**
 * Button component for submitting messages
 * 
 * Features:
 * - Visual feedback with arrow icon
 * - Disabled when input is empty or files are uploading
 * - Custom memo implementation to optimize re-renders
 */
function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      className="rounded-full p-3 sm:p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <div className="sm:scale-[0.65]">
        <ArrowUpIcon size={22} />
      </div>
    </Button>
  );
}

/**
 * Memoized version of the send button with custom equality checks
 * Only re-renders when input or upload queue changes
 */
export const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
