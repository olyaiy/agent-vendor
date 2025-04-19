'use client';

import React from 'react';
import { Agent } from '@/db/schema/agent';
import { AgentImage } from '@/components/agent-image';
import { cn } from '@/lib/utils'; // Assuming you have a utility for class names

interface MobileAgentHeaderProps {
  agent: Agent & { tags?: Array<{ id: string; name: string }> }; // Use the same type as AgentHeader for consistency
  hasMessages: boolean;
}

export function MobileAgentHeader({ agent, hasMessages }: MobileAgentHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 border-b border-border transition-all duration-200 ease-in-out',
        {
          'pb-4 pt-4': !hasMessages, // Larger padding when no messages
          'pb-2 pt-2': hasMessages,  // Standard padding when messages exist
        },
      )}
    >
      <div className="relative flex-shrink-0 w-10 h-10"> {/* Consistent size for image */}
        <AgentImage
          thumbnailUrl={agent.thumbnailUrl || agent.avatarUrl}
          agentId={agent.id}
          className="rounded-md" // Ensure image is rounded if needed
        />
      </div>
      <div className="flex-grow min-w-0">
        <h2 className="text-sm font-semibold truncate">{agent.name}</h2>
        {!hasMessages && agent.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {agent.description}
          </p>
        )}
      </div>
    </div>
  );
}