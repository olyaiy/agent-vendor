"use server"
import { auth } from "@/lib/auth";
import { CreateAgentForm, ModelInfo } from "./create-agent-form";
import { headers } from "next/headers";

// Models data with correct types to match ModelInfo interface
const mockModels: ModelInfo[] = [
  {
    id: "23481a46-7f8e-4692-a6bb-a5004cbc6c40",
    displayName: "Sonnet 3.7",
    modelType: "text-large",
    description: "Advanced reasoning and comprehension",
    provider: "Anthropic",
  },
  {
    id: "40258c4f-fd47-45b1-915c-f452ebb69ec9",
    displayName: "Haiku 3.5",
    modelType: "text-small",
    description: "Fast and efficient for most tasks",
    provider: "Anthropic",
  },
  {
    id: "6754e2d3-7cb0-4274-ab7a-f0f059e58897",
    displayName: "GPT 4o",
    modelType: "text-large",
    description: "Most powerful model for complex tasks",
    provider: "OpenAI",
  },
  {
    id: "cdc58976-265c-47fa-94fb-0368675db562",
    displayName: "GPT 4o mini",
    modelType: "text-small",
    description: "Balanced performance and efficiency",
    provider: "OpenAI",
  },
  {
    id: "f2464b50-cee5-420f-8068-f2f7b1ddba87",
    displayName: "Sonnet 3.7 Thinking",
    modelType: "reasoning",
    description: "Advanced reasoning capabilities",
    provider: "Anthropic",
  },
];

export default async function CreateAgentPage() {
  const session = await auth.api.getSession({
    headers: await headers()
})

if(!session) {
  return <div>Not authenticated</div>
}


  
  // In a real app, you would get the user ID from authentication
  const userId = session.user.id;

  return (
    <div className="container py-8 px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Agent</h1>
        <p className="text-muted-foreground mt-2">
          Design your AI agent by configuring its personality, capabilities, and behavior
        </p>
      </div>
      
      <CreateAgentForm userId={userId} models={mockModels} />
    </div>
  );
}