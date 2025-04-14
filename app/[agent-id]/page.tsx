import Chat from "@/components/chat";
import { selectAgentWithModelById, selectKnowledgeByAgentId, selectAllModels } from "@/db/repository/agent-repository"; // Added selectAllModels
import {generateUUID } from "@/lib/utils";
import { notFound } from "next/navigation";


export default async function Page({
  // No changes needed here for params type
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

  return (
    <Chat
      agent={agent}
      knowledgeItems={knowledgeItems}
      models={models} // Pass models list
      chatId={id}
    />
  );
}
