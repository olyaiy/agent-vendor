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

export default async function Page({
  params,
}: {
  params: Promise<Params>;
}) {

  const resolvedParams = await params;
  const agentSlug = resolvedParams["agent-slug"];

  // First, fetch the agent (required for existence check and agent.id)
  const agent = await selectAgentBySlug(agentSlug);
  if (!agent) notFound();

  // Get headers once to avoid multiple awaits
  const headersList = await headers();

  // Now parallelize all remaining queries
  const [
    agentToolsResult,
    rawAgentModels,
    knowledgeItems,
    tags,
    session
  ] = await Promise.all([
    getToolsForAgentAction(agent.id),
    selectAgentModelsBySlug(agentSlug),
    selectAgentKnowledgeBySlug(agentSlug),
    selectAgentTagsBySlug(agentSlug),
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

type GenerateMetadataProps = {
  params: Promise<Params>;
};

export async function generateMetadata(
  { params }: GenerateMetadataProps
): Promise<Metadata> {
  const { "agent-slug": slug } = await params;
  const agent = await selectAgentBySlug(slug);
  if (!agent) {
    return { title: "Agent Not Found" };
  }

  const description = agent.description ?? undefined;
  const imageUrl = agent.avatarUrl ?? agent.thumbnailUrl ?? undefined;

  const meta: Metadata = {
    title: agent.name,
  };
  if (description) meta.description = description;
  if (imageUrl) {
    meta.icons = { icon:  imageUrl, apple: imageUrl };
  }
  meta.openGraph = {
    title: agent.name,
    ...(description && { description }),
    ...(imageUrl   && { images: [imageUrl] }),
  };
  meta.twitter = {
    card:  "summary_large_image",
    title: agent.name,
    ...(description && { description }),
    ...(imageUrl   && { images: [imageUrl] }),
  };
  return meta;
}
