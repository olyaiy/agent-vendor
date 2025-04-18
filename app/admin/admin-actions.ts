'use server';

import { auth } from '@/lib/auth'; // Assuming your auth instance is here
import { User } from 'better-auth'; // Assuming User type is exported from better-auth
import { headers } from 'next/headers'; // Import headers
// Removed BetterAuthSession import as it's not exported

// Define the structure of the user data we expect from listUsers, including pagination metadata
// Adjust based on the actual return type of auth.api.listUsers if different
export interface ListUsersResponse {
  users: User[];
  total: number;
  limit?: number;
  offset?: number;
}

export async function fetchUsers(
  query?: {
    limit?: number;
    offset?: number;
    searchField?: 'email' | 'name';
    searchOperator?: 'contains' | 'starts_with' | 'ends_with';
    searchValue?: string;
    sortBy?: keyof User; // Adjust based on sortable fields
    sortDirection?: 'asc' | 'desc';
    filterField?: keyof User; // Adjust based on filterable fields
    // Corrected filterOperator types based on the TS error
    filterOperator?: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'ne' | undefined;
    filterValue?: string | number | boolean | undefined; // Use specific types instead of unknown
  }
): Promise<ListUsersResponse> {

  // --- Optional but Recommended: Add Session Check Back ---
  // Now that we know how to pass headers, let's try the session check again
  let session;
  try {
      session = await auth.api.getSession({ headers: await headers() });
  } catch (sessionError) {
      console.error("Error fetching session in fetchUsers:", sessionError);
      throw new Error("Failed to verify session."); // Fail if session can't be fetched
  }

  if (!session?.user) {
      // This case might indicate an issue even before the admin check
      console.error("No user found in session within fetchUsers.");
      throw new Error("Authentication required.");
  }

  // Perform the admin check using the fetched session
  const isAdmin = session.user.role?.includes('admin');

  if (!isAdmin) {
     console.warn(`Unauthorized attempt to list users by user ID: ${session.user.id}`);
     throw new Error('Unauthorized: Admin access required.'); // Throw specific error
  }
  // --- End Session Check ---


  try {
    const apiInput = {
         query: query || {},
         headers: await headers() // <<< Pass headers here
    };
    const result = await auth.api.listUsers(apiInput);
    // Avoid logging potentially large user list in production, maybe just log count or total

    // Adjust check: Ensure users array exists
    if (result && Array.isArray(result.users)) {
       // Construct the response object safely using type guards
       const response: ListUsersResponse = {
           users: result.users,
           // Default total if it's not a number, using users length as fallback
           total: typeof result.total === 'number' ? result.total : result.users.length,
           // Explicitly check if limit/offset exist before assigning
           limit: 'limit' in result ? result.limit : undefined,
           offset: 'offset' in result ? result.offset : undefined
       };
       return response;
    } else {
        // Log the unexpected format if users array is missing or result is falsy
        console.error("Unexpected response format (missing users array or invalid result) from auth.api.listUsers:", result);
        // Return a well-defined empty state
        return { users: [], total: 0, limit: undefined, offset: undefined };
    }

  } catch (error) {
    console.error('Error fetching users (API call failed):', error); // Log the specific API call error
    // Check if it's the APIError from the log
    if (error && typeof error === 'object' && 'status' in error && error.status === 'UNAUTHORIZED') {
         // Log details if available in the error object
         console.error("API returned UNAUTHORIZED status.");
         throw new Error('Unauthorized: Admin access required.'); // Re-throw specific error
    }
    throw new Error('Failed to fetch users.'); // Throw generic error for other issues
  }
}

// Add other admin actions here later (e.g., banUser, setRole, impersonateUser)
// Example:
/*
export async function banUserAction(userId: string, reason?: string) {
  // ... admin check ...
  try {
    await auth.api.banUser({ userId, banReason: reason });
    // Revalidate path or handle success
  } catch (error) {
    // Handle error
  }
}
*/
