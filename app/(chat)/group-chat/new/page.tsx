import { auth } from "@/app/(auth)/auth";
import { getAgents } from "@/lib/db/repositories/agentRepository";
import GroupChatForm from "@/components/group-chat/group-chat-form";

import { Separator } from "@/components/ui/separator";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Loading skeleton for the form
function FormSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-10 pt-8">
      {/* Basic Info Skeleton */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="md:col-span-8 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </section>
      <Separator />
      {/* Agent Selection Skeleton */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-4">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="md:col-span-8 space-y-6">
          <div className="space-y-2">
             <Skeleton className="h-5 w-1/4" />
             <Skeleton className="h-11 w-full" />
             <Skeleton className="h-4 w-3/4 mt-1" />
          </div>
        </div>
      </section>
      {/* Footer Skeleton */}
      <div className="flex justify-between py-5 border-t mt-8">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-48" />
      </div>
    </div>
  );
}

export default async function NewGroupChatPage() {
  const session = await auth();
  const userId = session?.user?.id;

  // Ensure user is logged in
  if (!userId) {
    // Redirect or show an error message (implement based on your auth flow)
    return <p>Please log in to create a group chat.</p>;
  }

  // Fetch agents available to this user
  // Using getAgents to get minimal details needed for selection
  const agents = await getAgents(userId);

  return (
    <>
      <Suspense fallback={<FormSkeleton />}>
        <GroupChatForm userId={userId} agents={agents} />
      </Suspense>
      </>
  );
}
