import Chat from "@/components/chat";
import ChatMobile from "@/components/chat-mobile";
import {
  selectAgentBySlug,
  selectAgentKnowledgeBySlug,
  selectAgentModelsBySlug,
  selectAgentTagsBySlug,
} from "@/db/repository"; // Use slug-based functions
import { getToolsForAgentAction } from "@/db/actions/agent-relations.actions"; // Import action for agent tools
import { Tool } from "@/db/schema/tool"; // Import Tool type
import { getChatById, getMessagesByChatId, getChatTitleAndUserId } from "@/db/repository/chat-repository";
import { DBMessage } from "@/db/schema/chat";
import { auth } from "@/lib/auth";
import type { Attachment, UIMessage } from "ai";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from 'next';
import type { AgentSpecificModel } from '@/components/chat'; // Import the specific model type

// Standardize Params type to use agent-slug
type PageParams = {
  "agent-slug": string;
  "chat-id": string;
};

// --- Metadata Generation ---
type GenerateMetadataProps = {
  params: Promise<PageParams>;
};

export async function generateMetadata(
  { params }: GenerateMetadataProps,
): Promise<Metadata> {
  // Await and extract params
  const resolvedParams = await params;
  const agentSlug = resolvedParams["agent-slug"];
  const chatId = resolvedParams["chat-id"];

  // Fetch agent and chat title in parallel
  const [agent, chatInfo] = await Promise.all([
    selectAgentBySlug(agentSlug), // Fetch agent by slug
    getChatTitleAndUserId(chatId) // Fetch chat title
  ]);

  // Handle agent not found
  if (!agent) {
    return { title: 'Agent Not Found' };
  }

  // Construct title - include chat title if available
  const pageTitle = chatInfo?.title ? `${agent.name} - ${chatInfo.title}` : agent.name;

  // Prepare metadata fields
  const description = agent.description ?? undefined;
  const imageUrl = agent.thumbnailUrl ?? undefined;

  const meta: Metadata = {
    title: pageTitle,
  };
  if (description) meta.description = description;
  if (imageUrl) {
    meta.icons = { icon: imageUrl, apple: imageUrl };
  }
  meta.openGraph = {
    title: pageTitle,
    ...(description && { description }),
    ...(imageUrl && { images: [imageUrl] }),
  };
  meta.twitter = {
    card: 'summary_large_image',
    title: pageTitle,
    ...(description && { description }),
    ...(imageUrl && { images: [imageUrl] }),
  };

  return meta;
}

// --- Page Component ---
export default async function Page({
  params,
}: {
  params: Promise<PageParams>; // Use standardized params type
}) {
  // 1. Await and extract params
  const resolvedParams = await params;
  const agentSlug = resolvedParams["agent-slug"];
  const chatId = resolvedParams["chat-id"];

  // 2. Fetch Chat Details & Perform Auth Check
  const chat = await getChatById(chatId);
  if (!chat) {
    notFound(); // Chat not found
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.id !== chat.userId) {
    notFound(); // Unauthorized or not logged in
  }

  // 3. Fetch Agent Details (using slug)
  const agent = await selectAgentBySlug(agentSlug);
  if (!agent) {
    notFound(); // Agent not found
  }

  const isOwner = agent?.creatorId === session?.user?.id;

  // 4. Fetch Agent Relations (Models, Knowledge, Tags, Tools) in parallel
  let currentAgentTools: Tool[] = [];
  const [rawAgentModels, knowledgeItems, tags, agentToolsResult] = await Promise.all([
    selectAgentModelsBySlug(agentSlug),
    selectAgentKnowledgeBySlug(agentSlug),
    selectAgentTagsBySlug(agentSlug),
    getToolsForAgentAction(agent.id) // Fetch agent's tools
  ]);

  if (agentToolsResult.success) {
    currentAgentTools = agentToolsResult.data;
  } else {
    console.error(`Failed to fetch tools for agent ${agent.id} in chat ${chatId}:`, agentToolsResult.error);
    // currentAgentTools remains []
  }

  // 5. Transform Agent Models for Chat Component
  const agentModelsForChat: AgentSpecificModel[] = rawAgentModels.map(rawModel => ({
    agentId: rawModel.agentId,
    modelId: rawModel.modelId,
    role: rawModel.role,
    model: rawModel.model,
    description: rawModel.description,
    id: rawModel.modelId
  }));

  // 6. Fetch Chat Messages
  const messagesFromDb = await getMessagesByChatId({ id: chatId });

  // 7. Convert DB Messages to UI Messages
  function convertToUIMessages(dbMessages: Array<DBMessage>): Array<UIMessage> {
    return dbMessages.map((message) => ({
      id: message.id,
      parts: (message.parts as UIMessage['parts']) ?? [],
      role: message.role as UIMessage['role'],
      content: ((message.parts as UIMessage['parts']) ?? [])
        .map(part => {
          if (part.type === 'text') return part.text;
          return '';
        })
        .filter(Boolean)
        .join('\n'),
      createdAt: message.createdAt,
      experimental_attachments:
        (message.attachments as Array<Attachment> | null | undefined) ?? [],
    }));
  }
  const initialMessages = convertToUIMessages(messagesFromDb);

  // 8. Determine Mobile View
  const ua = (await headers()).get("user-agent") ?? "";
  const isMobile = /Mobile|Android|iP(hone|od|ad)|IEMobile|Opera Mini/i.test(ua);

  // 9. Render Component
  const agentWithTags = { ...agent, tags };

  return isMobile ? (
    <div style={{ height: "calc(100dvh - 4rem)" }} className="w-screen">
      <ChatMobile
        agent={agentWithTags}
        knowledgeItems={knowledgeItems}
        agentModels={agentModelsForChat}
        chatId={chatId}
        initialMessages={initialMessages}
        initialTitle={chat.title}
        assignedTools={currentAgentTools} // Pass assignedTools
        isOwner={isOwner}
      />
    </div>
  ) : (
    <Chat
      agent={agentWithTags}
      knowledgeItems={knowledgeItems}
      agentModels={agentModelsForChat}
      chatId={chatId}
      initialMessages={initialMessages}
      initialTitle={chat.title}
      agentSlug={agentSlug}
      assignedTools={currentAgentTools} // Pass assignedTools
      isOwner={isOwner}
    />
  );
}