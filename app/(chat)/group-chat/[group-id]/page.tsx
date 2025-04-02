import { notFound, redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat/chat';
import { getAgentWithModelById, getAgentWithAvailableModels } from '@/lib/db/queries';
import { getGroupChatById } from '@/lib/db/repositories/chatRepository';
import { getAgents } from '@/lib/db/repositories/agentRepository';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { AccessDenied } from '@/components/ui/access-denied';
import { DataStreamHandler } from '@/components/util/data-stream-handler';
import type { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata(
  { params }: { params: { 'group-id': string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const groupId = params['group-id'];
  
  // Fetch group chat data
  const groupChat = await getGroupChatById({ id: groupId });
  
  // Fall back to default metadata if group chat not found
  if (!groupChat) {
    return {
      title: 'Group Chat - Not Found',
      description: 'The requested group conversation could not be found.'
    };
  }
  
  // Only provide rich metadata for public chats
  if (groupChat.visibility !== 'public') {
    return {
      title: 'Private Group Conversation',
      robots: {
        index: false,
        follow: false,
      }
    };
  }
  
  return {
    title: groupChat.title || 'Group Chat',
    description: `Group conversation with multiple agents`,
    alternates: {
      canonical: `/group-chat/${groupId}`,
    },
  };
}

export default async function Page({ params }: { params: { 'group-id': string } }) {
  const groupId = params['group-id'];
  const session = await auth();

  // Fetch group chat data
  const groupChat = await getGroupChatById({ id: groupId });

  if (!groupChat) {
    return notFound();
  }

  // Access control: Check if the user has permission to view this chat
  if (groupChat.visibility === 'private') {
    // If not logged in, redirect to login page
    if (!session?.user) {
      return (
        <AccessDenied 
          title="Authentication Required" 
          message="Please log in to access this group conversation."
          actionHref="/login"
          actionText="Log In"
          showHeader={true}
        />
      );
    }
    
    // Special override for admin user
    const ADMIN_OVERRIDE_ID = '09a76b0b-78a8-4d7e-9d9e-4ea3b09832d8';
    
    // If logged in but not the chat owner or admin override, show access denied
    if (session.user.id !== groupChat.userId && session.user.id !== ADMIN_OVERRIDE_ID) {
      return <AccessDenied message="Sorry, you don't have access to this group conversation." showHeader={true} />;
    }
  }
  
  // Fetch all agents in this group chat
  const agentIds = groupChat.agentIds || [];
  
  if (agentIds.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md p-6">
          <h2 className="text-xl font-semibold mb-2">No Agents Available</h2>
          <p className="text-muted-foreground">This group chat doesn't have any agents assigned to it.</p>
        </div>
      </div>
    );
  }
  
  // Get details of all agents in this group chat
  const groupAgents = await getAgents(session?.user?.id, agentIds);
  
  if (!groupAgents || groupAgents.length === 0) {
    return notFound();
  }
  
  // For now, just use the first agent for the UI
  // A complete implementation would handle all agents in the group chat UI
  const firstAgentId = agentIds[0];
  const firstAgentSlug = groupAgents.find(a => a.id === firstAgentId)?.id || firstAgentId;
  
  // Parallelize data fetches for the first agent (temporary implementation)
  const [agentWithModel, agentWithAvailableModels] = await Promise.all([
    getAgentWithModelById(firstAgentSlug),
    getAgentWithAvailableModels(firstAgentSlug),
  ]);

  if (!agentWithModel?.agent) {
    return notFound();
  }
  
  // Get all available models for this agent
  const availableModels = agentWithAvailableModels?.availableModels || [];
  
  // Get the default model's ID
  const defaultModel = availableModels.find(model => model.isDefault);
  const defaultModelId = defaultModel?.id || DEFAULT_CHAT_MODEL;
  
  // Basic implementation using the first agent's data
  // TODO: Implement proper multi-agent UI
  return (
    <>
      <Chat
        isAuthenticated={!!session?.user}
        id={groupId}
        agent={agentWithModel.agent}
        availableModels={availableModels}
        initialMessages={[]}
        selectedChatModel={defaultModelId}
        selectedVisibilityType={groupChat.visibility}
        isReadonly={session?.user?.id !== groupChat.userId}
        knowledgeItems={agentWithAvailableModels?.knowledgeItems}
      />
      <DataStreamHandler id={groupId} />
    </>
  );
}