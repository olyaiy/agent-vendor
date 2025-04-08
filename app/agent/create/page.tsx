
import { CreateAgentForm } from "./create-agent-form";




// Mock data for models - in a real app, this would come from an API or database
const mockModels = [
  {
    id: "gpt-4",
    displayName: "GPT-4",
    modelType: "text-large",
    description: "Most powerful model for complex tasks",
    provider: "OpenAI",
  },
  {
    id: "gpt-3.5-turbo",
    displayName: "GPT-3.5 Turbo",
    modelType: "text-small",
    description: "Fast and efficient for most tasks",
    provider: "OpenAI",
  },
  {
    id: "claude-3-opus",
    displayName: "Claude 3 Opus",
    modelType: "text-large",
    description: "Advanced reasoning and comprehension",
    provider: "Anthropic",
  },
  {
    id: "claude-3-sonnet",
    displayName: "Claude 3 Sonnet",
    modelType: "text-small",
    description: "Balanced performance and efficiency",
    provider: "Anthropic",
  },
];

export default function CreateAgentPage() {
  // In a real app, you would get the user ID from authentication
  const userId = "user-123";

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