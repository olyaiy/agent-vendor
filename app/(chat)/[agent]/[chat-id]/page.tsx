// import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat/chat';
import { 
  getChatById, 
  getMessagesByChatId, 
  getAgentWithModelById,
  getAgentWithAvailableModels
} from '@/lib/db/queries';
import { DBMessage } from '@/lib/db/schema';
import { Attachment, UIMessage } from 'ai';

import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { DataStreamHandler } from '@/components/util/data-stream-handler';
import { AccessDenied } from '@/components/ui/access-denied';
import type { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata(
  { params }: { params: Promise<{ agent: string; 'chat-id': string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Await params before accessing its properties
  const { agent: agentSlug, 'chat-id': chatId } = await params;
  
  // Fetch chat and agent data
  const chat = await getChatById({ id: chatId });
  const agentWithModel = await getAgentWithModelById(agentSlug);
  
  // Fall back to default metadata if chat or agent not found
  if (!chat || !agentWithModel?.agent) {
    return {
      title: 'Chat - Not Found',
      description: 'The requested conversation could not be found.'
    };
  }
  
  // Only provide rich metadata for public chats
  if (chat.visibility !== 'public') {
    return {
      title: 'Private Conversation',
      robots: {
        index: false,
        follow: false,
      }
    };
  }
  
  // For public chats, provide rich metadata
  const { agent } = agentWithModel;
  const messages = await getMessagesByChatId({ id: chatId });
  
  // Extract first few message contents for description
  const chatPreview = messages.slice(0, 2)
    .map(msg => {
      const parts = msg.parts as any[];
      return parts
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join(' ')
        .substring(0, 100);
    })
    .filter(Boolean)
    .join(' ... ');
  
  return {
    title: chat.title || `Chat with ${agent.agent_display_name}`,
    description: chatPreview || `Conversation with ${agent.agent_display_name}`,
    openGraph: {
      title: chat.title || `Chat with ${agent.agent_display_name}`,
      description: chatPreview || `Conversation with ${agent.agent_display_name}`,
      ...(agent.thumbnail_url && { images: [{ url: agent.thumbnail_url, alt: agent.agent_display_name }] }),
      type: 'article',
    },
    twitter: {
      card: agent.thumbnail_url ? 'summary_large_image' : 'summary',
      title: chat.title || `Chat with ${agent.agent_display_name}`,
      description: chatPreview || `Conversation with ${agent.agent_display_name}`,
      ...(agent.thumbnail_url && { images: [agent.thumbnail_url] }),
    },
    alternates: {
      canonical: `/${agentSlug}/${chatId}`,
    },
  };
}

export default async function Page(props: { 
  params: Promise<{ 
    agent: string;
    'chat-id': string;
  }>
}) {
  const { agent: agentSlug, 'chat-id': chatId } = await props.params;
  const session = await auth();

  const agentWithModel = await getAgentWithModelById(agentSlug);
  if (!agentWithModel?.agent) {
    return notFound();
  }

  const chat = await getChatById({ id: chatId });
  if (!chat) notFound();

  // Access control: Check if the user has permission to view this chat
  if (chat.visibility === 'private') {
    // If not logged in, redirect to login page
    if (!session?.user) {
      return (
        <AccessDenied 
          title="Authentication Required" 
          message="Please log in to access this conversation."
          actionHref="/login"
          actionText="Log In"
          showHeader={true}
        />
      );
    }
    
    // If logged in but not the chat owner, show access denied
    if (session.user.id !== chat.userId) {
      return <AccessDenied message="Sorry, you don't have access to this conversation." showHeader={true} />;
    }
  }
  
  // Get all available models for this agent
  const agentWithAvailableModels = await getAgentWithAvailableModels(agentSlug);
  const availableModels = agentWithAvailableModels?.availableModels || [];
  
  // Get the chat's existing model ID if one exists
  const existingModelId = agentWithModel.model?.id;
  
  // Find the default model's ID, falling back to DEFAULT_CHAT_MODEL if no default is set
  const defaultModel = availableModels.find(model => model.isDefault);
  const defaultModelId = defaultModel?.id || DEFAULT_CHAT_MODEL;
  
  // Use existing model ID if available, otherwise use the default model
  const selectedModelId = existingModelId || defaultModelId;

  const messagesFromDb = await getMessagesByChatId({ id: chatId });

  function convertToUIMessages(messages: Array<DBMessage>): Array<UIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage['parts'],
      role: message.role as UIMessage['role'],
      // Extract clean text content from parts
      content: (message.parts as UIMessage['parts'])
        .map(part => {
          if (part.type === 'text') return part.text;
          if (part.type === 'tool-invocation') {
            const result = part.toolInvocation.state === 'result' 
              ? part.toolInvocation.result 
              : null;
            // Extract relevant content from search results
            if (result?.results) {
              return result.results
                .slice(0, 3) // Show top 3 results
                .map((r: { title: string; content: string }) => `${r.title}\n${r.content}`)
                .join('\n\n');
            }
            return '';
          }
          return '';
        })
        .filter(Boolean)
        .join('\n'),
      createdAt: message.createdAt,
      experimental_attachments:
        (message.attachments as Array<Attachment>) ?? [],
    }));
  }

  return (
    <>
      <Chat
        isAuthenticated={!!session?.user}
        id={chatId}
        agent={agentWithModel.agent}
        availableModels={availableModels}
        initialMessages={convertToUIMessages(messagesFromDb)}
        selectedChatModel={selectedModelId}
        selectedVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
        knowledgeItems={agentWithAvailableModels?.knowledgeItems}
      />
      <DataStreamHandler id={chatId} />
    </>
  );
}
