import Chat from "@/components/chat";
import ChatMobile from "@/components/chat-mobile";
import { generateUUID } from "@/lib/utils";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { selectAgentBySlug, selectAgentKnowledgeBySlug, selectAgentModelsBySlug, selectAgentTagsBySlug } from "@/db/repository";
import { getToolsForAgentAction } from '@/db/actions/agent-relations.actions';
import type { Tool } from '@/db/schema/tool';
import type { AgentSpecificModel } from '@/components/chat';
import { auth } from "@/lib/auth"; // Import auth from better-auth

type Params = { "agent-slug": string };

// Cache the static agent data that doesn't change based on user
async function getCachedAgentData(agentSlug: string) {
  'use cache'
  
  const agent = await selectAgentBySlug(agentSlug);
  if (!agent) return null;
  
  // Fetch static data that's the same for all users
  const [rawAgentModels, knowledgeItems, tags] = await Promise.all([
    selectAgentModelsBySlug(agentSlug),
    selectAgentKnowledgeBySlug(agentSlug),
    selectAgentTagsBySlug(agentSlug),
  ]);
  
  return {
    agent,
    rawAgentModels,
    knowledgeItems,
    tags
  };
}

export default async function Page({
  params,
}: {
  params: Promise<Params>;
}) {

  const resolvedParams = await params;
  const agentSlug = resolvedParams["agent-slug"];

  // Get cached static data
  const cachedData = await getCachedAgentData(agentSlug);
  if (!cachedData) notFound();
  
  const { agent, rawAgentModels, knowledgeItems, tags } = cachedData;

  // Get headers once to avoid multiple awaits
  const headersList = await headers();

  // Fetch user-specific data that should NOT be cached
  const [agentToolsResult, session] = await Promise.all([
    getToolsForAgentAction(agent.id),
    auth.api.getSession({ headers: headersList })
  ]);

  // Handle agent tools with existing error handling logic
  let currentAgentTools: Tool[] = [];
  if (agentToolsResult.success) {
    currentAgentTools = agentToolsResult.data;
  } else {
    console.error(`Failed to fetch agent tools for agent ${agent.id}:`, agentToolsResult.error);
  }

  // Get the current user session to determine ownership
  const isOwner = agent.creatorId === session?.user?.id;

  const agentModelsForChat: AgentSpecificModel[] = rawAgentModels.map(rawModel => ({
    agentId: rawModel.agentId,
    modelId: rawModel.modelId,
    role: rawModel.role,
    model: rawModel.model,
    description: rawModel.description,
    id: rawModel.modelId
  }));

  const agentWithTags = { ...agent, tags }; // Create agentWithTags here

  const chatId = generateUUID();
  const ua = headersList.get("user-agent") || "";
  const isMobile = /Mobile|Android|iP(hone|od|ad)|IEMobile|Opera Mini/i.test(ua);

  return isMobile ? (
    <div style={{ height: "calc(100dvh)" }} className="w-screen">
      <ChatMobile
        agent={agentWithTags} // Pass agentWithTags
        knowledgeItems={knowledgeItems}
        agentModels={agentModelsForChat}
        chatId={chatId}
        assignedTools={currentAgentTools}
      />
    </div>
  ) : (
    <>
      <Chat
        agent={agentWithTags} // Already passing agentWithTags here
        knowledgeItems={knowledgeItems}
        agentModels={agentModelsForChat}
        chatId={chatId}
        agentSlug={agentSlug}
        assignedTools={currentAgentTools}
        isOwner={isOwner}
      />
    </>
  );
}

// Cache the metadata generation as well since it's static
async function getCachedMetadata(slug: string) {
  'use cache'
  
  const agent = await selectAgentBySlug(slug);
  if (!agent) return null;
  
  return {
    name: agent.name,
    description: agent.description,
    avatarUrl: agent.avatarUrl,
    thumbnailUrl: agent.thumbnailUrl
  };
}

type GenerateMetadataProps = {
  params: Promise<Params>;
};

export async function generateMetadata(
  { params }: GenerateMetadataProps
): Promise<Metadata> {
  const { "agent-slug": slug } = await params;
  
  const cachedMeta = await getCachedMetadata(slug);
  if (!cachedMeta) {
    return { title: "Agent Not Found" };
  }

  const { name, description, avatarUrl, thumbnailUrl } = cachedMeta;
  const imageUrl = avatarUrl ?? thumbnailUrl ?? undefined;

  const meta: Metadata = {
    title: name,
  };
  if (description) meta.description = description;
  if (imageUrl) {
    meta.icons = { icon:  imageUrl, apple: imageUrl };
  }
  meta.openGraph = {
    title: name,
    ...(description && { description }),
    ...(imageUrl   && { images: [imageUrl] }),
  };
  meta.twitter = {
    card:  "summary_large_image",
    title: name,
    ...(description && { description }),
    ...(imageUrl   && { images: [imageUrl] }),
  };
  return meta;
}
