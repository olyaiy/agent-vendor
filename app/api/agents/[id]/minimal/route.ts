import { NextRequest, NextResponse } from 'next/server';
import { getAgentById } from '@/lib/db/repositories/agentRepository';
import { auth } from '@/app/(auth)/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const session = await auth();

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    // Get the agent
    const agent = await getAgentById(agentId);

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Check if the agent is public or if the requester is the creator
    const isAllowed = 
      agent.visibility === 'public' || 
      (session?.user && agent.creatorId === session.user.id);

    if (!isAllowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Return minimal agent data
    return NextResponse.json({
      id: agent.id,
      agent_display_name: agent.agent_display_name,
      avatar_url: agent.avatar_url,
      thumbnail_url: agent.thumbnail_url
    });
  } catch (error) {
    console.error('Error fetching minimal agent data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 