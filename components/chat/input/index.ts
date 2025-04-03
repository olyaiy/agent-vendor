/**
 * Public API for chat input components
 * 
 * This file centralizes exports from the chat input module
 * to provide a clean interface for other parts of the application.
 */

// Re-export the MultimodalInput component
export { MultimodalInput } from './multi-modal-input';

// Re-export the rich text editor
export { RichTextEditor } from './editor/RichTextEditor';

// Re-export the mention components
export { MentionList } from './editor/mention/MentionList';
export type { MentionListProps, GroupAgentDisplayInfo, MentionListRef } from './editor/mention/MentionList';

// Re-export the control components
export { AttachmentButton } from './controls/AttachmentButton';
export { StopButton } from './controls/StopButton';
export { SendButton } from './controls/SendButton';
export { ModelSelector } from './controls/ModelSelector';

// Re-export the attachment components
export { AttachmentPreview } from './attachments/AttachmentPreview';
export { AttachmentUploader } from './attachments/AttachmentUploader';

// Re-export custom hooks
export { useFileUpload } from './hooks/useFileUpload';
export { useMention, mentionSuggestionPluginKey } from './hooks/useMention';
export { useEditorConfig } from './hooks/useEditorConfig';
