import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserById } from "./actions";
import { EditUsername } from "./edit-username";
import { auth } from "@/app/(auth)/auth";
import { AgentList } from "@/components/agent/agent-list";
import { getAgents } from "@/lib/db/queries";
import { MainHeader } from "@/components/layout/main-header";
import { TokenUsage } from '@/app/components/TokenUsage';
import { DollarSign, Plus } from "lucide-react"; // Added Plus icon for the Add Credits button


export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your profile settings",
};

export default async function ProfilePage() {
  // Get the authenticated user
  const session = await auth();
  
  if (!session?.user?.id) {
    return notFound();
  }
  
  const userId = session.user.id;
  const user = await getUserById(userId);
  
  if (!user) {
    return notFound();
  }


    // Format credit balance as dollars with '$' symbol
    const dollarCredits = user.credit_balance 
    ? `$${(Math.floor(parseFloat(user.credit_balance.toString()) * 100) / 100).toFixed(2)}`
    : '$0.00';


  // Fetch user's agents
  const userAgents = await getAgents(userId, true, false, true);
  // Limit to just a preview (3 agents)
  const agentPreview = userAgents.slice(0, 3).map(agent => ({
    ...agent,
    createdAt: (agent as any).createdAt || new Date(),
    updatedAt: (agent as any).updatedAt || new Date(),
    avatar_url: (agent as any).avatar_url || null,
    customization: (agent as any).customization || {
      overview: {
        title: "Welcome to your AI assistant!",
        content: "I'm here to help answer your questions and provide information.",
        showPoints: false,
        points: []
      },
      style: {
        colorSchemeId: "default"
      }
    }
  }));

  return (
    <>
    <div className="container max-w-5xl mx-auto p-4">
      <div className="grid gap-8">
                        {/* Profile Card */}
        <Card className="shadow-md border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 h-12 relative">
            <div className="absolute -bottom-10 left-6">
              <div className="size-20 border-4 border-background shadow-md rounded-full overflow-hidden">
                <Image
                  src={`https://avatar.vercel.sh/${user.email || 'anonymous'}`}
                  alt={user.user_name || user.email || 'User Avatar'}
                  width={80}
                  height={80}
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          <CardHeader className="pt-14 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold">Profile</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Manage your account settings
                </CardDescription>
              </div>
              <Link href="/profile/credits" className="block">
                <Button size="sm" className="gap-1.5">
                  <Plus className="size-3.5" />
                  Add Credits
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
              <div className="space-y-3">
                <div className="space-y-1 pl-1">
                  <EditUsername user={user} />
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              {/* Credit Balance Card - Redesigned */}
              <div className="bg-muted/20 rounded-xl p-5 flex flex-col h-full justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-10 flex items-center justify-center bg-primary/15 rounded-full">
                    <DollarSign className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Available Credits</p>
                    <p className="text-2xl font-bold">{dollarCredits}</p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  Use credits to power your AI agents and interactions
                </div>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Token Usage Card */}
        <TokenUsage userId={userId} />

        {/* Agents Preview Section */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-xl font-semibold">Your Agents</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Preview of your custom agents
              </CardDescription>
            </div>
            <Button size="sm" className="ml-auto">
              <Link href="/agents">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-2 pb-6">
            {agentPreview.length > 0 ? (
              <AgentList agents={agentPreview} userId={userId} />
            ) : (
              <div className="text-center py-10 px-4 bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">You haven`&apos;`t created any agents yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
} 