import { auth } from "@/lib/auth";
import { CreateAgentForm, ModelInfo } from "./create-agent-form";
import { headers } from "next/headers";
import { getAllModels, getAllTagsAction } from "@/db/actions/agent-actions"; // Import server actions
import { Tag } from "@/db/schema/agent"; // Import Tag type

// Models data
// Removed mockModels definition

export default async function CreateAgentPage() {

  // Check Authentication
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if(!session) {
    return <div>Not authenticated</div>
  }
  
  // Fetch models and tags efficiently on the server
  const [modelsResult, tagsResult] = await Promise.all([
    getAllModels(),
    getAllTagsAction()
  ]);

  let availableModels: ModelInfo[] = [];
  if (modelsResult.success && modelsResult.data) {
    availableModels = modelsResult.data.map(model => ({
      id: model.id,
      model: model.model,
      description: model.description ?? null
    }));
  } else {
    console.error("Failed to fetch models:", modelsResult.error);
    // Consider showing an error message to the user
  }

  let availableTags: { value: string; label: string }[] = [];
  if (tagsResult.success && tagsResult.data) {
    availableTags = tagsResult.data.map((tag: Tag) => ({
      value: tag.id,
      label: tag.name,
    }));
  } else {
    console.error("Failed to fetch tags:", tagsResult.error);
    // Consider showing an error message or allowing creation without tags
  }
  
  
    return (
      <div className="container py-8 px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create New Agent</h1>
          <p className="text-muted-foreground mt-2">
            Design your AI agent by configuring its personality, capabilities, and behavior
          </p>
        </div>
        
        {/* Pass the fetched models (or empty array) to the client component */}
        <CreateAgentForm userId={session.user.id} models={availableModels} allTags={availableTags} />
    </div>
  );
}