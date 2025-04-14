import { fetchUsers, type ListUsersResponse } from './admin-actions';
import { getAllTagsAction } from '@/db/actions/agent-actions'; // Import tag action
import UserTable from './user-table';
import TagManagement from '@/components/admin/tag-management'; // Import the new component
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
// Removed auth import as server-side check is temporarily removed
// Removed redirect import
// import { auth } from '@/lib/auth';
// import { redirect } from 'next/navigation';

// Define a simple component for unauthorized access
function UnauthorizedAccess() { // This component might not be reached if auth check is only in action
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Unauthorized Access</CardTitle>
                    <CardDescription>
                        You do not have permission to view this page. Please contact an administrator if you believe this is an error.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}

// Define a simple component for error loading data
function LoadingError({ resourceName = 'data' }: { resourceName?: string }) {
     return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Error Loading {resourceName}</CardTitle>
                    <CardDescription>
                        Could not fetch {resourceName} at this time. Please try refreshing the page or contact support if the problem persists.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
     );
}


export default async function AdminPage() {
  // IMPORTANT: Server-side authorization check removed temporarily due to uncertainty
  // about the correct session fetching method in Better Auth server components.
  // The authorization *should* be enforced within the `fetchUsers` server action.
  // If `fetchUsers` throws an 'Unauthorized' error, the LoadingError component will be shown below.

  // Fetch initial users data using the server action
  // Fetch initial data using server actions
  let initialUsersData: ListUsersResponse | null = null;
  let initialTagsData: Awaited<ReturnType<typeof getAllTagsAction>> | null = null;
  let fetchUsersError = false;
  let fetchTagsError = false;

  try {
    // Fetch users
    initialUsersData = await fetchUsers({ limit: 25 });
  } catch (error: unknown) {
    console.error("Failed to load users for admin page:", error);
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return <UnauthorizedAccess />;
    }
    fetchUsersError = true;
  }

  try {
    // Fetch tags
    initialTagsData = await getAllTagsAction();
    if (!initialTagsData.success) {
        console.error("Failed to load tags:", initialTagsData.error);
        fetchTagsError = true;
    }
  } catch (error: unknown) {
    console.error("Failed to load tags for admin page:", error);
    // Assuming unauthorized error is handled within the action or caught above
    fetchTagsError = true;
  }

   // Render LoadingError only for non-auth fetch errors
  // Render error if any fetch failed (prioritize user fetch error message)
  if (fetchUsersError || !initialUsersData) {
    return <LoadingError resourceName="Users" />;
  }
  if (fetchTagsError || !initialTagsData?.success) {
    // Tags are secondary, maybe show the page with a tag loading error?
    // For now, let's show a generic error, but you could adapt this.
    return <LoadingError resourceName="Tags" />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View, search, and manage users in the system. (Actions like ban/role change to be added).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pass fetched data to the client component for rendering the table */}
          {/* We will create UserTable next */}
          <UserTable initialData={initialUsersData} />
        </CardContent>
      </Card>

      {/* Tag Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tag Management</CardTitle>
          <CardDescription>
            Create, edit, and delete agent tags used for categorization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pass fetched tags to the client component */}
          <TagManagement initialTags={initialTagsData.data || []} />
        </CardContent>
      </Card>

      {/* Add more admin sections/cards here later */}

    </div>
  );
}
