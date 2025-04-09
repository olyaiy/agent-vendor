import Chat from "@/components/chat";
import { selectAgentById } from "@/db/repository/agent-repository";
import { parseAgentSlug } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: { "agent-id": string } }) {
  const { agentId } = parseAgentSlug(params["agent-id"]);
  const agent = await selectAgentById(agentId);
  
  if (!agent) {
    notFound();
  }

  return (
    <Chat agent={agent} />
  );
}