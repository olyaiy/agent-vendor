import Chat from "@/components/chat";
import { selectAgentWithModelById } from "@/db/repository/agent-repository";
import { parseAgentSlug } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function Page({
  // No changes needed here for params type
  params,
}: {
  params: Promise<{ "agent-id": string }>;
}) {
  const { "agent-id": agentIdParam } = await params;

  const { agentId } = parseAgentSlug(agentIdParam);
  // Fetch only the agent
  const agent = await selectAgentWithModelById(agentId);
  if (!agent) {
    notFound();
  }

  // Ownership check will happen in the client component

  return (
    <Chat agent={agent} /> // Pass only agent
  );
}