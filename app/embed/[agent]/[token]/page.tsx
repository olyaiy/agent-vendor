// app/embed/[agent]/[token]/page.tsx
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getAgentWithAvailableModels, getSuggestedPromptsByAgentId } from '@/lib/db/queries';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { Chat } from '@/components/chat/chat';
import { DataStreamHandler } from '@/components/util/data-stream-handler';
import type { Agent } from '@/lib/db/schema';
import type { Metadata, ResolvingMetadata } from 'next';

// Generate metadata for SEO
export async function generateMetadata(
  { params }: { params: { agent: string, token: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { agent: agentId } = params;
  const agentData = await getAgentWithAvailableModels(agentId);
  
  if (!agentData?.agent) {
    return {
      title: 'Embed Chat - Not Found',
      description: 'The requested agent could not be found.'
    };
  }
  
  const { agent } = agentData;
  
  return {
    title: `${agent.agent_display_name} - Embedded Chat`,
    description: agent.description || `Chat with ${agent.agent_display_name}`,
    robots: { index: false, follow: false }
  };
}

export default async function EmbedPage({ params }: { params: { agent: string, token: string } }) {
  const { agent: agentId, token } = params;
  const headersList = await headers();
  const domain = headersList.get('referer') || '';
  
  // Authenticate with the embed token
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/embed/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenId: token, domain, agentId }),
    cache: 'no-store'
  });
  
  if (!response.ok) {
    // Return 401 or appropriate error for invalid tokens
    return notFound();
  }
  
  const authData = await response.json();
  
  // Fetch agent data and suggested prompts in parallel
  const [agentData, suggestedPrompts] = await Promise.all([
    getAgentWithAvailableModels(agentId),
    getSuggestedPromptsByAgentId(agentId)
  ]);

  if (!agentData?.agent) return notFound();
  
  // Get the default model's ID
  const defaultModel = agentData.availableModels.find(model => model.isDefault);
  const defaultModelId = defaultModel?.id || DEFAULT_CHAT_MODEL;

  // Generate a unique ID for this chat session
  const id = generateUUID();

  return (
    <div className="w-full h-full flex flex-col">
      <Chat
        isAuthenticated={true} // Token-based auth is already done
        key={id}
        id={id}
        agent={agentData.agent as Agent}
        availableModels={agentData.availableModels}
        initialMessages={[]}
        selectedChatModel={defaultModelId}
        selectedVisibilityType="public"
        isReadonly={false}
        suggestedPrompts={suggestedPrompts}
        knowledgeItems={agentData.knowledgeItems}
      />
      <DataStreamHandler id={id} />
    </div>
  );
}