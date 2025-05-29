'use server';

import { auth } from '@/lib/auth'; // Assuming your auth instance is here
import { User } from 'better-auth'; // Assuming User type is exported from better-auth
import { headers } from 'next/headers'; // Import headers
import { db } from '@/db'; // Import db instance
import * as schema from '@/db/schema'; // Import schema
import { eq } from 'drizzle-orm'; // Import eq operator
import { requireAdmin } from '@/lib/auth-utils'; // Import the new auth utility
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

/**
 * Fetches detailed information for a specific user by ID.
 * Requires admin privileges.
 * @param userId - The ID of the user to fetch.
 * @returns Promise with the user data or an error object.
 */
// Define the specific return type based on the schema
type UserDetailsResult = typeof schema.auth.user.$inferSelect;

export async function getUserDetailsAction(userId: string): Promise<{ success: true, data: UserDetailsResult } | { success: false, error: string }> {
  // --- Authorization Check ---
  let session;
  try {
      session = await auth.api.getSession({ headers: await headers() });
  } catch (sessionError) {
      console.error("Error fetching session in getUserDetailsAction:", sessionError);
      return { success: false, error: "Failed to verify session." };
  }

  if (!session?.user) {
      console.error("No user found in session within getUserDetailsAction.");
      return { success: false, error: "Authentication required." };
  }

  const isAdmin = session.user.role?.includes('admin');
  if (!isAdmin) {
     console.warn(`Unauthorized attempt to get details for user ID: ${userId} by user ID: ${session.user.id}`);
     return { success: false, error: 'Unauthorized: Admin access required.' };
  }
  // --- End Authorization Check ---

  try {
    // Fetch user directly using Better Auth's API if possible, or fallback to DB query
    // Assuming direct DB query for now as `getUser` might not exist in better-auth API
    // Corrected path to user schema: schema.auth.user
    const userResult = await db.select().from(schema.auth.user).where(eq(schema.auth.user.id, userId)).limit(1);

    if (userResult.length === 0) {
      return { success: false, error: "User not found." };
    }

    // Assert the result to the inferred select type from the schema
    // Assuming schema.user.$inferSelect is compatible with the 'User' type from better-auth
    // Assert the result to the inferred select type from the schema
    // Assuming schema.user.$inferSelect is compatible with the 'User' type from better-auth
    // The type is now directly inferred from the select using the correct schema path
    const userData = userResult[0];

    return { success: true, data: userData };

  } catch (error) {
    console.error(`Error fetching details for user ${userId}:`, error);
    return { success: false, error: `Failed to fetch user details. ${(error as Error).message}` };
  }
}

import { selectUsersWithDetails, countUsersWithDetails, type ListUsersQueryOptions, type UserWithDetails } from '@/db/repository/user.repository'; // Import new repo functions and types

// Define the response structure for the new action
export interface ListUsersWithDetailsResponse {
  users: UserWithDetails[];
  total: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetches a paginated list of users including their credit balance and agent count.
 * Requires admin privileges.
 * @param query - Options for pagination, filtering, sorting.
 * @returns Promise with the augmented user list and pagination metadata.
 */
export async function fetchUsersWithDetails(
  query?: ListUsersQueryOptions
): Promise<ListUsersWithDetailsResponse> {

  // --- Authorization Check ---
  let session;
  try {
      session = await auth.api.getSession({ headers: await headers() });
  } catch (sessionError) {
      console.error("Error fetching session in fetchUsersWithDetails:", sessionError);
      // Consider returning a specific error structure if preferred
      throw new Error("Failed to verify session.");
  }

  if (!session?.user) {
      console.error("No user found in session within fetchUsersWithDetails.");
      throw new Error("Authentication required.");
  }

  const isAdmin = session.user.role?.includes('admin');
  if (!isAdmin) {
     console.warn(`Unauthorized attempt to list users with details by user ID: ${session.user.id}`);
     throw new Error('Unauthorized: Admin access required.');
  }
  // --- End Authorization Check ---

  try {
    const queryOptions = query || {};
    // Fetch users and total count concurrently
    const [usersResult, totalResult] = await Promise.all([
        selectUsersWithDetails(queryOptions),
        countUsersWithDetails(queryOptions) // Pass same filters to count
    ]);

    return {
        users: usersResult,
        total: totalResult,
        limit: queryOptions.limit,
        offset: queryOptions.offset
    };

  } catch (error) {
    console.error('Error fetching users with details:', error);
    // Re-throw or handle as appropriate for your error strategy
    throw new Error(`Failed to fetch users with details. ${(error as Error).message}`);
  }
}

/**
 * Fetches a paginated list of chats for a specific user.
 * Requires admin privileges.
 * @param userId - The ID of the user whose chats to fetch.
 * @param limit - Number of chats to fetch (default: 10).
 * @param offset - Number of chats to skip (default: 0).
 * @returns Promise with the user's chat list and total count.
 */
export async function getUserChatsAction(
  userId: string,
  limit: number = 10,
  offset: number = 0
): Promise<{
  success: boolean;
  data?: {
    chats: Array<{
      id: string;
      title: string;
      createdAt: Date;
      agentId: string | null;
      agentSlug: string | null;
      agentName: string | null;
      lastMessageParts: unknown | null;
      lastMessageRole: string | null;
    }>;
    totalCount: number;
  };
  error?: string;
}> {
  // --- Authorization Check ---
  const authResult = await requireAdmin();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }
  // --- End Authorization Check ---

  try {
    // Import the chat repository functions
    const { getUserChatsPaginated } = await import('@/db/repository/chat-repository');
    
    const result = await getUserChatsPaginated({
      userId: userId,
      searchQuery: null,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    });

    // Transform the data to include agent information
    const transformedChats = result.chats.map(chat => ({
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      agentId: chat.agentId,
      agentSlug: chat.agentSlug,
      agentName: chat.agentSlug ? `Agent: ${chat.agentSlug}` : null, // Simple name derivation
      lastMessageParts: chat.lastMessageParts,
      lastMessageRole: chat.lastMessageRole,
    }));

    return {
      success: true,
      data: {
        chats: transformedChats,
        totalCount: result.totalCount,
      },
    };

  } catch (error) {
    console.error(`Error fetching chats for user ${userId}:`, error);
    return { success: false, error: `Failed to fetch user chats. ${(error as Error).message}` };
  }
}
