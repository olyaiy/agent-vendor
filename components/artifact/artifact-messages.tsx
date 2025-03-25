
import { UIMessage } from 'ai';
import { memo } from 'react';
import { UIArtifact } from './artifact';
import { PreviewMessage } from '../chat/message';
import { useScrollToBottom } from '../hooks/use-scroll-to-bottom';
import { UseChatHelpers } from '@ai-sdk/react';
import { equal } from 'assert';

interface ArtifactMessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  artifactStatus: UIArtifact['status'];
  isCompact?: boolean;
}

function PureArtifactMessages({
  chatId,
  status,
  messages,
  setMessages,
  reload,
  isReadonly,
  isCompact = true,
}: ArtifactMessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col gap-4 size-full overflow-y-scroll overflow-x-hidden px-0 min-w-0  pt-8"
    >
      <div className="px-4 flex flex-col items-stretch  gap-4  ">
        {messages.map((message, index) => (
          <div key={message.id} className=" relative overflow-hidden  ">
            <PreviewMessage
              chatId={chatId}
              message={message}
              isLoading={status === 'streaming' && index === messages.length - 1}
              setMessages={setMessages}
              reload={reload}
              isReadonly={isReadonly}
              isCompact={isCompact}
            />
          </div>
        ))}
      </div>

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px] "
      />
    </div>
  );
}

function areEqual(
  prevProps: ArtifactMessagesProps,
  nextProps: ArtifactMessagesProps,
) {
  if (
    prevProps.artifactStatus === 'streaming' &&
    nextProps.artifactStatus === 'streaming'
  )
    return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (prevProps.isCompact !== nextProps.isCompact) return false;
  if (prevProps.messages !== nextProps.messages) return false;
  if (prevProps.messages[prevProps.messages.length - 1].parts !== nextProps.messages[nextProps.messages.length - 1].parts) return false;
   // Check tool invocations

  return true;
}

export const ArtifactMessages = memo(PureArtifactMessages, areEqual);
