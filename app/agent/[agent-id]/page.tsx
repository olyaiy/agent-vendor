import Chat from "@/components/chat";
import { selectAgentById } from "@/db/repository/agent-repository";

export default async function Page({ params }: { params: { "agent-id": string } }) {
  const parameters = await params;
  const agentId = parameters["agent-id"];
  const agent = await selectAgentById(agentId);

  
  return (
    <Chat agent={agent} />
  );
}