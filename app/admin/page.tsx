import { fetchUsersWithDetails, type ListUsersWithDetailsResponse } from './admin-actions'; // Import the new action and response type
import { getAllTagsAction } from '@/db/actions/tag.actions'; // Import tag and model actions
import { getAllModelsAction } from '@/db/actions';
import { getAllToolsAction } from '@/db/actions/tool.actions'; // Import tool action
import UserTable from './user-table';
import TagManagement from '@/components/admin/tag-management'; // Import Tag component
import ModelManagement from '@/components/admin/model-management'; // Import Model component
import ToolManagement from '@/components/admin/tool-management'; // Import Tool component
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import Tabs components
import { toolRegistry } from '@/tools/registry'; // Import the tool registry

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

  // Fetch initial data using server actions
  let initialUsersData: ListUsersWithDetailsResponse | null = null; // Use the new response type
  let initialTagsData: Awaited<ReturnType<typeof getAllTagsAction>> | null = null;
  let initialModelsData: Awaited<ReturnType<typeof getAllModelsAction>> | null = null;
  let initialToolsData: Awaited<ReturnType<typeof getAllToolsAction>> | null = null; // Added for tools

  let fetchUsersError = false;
  let fetchTagsError = false;
  let fetchModelsError = false;
  let fetchToolsError = false; // Added for tools

  // Use Promise.allSettled for concurrent fetching and individual error handling
  const results = await Promise.allSettled([
      fetchUsersWithDetails({ limit: 25 }), // Call the new action
      getAllTagsAction(),
      getAllModelsAction(), // Fetch models concurrently
      getAllToolsAction() // Fetch tools concurrently
  ]);

  // Process Users result
  if (results[0].status === 'fulfilled') {
      initialUsersData = results[0].value;
  } else {
      console.error("Failed to load users for admin page:", results[0].reason);
      if (results[0].reason instanceof Error && results[0].reason.message.startsWith('Unauthorized')) {
          return <UnauthorizedAccess />;
      }
      fetchUsersError = true;
  }

  // Process Tags result
  if (results[1].status === 'fulfilled') {
      initialTagsData = results[1].value;
      if (!initialTagsData.success) {
          console.error("Failed to load tags:", initialTagsData.error);
          fetchTagsError = true;
      }
  } else {
      console.error("Failed to load tags for admin page:", results[1].reason);
      fetchTagsError = true;
  }

  // Process Models result
  if (results[2].status === 'fulfilled') {
      initialModelsData = results[2].value;
      if (!initialModelsData.success) {
          console.error("Failed to load models:", initialModelsData.error);
          fetchModelsError = true;
      }
  } else {
      console.error("Failed to load models for admin page:", results[2].reason);
      fetchModelsError = true;
  }

  // Process Tools result
  if (results[3].status === 'fulfilled') {
    initialToolsData = results[3].value;
    if (!initialToolsData.success) {
        console.error("Failed to load tools:", initialToolsData.error);
        fetchToolsError = true;
    }
  } else {
      console.error("Failed to load tools for admin page:", results[3].reason);
      fetchToolsError = true;
  }

  const codebaseToolNames = Object.keys(toolRegistry);

   // Render LoadingError only for non-auth fetch errors
  // Render error if any fetch failed (prioritize user fetch error message)
  if (fetchUsersError || !initialUsersData) {
    return <LoadingError resourceName="Users" />;
  }
  if (fetchTagsError || !initialTagsData?.success) {
    return <LoadingError resourceName="Tags" />;
  }
  if (fetchModelsError || !initialModelsData?.success) {
    return <LoadingError resourceName="Models" />;
  }
  if (fetchToolsError || !initialToolsData?.success) { // Though initialToolsData might be empty if no tools in DB, success should be true
    return <LoadingError resourceName="Tools" />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="tags">Tag Management</TabsTrigger>
          <TabsTrigger value="models">Model Management</TabsTrigger>
          <TabsTrigger value="tools">Tool Management</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View, search, and manage users in the system. (Actions like ban/role change to be added).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable initialData={initialUsersData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags">
          <Card>
            <CardHeader>
              <CardTitle>Tag Management</CardTitle>
              <CardDescription>
                Create, edit, and delete agent tags used for categorization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TagManagement initialTags={initialTagsData.data || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Model Management</CardTitle>
              <CardDescription>
                Create, edit, and delete language models available for agents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModelManagement initialModels={initialModelsData.data || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <ToolManagement
            initialTools={initialToolsData.data || []}
            codebaseToolNames={codebaseToolNames}
          />
        </TabsContent>

      </Tabs>

      {/* Add more admin sections/cards here later */}

    </div>
  );
}
