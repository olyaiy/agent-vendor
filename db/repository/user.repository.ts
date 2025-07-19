import { db } from '..';
import { eq, and, ilike, count, sql, desc, asc, SQL, getTableColumns } from 'drizzle-orm'; // Removed 'or'
import { user as authUserTable } from '../schema/auth-schema'; // Alias to avoid naming conflict
import { userCredits } from '../schema/transactions';
import { agent } from '../schema/agent';
import { User } from 'better-auth'; // Import base User type

// Define the structure for the augmented user data
export type UserWithDetails = typeof authUserTable.$inferSelect & {
  creditBalance: string; // Assuming numeric is returned as string, adjust if needed
  agentCount: number;
};

// Define options for querying users
// Mirroring options from fetchUsers in admin-actions for consistency
export interface ListUsersQueryOptions {
  limit?: number;
  offset?: number;
  searchField?: 'email' | 'name';
  searchOperator?: 'contains' | 'starts_with' | 'ends_with';
  searchValue?: string;
  sortBy?: keyof User | 'agentCount' | 'creditBalance' | 'messageCount' | 'lastMessageSentAt'; // Allow sorting by new fields
  sortDirection?: 'asc' | 'desc';
  filterField?: keyof User;
  filterOperator?: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'ne' | undefined;
  filterValue?: string | number | boolean | undefined;
}

// Helper function to build WHERE conditions based on options
function buildUserWhereConditions(options: ListUsersQueryOptions): SQL | undefined {
    const conditions: SQL[] = [];

    // Search logic (simplified example, adjust as needed)
    if (options.searchValue && options.searchField) {
        const searchPattern = options.searchOperator === 'starts_with' ? `${options.searchValue}%`
                            : options.searchOperator === 'ends_with' ? `%${options.searchValue}`
                            : `%${options.searchValue}%`; // contains default

        if (options.searchField === 'email') {
            conditions.push(ilike(authUserTable.email, searchPattern));
        } else if (options.searchField === 'name') {
            conditions.push(ilike(authUserTable.name, searchPattern));
        }
    }

    // Filter logic (simplified example, adjust as needed)
    if (options.filterField && options.filterOperator && options.filterValue !== undefined) {
        const column = authUserTable[options.filterField as keyof typeof authUserTable.$inferSelect];
        if (column) {
             switch (options.filterOperator) {
                case 'eq': conditions.push(eq(column, options.filterValue)); break;
                case 'ne': conditions.push(sql`${column} != ${options.filterValue}`); break;
                // Add other operators (gt, lt, gte, lte) handling type conversions if necessary
            }
        }
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
}


/**
 * Selects users with their credit balance and agent count.
 * @param options - Query options for pagination, filtering, sorting.
 * @returns Array of user records with details.
 */
export async function selectUsersWithDetails(options: ListUsersQueryOptions = {}): Promise<UserWithDetails[]> {
    const { limit = 25, offset = 0, sortBy = 'createdAt', sortDirection = 'desc' } = options;

    const agentCountCol = sql<number>`count(${agent.id})`.as('agent_count');
    const creditBalanceCol = sql<string>`coalesce(${userCredits.creditBalance}, '0')`.as('credit_balance');

    const query = db
        .select({
            ...getTableColumns(authUserTable),
            creditBalance: creditBalanceCol,
            agentCount: agentCountCol,
        })
        .from(authUserTable)
        .leftJoin(userCredits, eq(authUserTable.id, userCredits.userId))
        .leftJoin(agent, eq(authUserTable.id, agent.creatorId))
        .groupBy(
            authUserTable.id, // Group by user ID
            userCredits.creditBalance // Include joined column in group by or use aggregate like MAX/MIN if needed
            // Add other user columns if required by DB (PostgreSQL groups by PK implicitly)
            // authUserTable.name, authUserTable.email, ...
        )
        .limit(limit)
        .offset(offset);

    // Apply WHERE conditions
    const whereClause = buildUserWhereConditions(options);
    if (whereClause) {
        query.where(whereClause);
    }

    // Apply ORDER BY
    let orderByClause: SQL | undefined;
    const direction = sortDirection === 'asc' ? asc : desc;

    if (sortBy === 'agentCount') {
        orderByClause = direction(agentCountCol);
    } else if (sortBy === 'creditBalance') {
        orderByClause = direction(creditBalanceCol);
    } else if (sortBy === 'messageCount') {
        orderByClause = direction(authUserTable.messageCount);
    } else if (sortBy === 'lastMessageSentAt') {
        orderByClause = direction(authUserTable.lastMessageSentAt);
    } else {
        const sortColumn = authUserTable[sortBy as keyof typeof authUserTable.$inferSelect];
        if (sortColumn) {
            orderByClause = direction(sortColumn);
        } else {
             orderByClause = desc(authUserTable.createdAt); // Default sort
        }
    }
     if (orderByClause) {
        query.orderBy(orderByClause);
    }


    const results = await query;

    // Drizzle might return count as string, ensure it's number
    return results.map(row => ({
        ...row,
        agentCount: Number(row.agentCount) || 0,
        messageCount: Number(row.messageCount) || 0,
        creditBalance: row.creditBalance // Already handled by coalesce
    }));
}

/**
 * Counts the total number of users matching the filter criteria.
 * @param options - Query options for filtering.
 * @returns The total count of matching users.
 */
export async function countUsersWithDetails(options: ListUsersQueryOptions = {}): Promise<number> {

     const whereClause = buildUserWhereConditions(options);

     const query = db
        .select({ value: count(authUserTable.id) })
        .from(authUserTable);

     if (whereClause) {
        query.where(whereClause);
     }

     const result = await query;
     return result[0]?.value || 0;
}