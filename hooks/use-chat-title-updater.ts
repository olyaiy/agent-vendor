'use client'; // Assuming this hook might be used in client components

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSWRConfig } from 'swr';
import { getChatTitleAction } from '@/db/actions/chat-actions';

// Define the SWR key (consistent with HistoryMenu)
const SWR_KEY_RECENT_CHATS = 'userRecentChats';

export function useChatTitleUpdater(chatId: string, initialTitle: string | null | undefined) {
  // State for the chat title, initialized with the prop
  const [displayTitle, setDisplayTitle] = useState<string | null | undefined>(initialTitle);
  // Ref to store the retry timeout ID
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Get the mutate function from SWR config
  const { mutate } = useSWRConfig();

  // The core logic for fetching and updating the title, now encapsulated
  const handleChatFinish = useCallback(async () => {
    // Clear any existing retry timeout before starting a new fetch sequence
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Fetch the updated title when AI finishes
    if (chatId) {
      try {
        const updatedTitle = await getChatTitleAction(chatId);

        if (updatedTitle === 'New Conversation') {

          retryTimeoutRef.current = setTimeout(async () => {
            try {

              const firstRetryTitle = await getChatTitleAction(chatId);


              if (firstRetryTitle === 'New Conversation') {
                // If still "New Conversation", schedule second retry

                retryTimeoutRef.current = setTimeout(async () => {
                  try {
                    const secondRetryTitle = await getChatTitleAction(chatId);
                    setDisplayTitle(secondRetryTitle); // Update with the final result
                    // Trigger SWR mutation only if title actually changed
                    if (secondRetryTitle !== 'New Conversation') {
                      mutate(SWR_KEY_RECENT_CHATS);
                    }
                  } catch (secondRetryError) {
                    console.error("Failed to fetch updated chat title on second retry:", secondRetryError);
                  } finally {
                    retryTimeoutRef.current = null; // Clear ref after second retry execution
                  }
                }, 3000); // Wait 3 seconds for the second retry
              } else {
                // If first retry was successful, update title
                setDisplayTitle(firstRetryTitle);
                mutate(SWR_KEY_RECENT_CHATS); // Trigger SWR mutation
                retryTimeoutRef.current = null; // Clear ref as retry sequence is complete
              }
            } catch (firstRetryError) {
              console.error("Failed to fetch updated chat title on first retry:", firstRetryError);
              retryTimeoutRef.current = null; // Clear ref even if first retry fails
            }
          }, 3000); // Wait 3 seconds for the first retry (Adjusted from original comment)
        } else {
          // If initial title is valid, update immediately
          setDisplayTitle(updatedTitle);
          mutate(SWR_KEY_RECENT_CHATS); // Trigger SWR mutation
        }
      } catch (error) {
        console.error("Failed to fetch updated chat title:", error);
        // Optionally handle the error, e.g., show a toast notification
      }
    }
  }, [chatId, mutate]); // Dependencies for useCallback

  // Cleanup timeout on component unmount or if chatId changes
  useEffect(() => {
    // Update displayTitle if initialTitle prop changes externally
    setDisplayTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    // Cleanup function
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null; // Also clear the ref itself

      }
    };
  }, [chatId]); // Rerun effect if chatId changes, ensuring cleanup for the old chatId

  // Return the state and the handler function
  return {
    displayTitle,
    handleChatFinish,
  };
}
