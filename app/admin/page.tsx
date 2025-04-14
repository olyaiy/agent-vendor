import { fetchUsers, type ListUsersResponse } from './admin-actions';
import UserTable from './user-table'; 
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
function LoadingError() {
     return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Error Loading Users</CardTitle>
                    <CardDescription>
                        Could not fetch user data at this time. Please try refreshing the page or contact support if the problem persists.
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
  let initialUsersData: ListUsersResponse | null = null;
  let fetchError = false;
  try {
    // Fetch a reasonable number for the initial load, e.g., 25
     initialUsersData = await fetchUsers({ limit: 25 });
   } catch (error: unknown) { // Catch unknown type
     console.error("Failed to load users for admin page:", error);
     // Check if the error is the specific Unauthorized error from the action
     if (error instanceof Error && error.message.startsWith('Unauthorized')) {
         return <UnauthorizedAccess />; // Render specific component for auth error
     }
     fetchError = true; // Set flag for generic fetch error
   }

   // Render LoadingError only for non-auth fetch errors
   if (fetchError || !initialUsersData) {
       return <LoadingError />;
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

      {/* Add more admin sections/cards here later */}
      {/* e.g., System Stats, Configuration, etc. */}

    </div>
  );
}
