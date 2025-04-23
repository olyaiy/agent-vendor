// app/agent/[agent-slug]/settings/page.tsx
import { notFound } from "next/navigation";
import { getAgentSettingsBySlugAction } from "@/db/actions/agent-actions";
import { EditAgentForm } from "@/app/[agent-id]/settings/edit-agent-form";

export default async function Page({
  params,
}: {
  params: { "agent-slug": string };
}) {
  const slug = await params["agent-slug"];

  // 1) fetch everything in one go
  const result = await getAgentSettingsBySlugAction(slug);

  // 1️⃣ 404 if no agent
  if (!result.success || !result.data.agent) {
    notFound();
  }
  const {
    agent,
    knowledge,
    allTags,
    agentTags,
    allModels,
  } = result.data;



  // 3) render
  return (
    <EditAgentForm
      agent={agent}            // ✅ agent cannot be undefined here
      models={allModels}
      knowledge={knowledge} 
      allTags={ allTags.map(t => ({ value: t.id, label: t.name })) }
      currentTags={ agentTags.map(t => ({ value: t.id, label: t.name })) }
    />
  );
}
