import Chat from "@/components/chat";
import ChatMobile from "@/components/chat-mobile";
import { selectAgentWithModelById, selectKnowledgeByAgentId, selectAllModels } from "@/db/repository/agent-repository"; // Added selectAllModels
import {generateUUID } from "@/lib/utils";
import { notFound } from "next/navigation";
import type { Metadata } from 'next';
import { headers } from "next/headers";


type Props = {
  params: Promise<{ 'agent-id': string }>; // Updated type
};

export async function generateMetadata(
  { params }: Props,
): Promise<Metadata> {
  // read route params
  const { 'agent-id': agentId } = await params; // Updated access

  // fetch data
  const agent = await selectAgentWithModelById(agentId);

  if (!agent) {
    return {
      title: 'Agent Not Found',
    };
  }

  const description = agent.description; // TODO: Add fallback description if needed
  const imageUrl = agent.thumbnailUrl; // TODO: Add fallback icon if needed

  return {
    title: agent.name,
    ...(description && { description: description }), // Only add description if it exists
    ...(imageUrl && { // Only add icons if imageUrl exists
      icons: {
        icon: imageUrl,
        apple: imageUrl,
      },
    }),
    openGraph: {
      title: agent.name,
      ...(description && { description: description }), // Use description if available
      ...(imageUrl && { images: [imageUrl] }), // Use image if available
    },
    twitter: {
      card: 'summary_large_image',
      title: agent.name,
      ...(description && { description: description }), // Use description if available
      ...(imageUrl && { images: [imageUrl] }), // Use image if available
    },
  };
}


export default async function Page({
  params,
}: {
  params: Promise<{ "agent-id": string }>;
}) {

  // Get the agent id from the url
  const { "agent-id": agentId } = await params;


  // Generate a random id for the chat
  const id = generateUUID();

  // Fetch agent and knowledge items in parallel for efficiency
  // Fetch agent, knowledge items, and all models in parallel
  const [agent, knowledgeItems, models] = await Promise.all([
    selectAgentWithModelById(agentId),
    selectKnowledgeByAgentId(agentId), // Fetch knowledge items
    selectAllModels() // Fetch all models
  ]);

  if (!agent) {
    notFound();
  }

  // Ownership check happens in the client component (Chat)

  const ua = (await headers()).get("user-agent") ?? "";
  const isMobile = /Mobile|Android|iP(hone|od|ad)|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  return isMobile ? (
    <div className="h-screen pb-12 w-screen">
    <ChatMobile
      agent={agent}
      knowledgeItems={knowledgeItems}
      models={models}
      chatId={id}
      />
    </div>
  ) : (
    <Chat
      agent={agent}
      knowledgeItems={knowledgeItems}
      models={models} // Pass models list
      chatId={id}
    />
  );
}
