import AgentForm from "@/components/agent/agent-form";
import { auth } from "@/app/(auth)/auth";
import { db, getAllToolGroups, getAllTags } from "@/lib/db/queries";
import { models } from "@/lib/db/schema";
import { redirect } from "next/navigation";

export default async function CreateAgentPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const [modelsList, toolGroups, tags] = await Promise.all([
    db.select({
      id: models.id,
      displayName: models.model_display_name,
      modelType: models.model_type,
      description: models.description,
      provider: models.provider
    }).from(models),
    getAllToolGroups(),
    getAllTags()
  ]);

  return (
    <div className="container mx-auto p-4">
      <AgentForm
        mode="create"
        userId={session?.user?.id}
        models={modelsList}
        toolGroups={toolGroups}
        tags={tags}
        knowledgeItems={[]}
      />
    </div>
  );
} 