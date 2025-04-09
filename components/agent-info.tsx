// components/agent-info.tsx
'use client';

import { memo } from 'react'; // Removed useState and other unused imports
import { Agent, Knowledge } from '@/db/schema/agent';

// Import new sub-components
import { AgentHeader } from './agent-header';
import { BehaviourSection } from './behaviour-section';
import { KnowledgeSection } from './knowledge-section';
import { ToolsSection } from './tools-section';
import { SettingsSection } from './settings-section';

interface AgentInfoProps {
  agent: Agent & { modelName?: string };
  isOwner: boolean;
  knowledgeItems: Knowledge[];
  selectedModelId: string;
  setSelectedModelId: React.Dispatch<React.SetStateAction<string>>;
}

// The main component now delegates rendering to sub-components
function AgentInfoComponent({ agent, isOwner, knowledgeItems, selectedModelId, setSelectedModelId }: AgentInfoProps) {
  // Debugging logs can remain if helpful, or be removed
  console.log("AgentInfo - Agent Creator ID:", agent.creatorId);
  console.log("AgentInfo - Received isOwner prop:", isOwner);
  console.log("AgentInfo - Agent Model:", agent);
  console.log("AgentInfo - Primary Model ID:", agent.primaryModelId);
  console.log("AgentInfo - Model Name:", agent.modelName);

  // Removed all useState hooks for collapsible sections

  return (
    <div className="h-full p-4 space-y-6 overflow-y-auto pb-24">
      {/* Render Agent Header */}
      <AgentHeader agent={agent} isOwner={isOwner} />

      {/* Sections Container */}
      <div className="space-y-1">
        {/* Render Behaviour Section */}
        <BehaviourSection initialSystemPrompt={agent.systemPrompt} />

        {/* Render Knowledge Section */}
        <KnowledgeSection knowledgeItems={knowledgeItems} />

        {/* Render Tools Section */}
        <ToolsSection />

        {/* Render Settings Section */}
        <SettingsSection
          selectedModelId={selectedModelId}
          setSelectedModelId={setSelectedModelId}
        />
      </div>
    </div>
  );
}

// Export the memoized component
export const AgentInfo = memo(AgentInfoComponent);
