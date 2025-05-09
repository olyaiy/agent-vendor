import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { Chat } from '@/db/schema/chat';
import { useState, useRef } from 'react'; // Added useRef
import { MoreHorizontal, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion'; // Optional for consistency

// Define the type for the chat data expected by this component
// Define the type for the chat data expected by this component
// Should match the selection in getUserChatsPaginated and the type in chat-history-client
type ChatHistoryItem = Pick<Chat, 'id' | 'title' | 'createdAt' | 'agentId'> & {
  agentSlug: string | null; // Add agentSlug to match the data structure
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
  onDeleteRequest: (chatId: string, chatTitle: string) => void;
  onRenameRequest: (chatId: string, currentTitle: string) => void;
  isEditingThisItem: boolean;
  currentEditValue: string;
  onEditValueChange: (value: string) => void;
  onSaveEdit: () => Promise<void>;
  onCancelEdit: () => void;
  isSubmittingEdit: boolean;
}

export function ChatListItem({
  chat,
  onDeleteRequest,
  onRenameRequest,
  isEditingThisItem,
  currentEditValue,
  onEditValueChange,
  onSaveEdit,
  onCancelEdit,
  isSubmittingEdit,
}: ChatListItemProps) {
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false); // New state for popover status
  const menuAreaRef = useRef<HTMLDivElement>(null); // Ref for the popover menu area

  const formattedDate = formatDistanceToNow(new Date(chat.createdAt), { addSuffix: true });
  const chatLink = chat.agentSlug ? `/agent/${chat.agentSlug}/${chat.id}` : '#';

  let lastMessagePreview = '';
  if (chat.lastMessageParts && Array.isArray(chat.lastMessageParts)) {
    const textPart = chat.lastMessageParts.find((part): part is MessagePart & { type: 'text', text: string } =>
      typeof part === 'object' && part !== null && part.type === 'text' && typeof part.text === 'string'
    );
    if (textPart) {
      const prefix = chat.lastMessageRole === 'user' ? 'You: ' : chat.lastMessageRole === 'assistant' ? 'Assistant: ' : '';
      lastMessagePreview = prefix + textPart.text;
      if (lastMessagePreview.length > 100) {
        lastMessagePreview = lastMessagePreview.substring(0, 100) + '...';
      }
    }
  }

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onRenameRequest(chat.id, chat.title);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDeleteRequest(chat.id, chat.title);
  };
  
  const handleSaveKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentEditValue.trim() && currentEditValue.trim() !== chat.title) {
        onSaveEdit();
      }
    }
    if (e.key === 'Escape') {
      onCancelEdit();
    }
  };


  const content = (
    <div
      className="w-full px-4 py-3 border-b hover:bg-muted/50 transition-colors flex items-center justify-between relative min-h-[88px]" // Ensure min height
      onMouseEnter={() => { if (!isEditingThisItem) setIsMenuHovered(true);}}
      onMouseLeave={() => { if (!isEditingThisItem) setIsMenuHovered(false);}}
    >
      <div className="flex-grow overflow-hidden pr-10"> {/* Added pr-10 to prevent overlap with menu button */}
        {isEditingThisItem ? (
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              value={currentEditValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              onKeyDown={handleSaveKeyDown}
              className="text-lg font-medium h-9 focus-visible:ring-1 focus-visible:ring-ring bg-transparent"
              autoFocus
              disabled={isSubmittingEdit}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-1 text-green-600 hover:text-green-500"
              onClick={onSaveEdit}
              disabled={isSubmittingEdit || !currentEditValue.trim() || currentEditValue.trim() === chat.title || currentEditValue.length > 100}
            >
              <Check size={20} /> <span className="sr-only">Save</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-1 text-red-600 hover:text-red-500"
              onClick={onCancelEdit}
              disabled={isSubmittingEdit}
            >
              <X size={20} /> <span className="sr-only">Cancel</span>
            </Button>
          </div>
        ) : (
          <>
            <h3 className="font-medium text-lg truncate" title={chat.title || 'Untitled Chat'}>
              {chat.title || 'Untitled Chat'}
            </h3>
            <div className="flex flex-col space-y-1 mt-0.5">
              {lastMessagePreview && (
                <span className="text-sm text-muted-foreground truncate">
                  {lastMessagePreview}
                </span>
              )}
              <span className="text-xs text-muted-foreground/80">{formattedDate}</span>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {isMenuHovered && !isEditingThisItem && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex-shrink-0"
            ref={menuAreaRef} // Assign ref here
            onClick={(e) => {
              // Stop propagation to prevent Link's JS onClick if it had one,
              // but allow default actions for children like PopoverTrigger.
              e.stopPropagation();
              // e.preventDefault(); // REMOVED - This was preventing PopoverTrigger's default action.
                                  // The Link's onClick will handle preventing navigation.
            }}
          >
            <Popover
              open={isPopoverOpen}
              onOpenChange={(open) => {
                setIsPopoverOpen(open);
                if (!open) setIsMenuHovered(false); // Also hide menu icon if popover closes
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-1 text-muted-foreground data-[state=open]:bg-accent"
                  onClick={(e) => {
                    e.stopPropagation(); // Good to prevent event from bubbling to menuAreaRef's onClick unnecessarily.
                    // e.preventDefault(); // REMOVED - PopoverTrigger needs its default action.
                                        // Link's onClick will prevent navigation.
                  }}
                >
                  <MoreHorizontal size={18} />
                  <span className="sr-only">Options for {chat.title}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1" side="left" align="center" sideOffset={5}>
                <Button
                  onClick={handleRenameClick}
                  variant="ghost"
                  className="w-full h-auto text-sm justify-start px-2 py-1.5 text-foreground hover:bg-accent focus-visible:bg-accent"
                >
                  Rename
                </Button>
                <Button
                  onClick={handleDeleteClick}
                  variant="ghost"
                  className="w-full h-auto text-sm justify-start px-2 py-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 focus-visible:bg-red-500/10 focus-visible:text-red-400"
                >
                  Delete
                </Button>
              </PopoverContent>
            </Popover>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (chat.agentSlug && !isEditingThisItem) {
    return (
      <Link
        href={chatLink}
        className="block"
        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
          // If the popover is open, or if the click is on the menu trigger area, prevent navigation.
          if (isPopoverOpen || (menuAreaRef.current && menuAreaRef.current.contains(e.target as Node))) {
            e.preventDefault();
          }
        }}
      >
        {content}
      </Link>
    );
  } else {
    return <div className="block">{content}</div>;
  }
}