import SimpleAgentForm from "@/components/agent/simple-agent-form";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/queries";
import { models } from "@/lib/db/schema";
import { redirect } from "next/navigation";

export default async function CreateAgentPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const modelsList = await db.select({
    id: models.id,
    displayName: models.model_display_name,
    modelType: models.model_type,
    description: models.description,
    provider: models.provider
  }).from(models);
  
  return (
    <div className="container mx-auto p-4">
      <SimpleAgentForm
        userId={session?.user?.id}
        models={modelsList}
      />
    </div>
  );
} 