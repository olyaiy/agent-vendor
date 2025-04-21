import { getUserAgentsAction } from "@/db/actions/agent-actions";
import { AgentCard } from "@/components/agent-card"; // Corrected import
import { Agent } from "@/db/schema/agent"; // Ensure Agent is imported

// Define the expected agent type from the action
// This type is used internally in this file, so it's not unused.
type AgentWithModelAndTags = Agent & { modelName: string; tags: { id: string; name: string }[] };

export default async function AgentsPage() {
  const result = await getUserAgentsAction();

  if (!result.success) {
    // Handle authentication error or other errors
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">My Agents</h1>
        <p className="text-red-500">{result.error}</p>
      </div>
    );
  }

  // Explicitly type the agents array
  const agents: AgentWithModelAndTags[] = result.data;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">My Agents</h1>
      {agents.length === 0 ? (
        // Escape the apostrophe using '
        <p>You haven't created any agents yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            // Pass the agent object directly, no 'as any' needed
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}