import Chat from "@/components/chat";
import { selectAgentWithModelById, selectKnowledgeByAgentId } from "@/db/repository/agent-repository"; // Added selectKnowledgeByAgentId
import { parseAgentSlug } from "@/lib/utils";
import { notFound } from "next/navigation";
import { Knowledge } from "@/db/schema/agent"; // Added Knowledge type

export default async function Page({
  // No changes needed here for params type
  params,
}: {
  params: Promise<{ "agent-id": string }>;
}) {
  const { "agent-id": agentIdParam } = await params;

  const { agentId } = parseAgentSlug(agentIdParam);

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
    <Chat agent={agent} knowledgeItems={knowledgeItems} /> // Pass agent and knowledgeItems
  );
}
