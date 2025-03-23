import { getAgents, getMostCommonTags } from "@/lib/db/queries";
import { AgentList } from "./agent-list";
import { sortAgentsByRecentUsage } from "@/app/actions";
import { auth } from "@/app/(auth)/auth";
import { cookies } from "next/headers";
import { RecentAgentsScroll } from "./recent-agents-carousel";

interface AgentContainerProps {
  // Make userId optional since we'll fetch it if not provided
  userId?: string;
}

export async function AgentContainer({ userId }: AgentContainerProps) {
  // If userId is not provided, fetch it from the auth session
  // This allows the component to work both ways - either with a provided userId or by fetching it
  let finalUserId = userId;
  
  if (!finalUserId) {
    // Fetch auth data only if userId wasn't provided
    const session = await auth();
    finalUserId = session?.user?.id;
  }
  
  // Fetch agents and sort them
  const agents = await getAgents(finalUserId, true);
  const sortedAgents = await sortAgentsByRecentUsage(agents as any);
  
  // Get recent agents from cookie
  const cookieStore = await cookies();
  const recentAgentsCookie = cookieStore.get('recent-agents');
  
  // Prepare recent agents list if cookie exists
  let recentAgents: any[] = [];
  if (recentAgentsCookie) {
    const recentAgentIds = recentAgentsCookie.value.split(',');
    
    // Filter agents to only include those in the recent list (max 5)
    recentAgents = agents
      .filter((agent: any) => recentAgentIds.includes(agent.id))
      .sort((a: any, b: any) => {
        // Sort according to their position in the recent list
        return recentAgentIds.indexOf(a.id) - recentAgentIds.indexOf(b.id);
      })
      .slice(0, 5); // Ensure max 5 agents
  }
  
  // Fetch the most common tags
  const commonTags = await getMostCommonTags(20);

  return (
    <div className="w-full space-y-8">
      {recentAgents.length > 0 && (
        <RecentAgentsScroll agents={recentAgents} userId={finalUserId} />
      )}
      <AgentList agents={sortedAgents} userId={finalUserId} tags={commonTags} />
    </div>
  );
} 