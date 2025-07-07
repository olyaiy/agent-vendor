// components/agent-info.tsx
'use client';

import { memo } from 'react';
import { Agent, Knowledge } from '@/db/schema/agent';
import { Tool } from '@/db/schema/tool'; // Import Tool type


import { AgentHeader } from './agent-header';
import { BehaviourSection } from './behaviour-section';
import { ToolsSection } from './tools-section';
import { SettingsSection } from './settings-section';

import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { BookOpen, ChevronRight } from 'lucide-react';

import { KnowledgeItemDisplay } from './knowledge-item-display';
import { modelDetails } from '@/lib/models';
import { AgentSpecificModel } from '@/hooks/use-chat-manager';

interface AgentInfoProps {
  agent: Agent & { modelName?: string; tags: Array<{ id: string; name: string }> };
  isOwner: boolean;
  knowledgeItems: Knowledge[];
  selectedModelId: string;
  setSelectedModelId: React.Dispatch<React.SetStateAction<string>>;
  models: AgentSpecificModel[];
  chatSettings: Record<string, number>;
  onSettingChange: (settingName: string, value: number) => void;
  assignedTools: Tool[]; // Add assignedTools prop
}

function AgentInfoComponent({
  agent,
  isOwner,
  knowledgeItems,
  selectedModelId,
  setSelectedModelId,
  models,
  chatSettings,
  onSettingChange,
  assignedTools // Destructure assignedTools
}: AgentInfoProps) {

  const selectedModelInfo = models.find(m => m.modelId === selectedModelId);
  const selectedModelString = selectedModelInfo?.model;
  const selectedModelDetail = selectedModelString ? modelDetails[selectedModelString] : undefined;

  return (
    <div className="h-full p-4 space-y-6 overflow-y-auto pb-24">
      <AgentHeader
        agent={agent}
        isOwner={isOwner}
        models={models}
        selectedModelId={selectedModelId}
        setSelectedModelId={setSelectedModelId}
      />

      <div className="space-y-1">
        <BehaviourSection initialSystemPrompt={agent.systemPrompt} />
        <KnowledgeSection knowledgeItems={knowledgeItems} />
        <ToolsSection assignedTools={assignedTools} /> {/* Pass assignedTools to ToolsSection */}
        <SettingsSection
          modelSettings={selectedModelDetail?.defaultSettings}
          chatSettings={chatSettings}
          onSettingChange={onSettingChange}
        />
      </div>
    </div>
  );
}

export const AgentInfo = memo(AgentInfoComponent);

interface KnowledgeSectionProps {
  knowledgeItems: Knowledge[];
}

function KnowledgeSectionComponent({ knowledgeItems }: KnowledgeSectionProps) {
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);

  return (
    <Collapsible
      open={isKnowledgeOpen}
      onOpenChange={setIsKnowledgeOpen}
      className="group"
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 group-hover:bg-muted/30 rounded-lg px-3 transition-all duration-200 ease-in-out cursor-pointer hover:scale-[1.01] transform">
        <div className="flex items-center gap-3">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Knowledge Base</span>
        </div>
        <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${isKnowledgeOpen ? 'rotate-90' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="py-3 px-3">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Reference materials the agent can access</p>
          </div>
          <div className="space-y-2">
            {knowledgeItems.length > 0 ? (
              knowledgeItems.map((item) => (
                <KnowledgeItemDisplay key={item.id} item={item} />
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">No knowledge items added yet.</p>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export const KnowledgeSection = memo(KnowledgeSectionComponent);