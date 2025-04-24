import { notFound } from "next/navigation";
import { getAgentSettingsBySlugAction } from "@/db/actions/agent-actions";
import { EditAgentForm } from "@/components/agents/edit-agent-form";

type Params = { "agent-slug": string };

export default async function Page({
  params,                        
}: {
  params: Promise<Params>;
}) {
  // await the params promise, then pull out your slug
  const { "agent-slug": slug } = await params;

  // Fetch the agent
  const result = await getAgentSettingsBySlugAction(slug);
  if (!result.success || !result.data.agent) {
    notFound();
  }
  
  const { agent, knowledge, allTags, agentTags, allModels } = result.data;

  return (
    <EditAgentForm
      agent={agent}
      models={allModels}
      knowledge={knowledge}
      allTags={allTags.map(t => ({ value: t.id, label: t.name }))}
      currentTags={agentTags.map(t => ({ value: t.id, label: t.name }))}
    />
  );
}
