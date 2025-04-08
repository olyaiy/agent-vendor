"use server"
import { auth } from "@/lib/auth";
import { CreateAgentForm, ModelInfo } from "./create-agent-form";
import { headers } from "next/headers";

// Models data
const mockModels: ModelInfo[] = [
  {
    id: "23481a46-7f8e-4692-a6bb-a5004cbc6c40",
    model: "Sonnet 3.7",
    description: "Advanced reasoning and comprehension",
  },
  {
    id: "40258c4f-fd47-45b1-915c-f452ebb69ec9",
    model: "Haiku 3.5",
    description: "Fast and efficient for most tasks",
  },
  {
    id: "6754e2d3-7cb0-4274-ab7a-f0f059e58897",
    model: "GPT 4o",
    description: "Most powerful model for complex tasks",
  },
  {
    id: "cdc58976-265c-47fa-94fb-0368675db562",
    model: "GPT 4o mini",
    description: "Balanced performance and efficiency",
  },
  {
    id: "f2464b50-cee5-420f-8068-f2f7b1ddba87",
    model: "Sonnet 3.7 Thinking",
    description: "Advanced reasoning capabilities",
  },
];



export default async function CreateAgentPage() {

  // Check Authentication
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if(!session) {
    return <div>Not authenticated</div>
  }


  return (
    <div className="container py-8 px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Agent</h1>
        <p className="text-muted-foreground mt-2">
          Design your AI agent by configuring its personality, capabilities, and behavior
        </p>
      </div>
      
      <CreateAgentForm userId={session.user.id} models={mockModels} />
    </div>
  );
}