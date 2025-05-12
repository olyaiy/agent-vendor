"use client";

import React from 'react';
import Link from 'next/link';
import { Agent, Knowledge } from '@/db/schema/agent';
import { Tool } from '@/db/schema/tool';
import { AgentAvatar } from '@/components/agent-avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'; // Added SheetTitle
import { AgentInfo } from '@/components/agent-info';
import { ChevronLeft, Settings, InfoIcon } from 'lucide-react'; // Changed Info to InfoIcon for clarity if needed, or use Info
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip components
import type { AgentSpecificModel } from '@/components/chat';

export interface MobileAgentHeaderProps {
  // Agent prop now expects tags to be included, consistent with AgentInfoProps
  agent: Agent & { tags: Array<{ id: string; name: string }> };
  // hasMessages: boolean; // Removed as it was unused
  isOwner: boolean;
  knowledgeItems: Knowledge[];
  models: AgentSpecificModel[];
  selectedModelId: string;
  setSelectedModelId: React.Dispatch<React.SetStateAction<string>>;
  chatSettings: Record<string, number>;
  onSettingChange: (settingName: string, value: number) => void;
  assignedTools: Tool[];
}

export function MobileAgentHeader({
  agent, // Now expects agent with tags
  // hasMessages,
  isOwner,
  knowledgeItems,
  models,
  selectedModelId,
  setSelectedModelId,
  chatSettings,
  onSettingChange,
  assignedTools,
}: MobileAgentHeaderProps) {
  const hasActiveTools = assignedTools && assignedTools.length > 0;

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-background backdrop-blur-xl">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-2" asChild>
          <Link href="/agents">
            <ChevronLeft className="w-5 h-5" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <AgentAvatar agentId={agent.id} avatarUrl={agent.avatarUrl} size={32} />
          <span className="font-semibold text-sm truncate">{agent.name}</span>
          {hasActiveTools && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon size={14} className="text-muted-foreground cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{assignedTools.length} tool(s) active</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
            <span className="sr-only">Agent Settings</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[70%] max-w-md pt-8">
          <SheetTitle className="sr-only">Agent Settings</SheetTitle> {/* Added SheetTitle */}
          <AgentInfo
            agent={agent} // agent already includes tags due to updated prop type
            isOwner={isOwner}
            knowledgeItems={knowledgeItems}
            models={models}
            selectedModelId={selectedModelId}
            setSelectedModelId={setSelectedModelId}
            chatSettings={chatSettings}
            onSettingChange={onSettingChange}
            assignedTools={assignedTools}
          />
        </SheetContent>
      </Sheet>
    </header>
  );
}