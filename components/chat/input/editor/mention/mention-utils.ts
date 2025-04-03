import { ReactRenderer } from '@tiptap/react';
import { PluginKey } from '@tiptap/pm/state';
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import type { GroupAgentDisplayInfo, MentionListRef } from './MentionList';

/**
 * Plugin key for tracking mention suggestions
 * Used by Tiptap to identify and manage the suggestion state
 */
export const mentionSuggestionPluginKey = new PluginKey('mention-suggestion');

/**
 * Flag to track when a mention was just selected via Enter key
 * This prevents the dual behavior where pressing Enter both:
 * 1. Selects a mention from the suggestion list
 * 2. Submits the form immediately after
 */
let mentionJustSelected = false;

/**
 * Expose the current state of the mention selection flag
 * @returns Current value of mentionJustSelected
 */
export const isMentionJustSelected = () => mentionJustSelected;

/**
 * Set the mention selection flag and automatically reset it after a delay
 * @param selected - New state for the flag
 * @param resetDelay - Time in ms before the flag is reset to false (default: 100ms)
 */
export const setMentionJustSelected = (selected: boolean, resetDelay = 100) => {
  mentionJustSelected = selected;
  
  // Reset the flag after a short delay to allow other handlers to check it
  if (selected) {
    setTimeout(() => {
      mentionJustSelected = false;
    }, resetDelay);
  }
};

/**
 * Configuration for the mention suggestion functionality
 * 
 * This function creates the suggestion configuration for Tiptap's Mention extension
 * It handles:
 * - Filtering agents based on the query
 * - Rendering the suggestion list
 * - Keyboard navigation
 * 
 * @param agents - List of group agents available for mentioning
 */
export const mentionSuggestion = (agents: GroupAgentDisplayInfo[] = []) => ({
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
   * Uses DOM positioning for the suggestion list
   */
  render: () => {
    let component: ReactRenderer<MentionListRef, SuggestionProps<GroupAgentDisplayInfo>> | null = null;
    let popupContainer: HTMLElement | null = null;

    return {
      onStart: (props: SuggestionProps<GroupAgentDisplayInfo>) => {
        // Create the React component for suggestions
        component = new ReactRenderer(
          // We use dynamic import to avoid circular dependencies
          // This will be resolved when the component is loaded at runtime
          require('./MentionList').MentionList,
          {
            props,
            editor: props.editor,
          }
        );

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
});

/**
 * Detects @mentions in a list of strings
 * Logs when an agent is mentioned with an @ symbol
 * 
 * @param texts - Array of strings to search for mentions
 * @param agents - List of agents that could be mentioned
 */
export function detectMentions(texts: string[], agents: GroupAgentDisplayInfo[]) {

    
    console.log('we enteered the detectMentions function')
    console.log('texts', texts)
    console.log('agents', agents)
  if (!texts || !agents?.length) return;
  
  texts.forEach(text => {
    if (!text) return;
    
    agents.forEach(agent => {
      const mentionPattern = `@${agent.agent_display_name}`;
      if (text.includes(mentionPattern)) {
        console.log(`found ${agent.agent_display_name}!`);
      }
    });
  });
}
