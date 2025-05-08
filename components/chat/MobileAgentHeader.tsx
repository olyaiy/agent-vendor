'use client';

import React from 'react';
import type { Agent, Knowledge } from '@/db/schema/agent';
import type { AgentSpecificModel } from '@/components/chat'; // Assuming this type is accessible
import { AgentImage } from '@/components/agent-image';
import { AgentInfo } from '@/components/agent-info';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileAgentHeaderProps {
  agent: Agent & { tags?: Array<{ id: string; name: string }> };
  hasMessages: boolean;
  // New props for AgentInfo:
  isOwner: boolean;
  knowledgeItems: Knowledge[];
  models: AgentSpecificModel[];
  selectedModelId: string;
  setSelectedModelId: React.Dispatch<React.SetStateAction<string>>;
  chatSettings: Record<string, number>;
  onSettingChange: (settingName: string, value: number) => void;
}

export function MobileAgentHeader({
  agent,
  hasMessages,
  isOwner,
  knowledgeItems,
  models,
  selectedModelId,
  setSelectedModelId,
  chatSettings,
  onSettingChange,
}: MobileAgentHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 border-b border-border transition-all duration-200 ease-in-out',
        {
          'pb-4 pt-4': !hasMessages,
          'pb-2 pt-2': hasMessages,
        },
      )}
    >
      <div className="relative flex-shrink-0 w-10 h-10">
        <AgentImage
          thumbnailUrl={agent.thumbnailUrl || agent.avatarUrl}
          agentId={agent.id}
          className="rounded-md"
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
      <div className="ml-auto">
        <Sheet>
          <SheetTrigger asChild>
            <button className="p-1.5 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <MoreVertical className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent className="w-[90vw] sm:w-[400px] p-0 flex flex-col">
            <SheetHeader>
              <SheetTitle>Agent Details</SheetTitle>
            </SheetHeader>
            <AgentInfo
              agent={agent}
              isOwner={isOwner}
              knowledgeItems={knowledgeItems}
              models={models}
              selectedModelId={selectedModelId}
              setSelectedModelId={setSelectedModelId}
              chatSettings={chatSettings}
              onSettingChange={onSettingChange}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}