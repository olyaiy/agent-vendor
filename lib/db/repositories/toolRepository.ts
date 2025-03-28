import { asc, eq } from 'drizzle-orm';
import { db } from '../client';
import { toolGroups, agentToolGroups, tools as toolsTable, toolGroupTools } from '../schema';
import { handleDbError } from '../utils/errorHandler';
import { redis } from '@/lib/ratelimit';

// Cache key prefixes
const AGENT_TOOLS_KEY_PREFIX = 'agent:tools:';

// Cache expiration time in seconds (5 minutes)
const CACHE_EXPIRATION = 300;

/**
 * Get all tool groups
 */
export async function getAllToolGroups() {
  try {
    return await db.select({
      id: toolGroups.id,
      name: toolGroups.name,
      displayName: toolGroups.display_name,
      description: toolGroups.description,
    })
    .from(toolGroups)
    .orderBy(asc(toolGroups.display_name));
  } catch (error) {
    return handleDbError(error, 'Failed to get tool groups from database', []);
  }
}

/**
 * Get tool groups for a specific agent
 */
export async function getToolGroupsByAgentId(agentId: string) {
  try {
    const result = await db.select({
      id: toolGroups.id,
      name: toolGroups.name,
      displayName: toolGroups.display_name,
      description: toolGroups.description,
    })
    .from(agentToolGroups)
    .innerJoin(toolGroups, eq(agentToolGroups.toolGroupId, toolGroups.id))
    .where(eq(agentToolGroups.agentId, agentId));
    
    return result;
  } catch (error) {
    return handleDbError(error, 'Failed to get tool groups for agent from database', []);
  }
}

/**
 * Get tools by tool group ID
 */
export async function getToolsByToolGroupId(toolGroupId: string) {
  try {
    const result = await db.select({
      id: toolsTable.id,
      displayName: toolsTable.tool_display_name,
      tool: toolsTable.tool,
      description: toolsTable.description,
    })
    .from(toolsTable)
    .innerJoin(
      toolGroupTools, 
      eq(toolsTable.id, toolGroupTools.toolId)
    )
    .where(eq(toolGroupTools.toolGroupId, toolGroupId));
    
    return result;
  } catch (error) {
    return handleDbError(error, 'Failed to get tools by tool group id from database', []);
  }
}

/**
 * Check if an agent has a search tool
 */
export async function doesAgentHaveSearchTool(agentId: string): Promise<boolean> {
  try {
    // Get all tool groups associated with the agent
    const agentToolGroups = await getToolGroupsByAgentId(agentId);
    
    // If no tool groups, return false
    if (!agentToolGroups.length) return false;
    
    // Check each tool group for a search tool
    for (const toolGroup of agentToolGroups) {
      const toolsList = await getToolsByToolGroupId(toolGroup.id);
      
      // Look for a tool with 'search' or 'web_search' in the name or tool identifier
      const hasSearchTool = toolsList.some(tool => 
        tool.displayName.toLowerCase().includes('search') || 
        tool.tool.toLowerCase().includes('search')
      );
      
      if (hasSearchTool) return true;
    }
    
    return false;
  } catch (error) {
    return handleDbError(error, 'Failed to check if agent has search tool', false);
  }
}

/**
 * Invalidate agent tools cache
 * @param agentId Agent ID
 */
export async function invalidateAgentToolsCache(agentId: string): Promise<void> {
  await redis.del(`${AGENT_TOOLS_KEY_PREFIX}${agentId}`);
}

/**
 * Optimized function to get all tools for an agent in a single query
 * with Redis caching
 */
export async function getAgentToolsWithSingleQuery(agentId: string) {
  try {
    // Try to get from cache first
    const cacheKey = `${AGENT_TOOLS_KEY_PREFIX}${agentId}`;
    const cachedTools = await redis.get<string>(cacheKey);
    
    if (cachedTools) {
      // Handle case where Redis client might have already parsed the JSON
      if (typeof cachedTools === 'object') {
        return cachedTools;
      }
      
      try {
        return JSON.parse(cachedTools);
      } catch (e) {
        console.error('Failed to parse cached tools:', e);
        // Continue to fetch from database if parsing fails
      }
    }
    
    // If not in cache, get from database
    const toolsList = await db.select({
      tool: toolsTable.tool,
      toolGroupId: toolGroups.id
    })
    .from(agentToolGroups)
    .innerJoin(toolGroups, eq(agentToolGroups.toolGroupId, toolGroups.id))
    .innerJoin(toolGroupTools, eq(toolGroups.id, toolGroupTools.toolGroupId))
    .innerJoin(toolsTable, eq(toolGroupTools.toolId, toolsTable.id))
    .where(eq(agentToolGroups.agentId, agentId));
    
    // Cache the result
    await redis.set(cacheKey, JSON.stringify(toolsList), { ex: CACHE_EXPIRATION });
    
    return toolsList;
  } catch (error) {
    return handleDbError(error, 'Failed to get agent tools with single query', []);
  }
} 