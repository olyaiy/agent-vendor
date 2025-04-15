import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns'; // For user-friendly date formatting
import type { Chat } from '@/db/schema/chat'; // Import base Chat type if needed

// Define the type for the chat data expected by this component
// Should match the selection in getUserChatsPaginated
// Define the type for the chat data expected by this component
// Should match the selection in getUserChatsPaginated and the type in chat-history-client
type ChatHistoryItem = Pick<Chat, 'id' | 'title' | 'createdAt' | 'agentId'> & {
  lastMessageParts: unknown | null;
  lastMessageRole: string | null;
};

// Define a type for the structure within the 'parts' array
interface MessagePart {
  type: string;
  text?: string; // Make text optional as other types might exist
  // Add other potential part properties if needed
}

interface ChatListItemProps {
  chat: ChatHistoryItem;
}

export function ChatListItem({ chat }: ChatListItemProps) {
  // Format the date
  const formattedDate = formatDistanceToNow(new Date(chat.createdAt), {
    addSuffix: true,
  });

  // Determine the link destination using agentId and chatId
  // Handle cases where agentId might be null (though ideally it shouldn't be for a chat)
  const chatLink = chat.agentId ? `/${chat.agentId}/${chat.id}` : '#'; // Fallback link if no agentId

  // Extract and truncate last message preview
  let lastMessagePreview = '';
  if (chat.lastMessageParts && Array.isArray(chat.lastMessageParts)) {
    // Use the defined MessagePart type
    const textPart = chat.lastMessageParts.find((part): part is MessagePart & { type: 'text', text: string } =>
      typeof part === 'object' && part !== null && part.type === 'text' && typeof part.text === 'string'
    );
    if (textPart) { // textPart is now guaranteed to have type 'text' and a string 'text' property
      const prefix = chat.lastMessageRole === 'user' ? 'You: ' : chat.lastMessageRole === 'assistant' ? 'Assistant: ' : '';
      lastMessagePreview = prefix + textPart.text;
      // Truncate the preview
      if (lastMessagePreview.length > 100) {
        lastMessagePreview = lastMessagePreview.substring(0, 100) + '...';
      }
    }
  }

  // Row content instead of card
  const rowContent = (
    <div className="w-full px-4 py-3 border-b hover:bg-muted/50 transition-colors">
      <div className="flex flex-col">
        <h3 className="font-medium text-lg truncate">{chat.title || 'Untitled Chat'}</h3>
        <div className="flex flex-col space-y-1">
          {/* Display last message preview */}
          {lastMessagePreview && (
            <span className="text-sm text-muted-foreground truncate">
              {lastMessagePreview}
            </span>
          )}
          {/* Display formatted date */}
          <span className="text-xs text-muted-foreground/80">{formattedDate}</span>
        </div>
      </div>
    </div>
  );

  if (chat.agentId) {
    return (
      <Link href={chatLink} className="block">
        {rowContent}
      </Link>
    );
  } else {
    // Render without Link if no agentId
    return (
      <div className="block cursor-default">
        {rowContent}
      </div>
    );
  }
}