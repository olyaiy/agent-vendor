// Import specific types returned by actions
import { getUserDetailsAction, getUserChatsAction } from '@/app/admin/admin-actions';
// Removed unused UserDetailsResult import
import { getUserCreditsAction } from '@/db/actions/transaction-actions';
import type { UserCredits } from '@/db/schema/transactions'; // Import UserCredits type
import { getAgentsByCreatorIdAction } from '@/db/actions/agent.actions';
import type { AgentWithModelAndTags } from '@/db/repository/agent.repository'; // Import agent type
import { AgentCard } from '@/components/agent-card'; // Assuming AgentCard can be reused
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, Calendar, User } from 'lucide-react';

// Define props type for the page component
interface UserDetailPageProps {
  params: Promise<{ userId: string }>;
}

// Helper component for displaying errors
function DataFetchError({ resourceName, error }: { resourceName: string, error?: string }) {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Error Loading {resourceName}</CardTitle>
        <CardDescription>
          Could not fetch {resourceName} for this user. {error ? `Details: ${error}` : 'Please try again later or contact support.'}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  // Await the params object first to resolve its properties
  const { userId } = await params;

  // Fetch data concurrently using the resolved userId
  const [userDetailsResult, userCreditsResult, userAgentsResult, userChatsResult] = await Promise.allSettled([
    getUserDetailsAction(userId),
    getUserCreditsAction(userId),
    getAgentsByCreatorIdAction(userId),
    getUserChatsAction(userId, 10, 0) // Fetch first 10 chats
  ]);

  // --- Process User Details ---
  // Explicitly type userDetails using the schema type
  let userDetails: (typeof import('@/db/schema/auth-schema').user.$inferSelect) | null = null;
  let userDetailsError: string | null = null;
  if (userDetailsResult.status === 'fulfilled') {
    if (userDetailsResult.value.success) {
      userDetails = userDetailsResult.value.data;
    } else {
      userDetailsError = userDetailsResult.value.error;
    }
  } else {
    userDetailsError = `Failed to fetch user details: ${userDetailsResult.reason}`;
    console.error(userDetailsError);
  }

  // --- Process User Credits ---
  // Explicitly type userCredits
  let userCredits: UserCredits | null = null;
  let userCreditsError: string | null = null;
  if (userCreditsResult.status === 'fulfilled') {
    if (userCreditsResult.value.success) {
      // Default credits if null (user might not have a record yet)
      // Use the resolved userId here as well
      userCredits = userCreditsResult.value.data || { userId: userId, creditBalance: '0', lifetimeCredits: '0' };
    } else {
      userCreditsError = userCreditsResult.value.error;
    }
  } else {
    userCreditsError = `Failed to fetch user credits: ${userCreditsResult.reason}`;
    console.error(userCreditsError);
  }

  // --- Process User Agents ---
  // Explicitly type userAgents
  let userAgents: AgentWithModelAndTags[] = [];
  let userAgentsError: string | null = null;
  if (userAgentsResult.status === 'fulfilled') {
    if (userAgentsResult.value.success) {
      userAgents = userAgentsResult.value.data;
    } else {
      userAgentsError = userAgentsResult.value.error;
    }
  } else {
    userAgentsError = `Failed to fetch user agents: ${userAgentsResult.reason}`;
    console.error(userAgentsError);
  }

  // --- Process User Chats ---
  let userChats: Array<{
    id: string;
    title: string;
    createdAt: Date;
    agentId: string | null;
    agentSlug: string | null;
    agentName: string | null;
    lastMessageParts: unknown | null;
    lastMessageRole: string | null;
  }> = [];
  let userChatsError: string | null = null;
  let totalChats = 0;
  if (userChatsResult.status === 'fulfilled') {
    if (userChatsResult.value.success && userChatsResult.value.data) {
      userChats = userChatsResult.value.data.chats;
      totalChats = userChatsResult.value.data.totalCount;
    } else {
      userChatsError = userChatsResult.value.error || 'Unknown error';
    }
  } else {
    userChatsError = `Failed to fetch user chats: ${userChatsResult.reason}`;
    console.error(userChatsError);
  }

  // Handle case where user details failed (critical error)
  if (!userDetails) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
         <Link href="/admin">
            <Button variant="outline" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin
            </Button>
        </Link>
        <DataFetchError resourceName="User Details" error={userDetailsError || 'User not found or unauthorized.'} />
      </div>
    );
  }

  // Format credit balance (assuming 8 decimal places)
  const formatCredits = (amount: string | number | null | undefined) => {
    if (amount === null || amount === undefined) return '$0.00';
    try {
      return `$${parseFloat(amount.toString()).toFixed(2)}`;
    } catch {
      return '$0.00'; // Fallback for invalid format
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
       <Link href="/admin">
            <Button variant="outline" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin
            </Button>
        </Link>

      {/* User Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Details for user ID: {userDetails.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Name:</strong> {userDetails.name}</p>
          <p><strong>Email:</strong> {userDetails.email} {userDetails.emailVerified ? <Badge variant="secondary">Verified</Badge> : <Badge variant="destructive">Not Verified</Badge>}</p>
          <p><strong>Username:</strong> {userDetails.username || 'N/A'}</p>
          <p><strong>Role:</strong> <Badge>{userDetails.role || 'user'}</Badge></p>
          <p><strong>Status:</strong> {userDetails.banned ? <Badge variant="destructive">Banned</Badge> : <Badge variant="secondary">Active</Badge>}</p>
          {userDetails.banned && <p><strong>Ban Reason:</strong> {userDetails.banReason || 'N/A'}</p>}
          <p><strong>Created At:</strong> {new Date(userDetails.createdAt).toLocaleString()}</p>
          <p><strong>Updated At:</strong> {new Date(userDetails.updatedAt).toLocaleString()}</p>
        </CardContent>
      </Card>

      {/* User Credits Card */}
      <Card>
        <CardHeader>
          <CardTitle>User Credits</CardTitle>
        </CardHeader>
        <CardContent>
          {userCreditsError ? (
            <DataFetchError resourceName="Credits" error={userCreditsError} />
          ) : userCredits ? (
            <div className="space-y-2">
              <p><strong>Current Balance:</strong> {formatCredits(userCredits.creditBalance)}</p>
              <p><strong>Lifetime Credits Earned/Purchased:</strong> {formatCredits(userCredits.lifetimeCredits)}</p>
            </div>
          ) : (
             <p>No credit information found for this user.</p> // Should be handled by default above
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* User Agents Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Agents Created by User</h2>
        {userAgentsError ? (
          <DataFetchError resourceName="Agents" error={userAgentsError} />
        ) : userAgents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {userAgents.map((agent: AgentWithModelAndTags) => ( // Add type to mapped item
              // Assuming AgentCard takes the agent data structure from AgentWithModelAndTags
              // You might need to adapt AgentCard or create a simpler display component
              // Remove 'as any' - let TS check compatibility or error if AgentCard props mismatch
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">This user has not created any agents yet.</p>
        )}
      </div>

      <Separator />

      {/* User Conversations Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          User Conversations
        </h2>
        {userChatsError ? (
          <DataFetchError resourceName="Conversations" error={userChatsError} />
        ) : userChats.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversations ({totalChats} total)
              </CardTitle>
              <CardDescription>
                Recent conversations by this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userChats.map((chat) => (
                  <Link 
                    key={chat.id} 
                    href={chat.agentSlug ? `/agent/${chat.agentSlug}/${chat.id}` : '#'}
                    className={chat.agentSlug ? "block" : "block cursor-not-allowed opacity-50"}
                  >
                    <div className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium">{chat.title}</h4>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(chat.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {chat.agentSlug && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          Agent: {chat.agentSlug}
                        </div>
                      )}
                      {chat.lastMessageRole && (
                        <div className="text-sm text-muted-foreground">
                          Last message from: {chat.lastMessageRole}
                        </div>
                      )}
                      {!chat.agentSlug && (
                        <div className="text-sm text-destructive">
                          No agent associated - cannot view conversation
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-500 text-center">This user has not participated in any conversations yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}