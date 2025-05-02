import { auth } from "@/lib/auth";
import { CreateAgentForm, ModelInfo } from "./create-agent-form";
import { headers } from "next/headers";
import { getAllModelsAction } from "@/db/actions/model.actions";
import { Tag } from "@/db/schema/agent"; // Import Tag type
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { getAllTagsAction } from "@/db/actions/tag.actions";


export default async function CreateAgentPage() {

  // Auth Check
  const session = await auth.api.getSession({
    headers: await headers()
  })
  
  // Fetch Models and Tags
  const [modelsResult, tagsResult] = await Promise.all([
    getAllModelsAction(),
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
    console.error("Failed to fetch models");
    // Consider showing an error message to the user
  }

  
  let availableTags: { value: string; label: string }[] = [];
  if (tagsResult.success && tagsResult.data) {
    availableTags = tagsResult.data.map((tag: Tag) => ({
      value: tag.id,
      label: tag.name,
    }));
  } else {
    console.error("Failed to fetch tags");
    // Consider showing an error message or allowing creation without tags
  }
  
  const pageContent = (
    <div className="container py-8 px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Agent</h1>
        <p className="text-muted-foreground mt-2">
          Design your AI agent by configuring its personality, capabilities, and behavior
        </p>
      </div>
      
      {/* Pass the fetched models (or empty array) to the client component */}
      <CreateAgentForm userId={session?.user?.id || ''} models={availableModels} allTags={availableTags} />
    </div>
  );

  if(!session) {
    return (
      <div className="relative max-h-screen overflow-hidden">
        {/* Blurred background showing the form */}
        <div className="filter blur-sm pointer-events-none opacity-50">
          {pageContent}
        </div>
        
        {/* Auth overlay */}
        <div className="absolute inset-0 flex items-center justify-center ">
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-8 max-w-md w-full mx-4 border border-border">
            <div className="text-center space-y-4 mb-6 ">
              <h2 className="text-2xl font-bold">Sign in to access</h2>
              <p className="text-muted-foreground">
                Create and monetize your custom AI agents by signing in to your account
              </p>
            </div>
            <GoogleSignInButton className="w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  return pageContent;
}