'use client';

import { forwardRef, useState, useCallback, useEffect, useImperativeHandle } from 'react';
import cx from 'classnames';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { type SuggestionProps, type SuggestionKeyDownProps } from '@tiptap/suggestion';

// Import the mentionJustSelected flag from utils
import { isMentionJustSelected, setMentionJustSelected } from './mention-utils';

/**
 * Type definition for agent information displayed in mention suggestions
 */
export interface GroupAgentDisplayInfo {
  id: string;
  agent_display_name: string | null;
  avatar_url?: string | null;
  thumbnail_url?: string | null;
}

/**
 * Interface defining the reference methods for the MentionList component.
 * This allows parent components to control keyboard navigation within the mention list.
 */
export interface MentionListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

/**
 * Component that renders a list of mention suggestions for group chat participants.
 * 
 * Features:
 * - Keyboard navigation (up/down arrows)
 * - Enter key selection
 * - Avatar display for each agent
 * - Highlighting of selected item
 * 
 * @param props - Contains the list of agents and command handler
 * @param ref - Reference for keyboard navigation methods
 */
export const MentionList = forwardRef<MentionListRef, SuggestionProps<GroupAgentDisplayInfo>>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  /**
   * Handles selection of an item from the mention list
   * Sets the mentionJustSelected flag to prevent form submission
   * when the Enter key is used to select a mention
   * 
   * @param index - The index of the selected item
   */
  const selectItem = useCallback((index: number) => {
    const item = props.items[index];
    if (item) {
      // Set flag when mention is selected
      setMentionJustSelected(true);
      
      props.command({ id: item.id, label: item.agent_display_name });
    }
  }, [props]);

  // Reset selection when the list of items changes
  useEffect(() => setSelectedIndex(0), [props.items]);

  /**
   * Exposes keyboard navigation methods to the parent component
   * This allows the parent to control navigation when the list is focused
   */
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  // Don't render if there are no items to show
  if (props.items.length === 0) {
    return null;
  }

  return (
    <div className="z-50 rounded-md border bg-popover p-1 text-popover-foreground shadow-md max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
      {props.items.map((item, index) => (
        <button
          className={cx(
            'flex w-full items-center space-x-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[state=selected]:bg-accent data-[state=selected]:text-accent-foreground',
            index === selectedIndex ? 'bg-accent text-accent-foreground' : ''
          )}
          key={index}
          onClick={() => selectItem(index)}
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={item.avatar_url || item.thumbnail_url || undefined} alt={item.agent_display_name || 'Agent'} />
            <AvatarFallback>{item.agent_display_name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
          </Avatar>
          <span>{item.agent_display_name || item.id}</span>
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = 'MentionList';
