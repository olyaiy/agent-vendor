/**
 * Public API for chat input components
 * 
 * This file centralizes exports from the chat input module
 * to provide a clean interface for other parts of the application.
 */

// Re-export the MultimodalInput component
export { MultimodalInput } from './MultimodalInput';

// Re-export the rich text editor
export { RichTextEditor } from './editor/RichTextEditor';

// Re-export the mention components
export { MentionList } from './editor/mention/MentionList';
export { mentionSuggestion, mentionSuggestionPluginKey } from './editor/mention/mention-utils';

// Re-export the control components
export { AttachmentButton } from './controls/AttachmentButton';
export { StopButton } from './controls/StopButton';
export { SendButton } from './controls/SendButton';
export { ModelSelector } from './controls/ModelSelector';
