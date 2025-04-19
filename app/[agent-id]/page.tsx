import Chat from "@/components/chat";
import ChatMobile from "@/components/chat-mobile";
import { selectAgentWithModelById, selectKnowledgeByAgentId, selectAllModels } from "@/db/repository/agent-repository"; // Added selectAllModels
import {generateUUID } from "@/lib/utils";
import { notFound } from "next/navigation";
import { headers } from "next/headers";


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
