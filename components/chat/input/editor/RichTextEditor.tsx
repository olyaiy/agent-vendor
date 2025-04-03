'use client';

import cx from 'classnames';
import React, { useEffect } from 'react';
import { useEditor, EditorContent, type AnyExtension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import 'tippy.js/dist/tippy.css'; // Import tippy styles

// Import mention functionality from our utils
import { mentionSuggestion, isMentionJustSelected } from './mention/mention-utils';
import { type GroupAgentDisplayInfo } from './mention/MentionList';

/**
 * Properties for the rich text editor component
 */
export interface RichTextEditorProps {
  /** Current text value of the editor */
  value: string;
  /** Handler called when content changes */
  onChange: (value: string) => void;
  /** Handler for keyboard events */
  onKeyDown?: (event: React.KeyboardEvent) => void;
  /** Handler for paste events - used for clipboard image uploads */
  onPaste?: (event: React.ClipboardEvent) => void;
  /** Placeholder text shown when editor is empty */
  placeholder?: string;
  /** Additional CSS classes to apply to the editor */
  className?: string;
  /** Whether to focus the editor on mount */
  autoFocus?: boolean;
  /** Reference to access the editor instance externally */
  editorRef?: React.MutableRefObject<any>;
  /** Whether this editor is being used in a group chat context */
  isGroupChat?: boolean;
  /** List of agents available for mentions in group chats */
  groupAgents?: GroupAgentDisplayInfo[];
}

/**
 * Rich text editor component with mention support for group chats
 * 
 * Features:
 * - Tiptap-based editor with real-time collaboration capabilities
 * - Dynamic extension loading (mentions only in group chats)
 * - Controlled input synchronization with parent component
 * - Automatic placeholder updates
 * - Cross-component focus management
 * 
 * @param props - Component properties
 */
export function RichTextEditor({
  value,
  onChange,
  onKeyDown,
  onPaste,
  placeholder,
  className,
  autoFocus,
  editorRef,
  isGroupChat,
  groupAgents,
}: RichTextEditorProps) {

  // Configure editor extensions based on chat type
  const extensions: AnyExtension[] = [
    StarterKit, // Base text editing capabilities
  ];

  // Only add mention capability in group chats
  if (isGroupChat) {
    extensions.push(
      Mention.configure({
        HTMLAttributes: {
          class: 'mention bg-primary/10 text-primary rounded px-1',
        },
        // Inject group agent data into mention suggestions
        suggestion: mentionSuggestion(groupAgents),
      }),
    );
  }

  // Editor instance management
  const editor = useEditor({
    extensions,
    content: value,
    editorProps: {
      attributes: {
        class: cx(
          // Responsive height calculations
          'outline-none w-full sm:min-h-[24px] max-h-[calc(50vh)] sm:max-h-[calc(50vh)] overflow-auto resize-none rounded-md !text-base bg-muted pb-8 sm:pb-10 dark:border-zinc-700 p-3',
          className
        ),
        placeholder: placeholder ?? '',
      },
    },
    onUpdate: ({ editor }) => {
      // Sync editor content with parent state while maintaining
      // visual formatting for mentions in the editor
      onChange(editor.getText());
    },
    autofocus: autoFocus,
  });

  // --- Editor Lifecycle Management ---
  // Expose editor reference to parent component
  useEffect(() => {
    if (editorRef && editor) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  // Content synchronization guard
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

  // Update placeholder dynamically
  useEffect(() => {
    if (editor && placeholder) {
      editor.setOptions({
        editorProps: {
          attributes: {
            placeholder: placeholder,
          },
        },
      });
    }
  }, [editor, placeholder]);

  /**
   * Helper to check if a mention was just selected via Enter key
   * Used by parent components to prevent form submission when selecting a mention
   */
  const wasMentionJustSelected = () => isMentionJustSelected();

  // Make the helper available to parent components via the ref
  if (editorRef && editorRef.current) {
    editorRef.current.wasMentionJustSelected = wasMentionJustSelected;
  }

  return (
    <EditorContent
      editor={editor}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
    />
  );
}
