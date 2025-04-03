'use client';

import { useCallback, useEffect } from 'react';
import { useEditor, type Editor, type AnyExtension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import cx from 'classnames';

import { useMention } from './useMention';
import type { GroupAgentDisplayInfo } from '../editor/mention/MentionList';

/**
 * Props for configuring the editor
 */
export interface EditorConfigProps {
  /** Initial content value */
  value: string;
  /** Callback when content changes */
  onChange: (value: string) => void;
  /** Whether the editor is used in a group chat context */
  isGroupChat?: boolean;
  /** Group agents available for mentioning */
  groupAgents?: GroupAgentDisplayInfo[];
  /** Additional CSS classes for the editor */
  className?: string;
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Whether to focus the editor on mount */
  autoFocus?: boolean;
  /** Reference to the editor instance */
  editorRef?: React.MutableRefObject<any>;
}

/**
 * Hook that manages Tiptap editor configuration and lifecycle
 * 
 * Centralizes editor configuration, extension setup, and state synchronization
 * to simplify the RichTextEditor component
 */
export function useEditorConfig({
  value,
  onChange,
  isGroupChat,
  groupAgents,
  className,
  placeholder = '',
  autoFocus = false,
  editorRef,
}: EditorConfigProps) {
  // Use our mention hook for mention functionality
  const { isMentionJustSelected, createMentionSuggestion } = useMention();

  /**
   * Create the editor extensions array based on chat type
   */
  const createExtensions = useCallback((): AnyExtension[] => {
    const extensions: AnyExtension[] = [
      StarterKit, // Base text editing capabilities
    ];

    // Only add mention capability in group chats
    if (isGroupChat && groupAgents) {
      extensions.push(
        Mention.configure({
          HTMLAttributes: {
            class: 'mention bg-primary/10 text-primary rounded px-1',
          },
          // Use our hook to create the mention suggestion config
          suggestion: createMentionSuggestion(groupAgents),
        }),
      );
    }

    return extensions;
  }, [isGroupChat, groupAgents, createMentionSuggestion]);

  /**
   * Configure the editor with our settings
   */
  const editor = useEditor({
    extensions: createExtensions(),
    content: value,
    editorProps: {
      attributes: {
        class: cx(
          // Responsive height calculations
          'outline-none w-full sm:min-h-[24px] max-h-[calc(50vh)] sm:max-h-[calc(50vh)] overflow-auto resize-none rounded-md !text-base bg-muted pb-8 sm:pb-10 dark:border-zinc-700 p-3',
          className
        ),
        placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      // Sync editor content with parent state
      onChange(editor.getText());
    },
    autofocus: autoFocus,
  });

  /**
   * Expose editor reference to parent component
   */
  useEffect(() => {
    if (editorRef && editor) {
      // Expose the editor instance
      editorRef.current = editor;
      
      // Add utility methods to the ref
      editorRef.current.wasMentionJustSelected = isMentionJustSelected;
    }
  }, [editor, editorRef, isMentionJustSelected]);

  /**
   * Sync content when value prop changes
   */
  useEffect(() => {
    if (editor) {
      const editorText = editor.getText();
      // Prevent infinite update loops by only resetting
      // when content diverges significantly
      if (editorText !== value) {
        editor.commands.setContent(value);
      }
    }
  }, [editor, value]);

  /**
   * Update placeholder when prop changes
   */
  useEffect(() => {
    if (editor && placeholder) {
      editor.setOptions({
        editorProps: {
          attributes: {
            placeholder,
          },
        },
      });
    }
  }, [editor, placeholder]);

  return { editor };
}
