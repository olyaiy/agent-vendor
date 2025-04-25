// components/agent-info.tsx
'use client';

import { memo } from 'react'; // Removed useState and other unused imports
import { Agent, Knowledge } from '@/db/schema/agent';
// Removed unused ModelInfo import
import type { AgentSpecificModel } from '@/components/chat'; // Import the new model type

// Import new sub-components
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

import { KnowledgeItemDisplay } from './knowledge-item-display'; // Import the new component
import { modelDetails } from '@/lib/models'; // Removed unused ModelSettings import

interface AgentInfoProps {
  agent: Agent & { modelName?: string; tags: Array<{ id: string; name: string }> };
  isOwner: boolean;
  knowledgeItems: Knowledge[];
  selectedModelId: string;
  setSelectedModelId: React.Dispatch<React.SetStateAction<string>>;
  models: AgentSpecificModel[]; // Use the new AgentSpecificModel type
  chatSettings: Record<string, number>; // Add chatSettings prop
  onSettingChange: (settingName: string, value: number) => void; // Add onSettingChange prop
}

// The main component now delegates rendering to sub-components
function AgentInfoComponent({
  agent,
  isOwner,
  knowledgeItems,
  selectedModelId,
  setSelectedModelId,
  models,
  chatSettings, // Destructure chatSettings
  onSettingChange // Destructure onSettingChange
}: AgentInfoProps) {

  // Removed all useState hooks for collapsible sections

  // Find the model string name and details for the selected model ID using modelId
  const selectedModelInfo = models.find(m => m.modelId === selectedModelId); // Use modelId for lookup
  const selectedModelString = selectedModelInfo?.model; // Get the model string name
  const selectedModelDetail = selectedModelString ? modelDetails[selectedModelString] : undefined;

  return (
    <div className="h-full p-4 space-y-6 overflow-y-auto pb-24">
      {/* Render Agent Header - Pass model props here */}
      <AgentHeader
        agent={agent}
        isOwner={isOwner}
        models={models}
        selectedModelId={selectedModelId}
        setSelectedModelId={setSelectedModelId}
      />

      {/* Sections Container */}
      <div className="space-y-1">
        {/* Render Behaviour Section */}
        <BehaviourSection initialSystemPrompt={agent.systemPrompt} />

        {/* Render Knowledge Section */}
        <KnowledgeSection knowledgeItems={knowledgeItems} />

        {/* Render Tools Section */}
        <ToolsSection />

        {/* Render Settings Section - Pass down new props */}
        <SettingsSection
          // selectedModelString={selectedModelString} // Pass the string identifier
          modelSettings={selectedModelDetail?.defaultSettings} // Pass only the settings object or undefined
          chatSettings={chatSettings}
          onSettingChange={onSettingChange}
        />
      </div>
    </div>
  );
}

// Export the memoized component
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