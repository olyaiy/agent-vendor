'use client';

import React from 'react';
import { EditorContent } from '@tiptap/react';

// Import our custom hooks
import { useEditorConfig } from '../hooks/useEditorConfig';
import type { GroupAgentDisplayInfo } from './mention/MentionList';

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
  // Use our custom hook for editor configuration and lifecycle
  const { editor } = useEditorConfig({
    value,
    onChange,
    isGroupChat,
    groupAgents,
    className,
    placeholder,
    autoFocus,
    editorRef
  });

  return (
    <EditorContent
      editor={editor}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
    />
  );
}
