import { Metadata } from "next";
import { auth } from "@/app/(auth)/auth";
import { getAgentsWithFullDetails } from "@/lib/db/repositories/agentRepository";
import { redirect } from "next/navigation";
import { MyAgentList } from "@/components/agent/my-agent-list";

export const metadata: Metadata = {
  title: "My Agents",
  description: "Manage your AI agents",
};

export default async function MyAgentsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ timePeriod?: string }> 
}) {
  const session = await auth();
  
  // If user is not logged in, redirect to login page
  if (!session?.user) {
    redirect("/login");
  }
  
  // Await the searchParams promise and get the time period or default to all-time
  const resolvedParams = await searchParams;
  const timePeriod = resolvedParams.timePeriod || 'all-time';
  
  // Fetch only agents created by the current user including models, tools, tags, and earnings
  const userAgents = await getAgentsWithFullDetails(session.user.id, true, true, true, timePeriod);

  return (
    <div className="container py-6 space-y-6 px-4 mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Agents</h1>
          <p className="text-muted-foreground max-w-2xl">
            Manage all your custom agents in one place. View, edit, or create new AI assistants tailored to your specific needs.
          </p>
        </div>
      </div>
      
      <MyAgentList 
        agents={userAgents} 
        userId={session.user.id}
        timePeriod={timePeriod}
      />
    </div>
  );
}
