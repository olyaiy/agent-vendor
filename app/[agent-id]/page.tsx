import Chat from "@/components/chat";
import { selectAgentWithModelById, selectKnowledgeByAgentId } from "@/db/repository/agent-repository"; // Added selectKnowledgeByAgentId
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
  const [agent, knowledgeItems] = await Promise.all([
    selectAgentWithModelById(agentId),
    selectKnowledgeByAgentId(agentId) // Fetch knowledge items
  ]);

  if (!agent) {
    notFound();
  }

  // Ownership check happens in the client component (Chat)

  return (
    <Chat 
    agent={agent} 
    knowledgeItems={knowledgeItems} 
    chatId={id}
    /> // Pass agent and knowledgeItems
  );
}
