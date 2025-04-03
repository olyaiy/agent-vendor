'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { PluginKey } from '@tiptap/pm/state';
import { ReactRenderer } from '@tiptap/react';
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import type { GroupAgentDisplayInfo } from '../editor/mention/MentionList';

/**
 * Plugin key for tracking mention suggestions
 * Used by Tiptap to identify and manage the suggestion state
 */
export const mentionSuggestionPluginKey = new PluginKey('mention-suggestion');

/**
 * Custom hook for handling mentions in rich text editor
 * 
 * Replaces global state with React-managed state for better
 * integration with the component lifecycle
 * 
 * @returns Object containing mention state and configuration functions
 */
export function useMention() {
  // Local state for tracking mention selection
  const [mentionJustSelected, setMentionJustSelectedState] = useState(false);
  
  // We need a ref to track the timeout to clear it if needed
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Set the mention selection flag and automatically reset it after a delay
   * @param selected - New state for the flag
   * @param resetDelay - Time in ms before the flag is reset to false (default: 100ms)
   */
  const setMentionJustSelected = useCallback((selected: boolean, resetDelay = 100) => {
    setMentionJustSelectedState(selected);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Reset the flag after a short delay to allow other handlers to check it
    if (selected) {
      timeoutRef.current = setTimeout(() => {
        setMentionJustSelectedState(false);
        timeoutRef.current = null;
      }, resetDelay);
    }
  }, []);

  /**
   * Check if a mention was just selected
   * Used to prevent form submission when a mention is selected with Enter
   */
  const isMentionJustSelected = useCallback(() => {
    return mentionJustSelected;
  }, [mentionJustSelected]);

  /**
   * Creates a mention suggestion configuration for Tiptap's Mention extension
   * 
   * @param agents - List of group agents available for mentioning
   * @returns Configuration object for Tiptap's Mention extension
   */
  const createMentionSuggestion = useCallback((agents: GroupAgentDisplayInfo[] = []) => ({
    pluginKey: mentionSuggestionPluginKey,
    
    /**
     * Filter items based on input query
     * Shows only agents whose name or ID starts with the query text
     */
    items: ({ query }: { query: string }) => {
      return agents
        .filter(item =>
          item.agent_display_name?.toLowerCase().startsWith(query.toLowerCase()) ||
          item.id.toLowerCase().startsWith(query.toLowerCase())
        )
        .slice(0, 5); // Limit to 5 results for better UX
    },

    /**
     * Render the mention suggestion popover
     * Uses Shadcn Popover for positioning and rendering the suggestion list
     */
    render: () => {
      let component: ReactRenderer<any, SuggestionProps<GroupAgentDisplayInfo>> | null = null;
      let popupContainer: HTMLElement | null = null;

      return {
        onStart: (props: SuggestionProps<GroupAgentDisplayInfo>) => {
          // Create the React component for suggestions
          // We need to dynamically import the MentionList to avoid circular dependencies
          const { MentionList } = require('../editor/mention/MentionList');
          
          component = new ReactRenderer(MentionList, {
            props: {
              ...props,
              // Pass our setMentionJustSelected function to the MentionList
              onSelectItem: () => setMentionJustSelected(true)
            },
            editor: props.editor,
          });

          if (!props.clientRect) {
            return;
          }

          // Create container for the popup
          popupContainer = document.createElement('div');
          popupContainer.style.position = 'absolute';
          popupContainer.style.zIndex = '1000';
          document.body.appendChild(popupContainer);

          // Position the popup based on clientRect
          const updatePosition = () => {
            if (!popupContainer || !props.clientRect) return;
            const rect = (props.clientRect as () => DOMRect)();
            popupContainer.style.top = `${rect.bottom}px`;
            popupContainer.style.left = `${rect.left}px`;
          };
          
          updatePosition();
          
          // Append the component to the container
          popupContainer.appendChild(component.element);
        },

        /**
         * Update the suggestion list when typing or navigating
         */
        onUpdate(props: SuggestionProps<GroupAgentDisplayInfo>) {
          component?.updateProps(props);

          if (!props.clientRect || !popupContainer) {
            return;
          }

          // Update position on content change
          const rect = (props.clientRect as () => DOMRect)();
          popupContainer.style.top = `${rect.bottom}px`;
          popupContainer.style.left = `${rect.left}px`;
        },

        /**
         * Handle keyboard events for navigation
         */
        onKeyDown(props: SuggestionKeyDownProps) {
          if (props.event.key === 'Escape') {
            if (popupContainer) {
              document.body.removeChild(popupContainer);
              popupContainer = null;
            }
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },

        /**
         * Clean up when suggestion is no longer active
         */
        onExit() {
          if (popupContainer && document.body.contains(popupContainer)) {
            document.body.removeChild(popupContainer);
          }
          component?.destroy();
        },
      };
    },
  }), [setMentionJustSelected]);

  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    mentionJustSelected,
    setMentionJustSelected,
    isMentionJustSelected,
    createMentionSuggestion,
    mentionSuggestionPluginKey
  };
}
