import { auth } from "@/lib/auth";
import { CreateAgentForm, ModelInfo } from "./create-agent-form";
import { headers } from "next/headers";
import { getAllModels } from "@/db/actions/agent-actions"; // Import the server action

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
  
    // Fetch models efficiently on the server
    let availableModels: ModelInfo[] = [];
    try {
      const modelsResult = await getAllModels();
      if (modelsResult.success && modelsResult.data) {
        // Map the fetched data to the expected ModelInfo structure if necessary
        // Assuming the fetched data structure matches ModelInfo for now
        availableModels = modelsResult.data.map(model => ({
          id: model.id,
          model: model.model, // Ensure field names match ModelInfo
          description: model.description ?? null // Handle potential null description
        }));
        console.log("Fetched models:", availableModels.length);
      } else {
        console.error("Failed to fetch models:", modelsResult.error);
        // Keep availableModels as []
      }
    } catch (error) {
       console.error("Error fetching models:", error);
       // Keep availableModels as []
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
        <CreateAgentForm userId={session.user.id} models={availableModels} />
    </div>
  );
}