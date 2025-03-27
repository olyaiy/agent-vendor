import { asc, eq } from 'drizzle-orm';
import { db } from '../client';
import { toolGroups, agentToolGroups, tools, toolGroupTools } from '../schema';
import { handleDbError } from '../utils/errorHandler';

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
      id: tools.id,
      displayName: tools.tool_display_name,
      tool: tools.tool,
      description: tools.description,
    })
    .from(tools)
    .innerJoin(
      toolGroupTools, 
      eq(tools.id, toolGroupTools.toolId)
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
      const tools = await getToolsByToolGroupId(toolGroup.id);
      
      // Look for a tool with 'search' or 'web_search' in the name or tool identifier
      const hasSearchTool = tools.some(tool => 
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
 * Optimized function to get all tools for an agent in a single query
 */
export async function getAgentToolsWithSingleQuery(agentId: string) {
  try {
    return db.select({
      tool: tools.tool,
      toolGroupId: toolGroups.id
    })
    .from(agentToolGroups)
    .innerJoin(toolGroups, eq(agentToolGroups.toolGroupId, toolGroups.id))
    .innerJoin(toolGroupTools, eq(toolGroups.id, toolGroupTools.toolGroupId))
    .innerJoin(tools, eq(toolGroupTools.toolId, tools.id))
    .where(eq(agentToolGroups.agentId, agentId));
  } catch (error) {
    return handleDbError(error, 'Failed to get agent tools with single query', []);
  }
} 