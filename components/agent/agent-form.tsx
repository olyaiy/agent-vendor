"use client";

import React from "react";
import { BasicInfoCardSection } from "./form-sections/basic-info-card-section";
import { ModelsSection } from "./form-sections/models-section";
import { SettingsSection } from "./form-sections/settings-section";
import { ToolGroupsSection } from "./form-sections/tool-groups-section";
import { TagsCardSection } from "./form-sections/tags-card-section";
import { SystemPromptCardSection } from "./form-sections/system-prompt-card-section";
import { WelcomeScreenCardSection } from "./form-sections/welcome-screen-card-section";
import { PromptSuggestionsSection } from "./form-sections/prompt-suggestions-section";
import { KnowledgeSection } from "./form-sections/knowledge-section";
import { FormFooter } from "./form-sections/form-footer";
import { useAgentForm } from "./hooks/use-agent-form";
import { ModelInfo } from "./model-selector-section";
import { ToolGroupInfo } from "./tool-group-selector";
import { Separator } from "@radix-ui/react-separator";

// Interface definitions
interface TagInfo {
  id: string;
  name: string;
}

interface KnowledgeItem {
  id: string;
  title: string;
  content: any;
  type: string;
  description: string | null;
  agentId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface AgentFormProps {
  mode: "create" | "edit";
  userId?: string;
  models: ModelInfo[];
  toolGroups: ToolGroupInfo[];
  tags: TagInfo[];
  knowledgeItems?: KnowledgeItem[];
  initialData?: {
    id: string;
    agentDisplayName: string;
    systemPrompt: string;
    description?: string;
    modelId: string;
    visibility: "public" | "private" | "link";
    thumbnailUrl?: string | null;
    alternateModelIds?: string[];
    toolGroupIds?: string[];
    tagIds?: string[];
    customization?: {
      overview: {
        title: string;
        content: string;
        showPoints: boolean;
        points: string[];
      };
      style: {
        colorSchemeId: string;
      };
    };
  };
}

export default function AgentForm(props: AgentFormProps) {
  // Use the custom hook to get all state and handlers
  const form = useAgentForm(props);

  // Default model settings
  const [modelSettings, setModelSettings] = React.useState({
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    presencePenalty: 0,
    frequencyPenalty: 0
  });

  // Handler for model settings changes
  const handleSettingsChange = (key: string, value: number) => {
    setModelSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <form onSubmit={form.handleSubmit} className="space-y-8 mx-auto overflow-hidden px-16">
      {/* Basic Information Section */}
      <BasicInfoCardSection
        mode={props.mode}
        initialData={props.initialData}
        thumbnailUrl={form.thumbnailUrl}
        setThumbnailUrl={form.setThumbnailUrl}
        isPending={form.isPending}
        handleFormValueChange={form.handleFormValueChange as any}
        handleDeleteAgent={form.handleDeleteAgent}
        primaryModelId={form.primaryModelId}
      />

      {/* AI Models Section */}
      <ModelsSection
        models={props.models}
        primaryModelId={form.primaryModelId}
        alternateModelIds={form.alternateModelIds}
        onPrimaryModelChange={form.setPrimaryModelId}
        onAlternateModelsChange={form.setAlternateModelIds}
      />

      <div className="pt-4 border-t border-border/50">
        <Separator />
      </div>

      {/* Model Settings Section */}
      <SettingsSection
        settings={modelSettings}
        onSettingsChange={handleSettingsChange}
      />

      <div className="pt-4 border-t border-border/50">
        <Separator />
      </div>

        {/* System Prompt Section */}
        <SystemPromptCardSection
        mode={props.mode}
        initialData={props.initialData}
        systemPromptRef={form.systemPromptRef as any}
        adjustSystemPromptHeight={form.adjustSystemPromptHeight}
        handleFormValueChange={form.handleFormValueChange as any}
      />

<div className="pt-4 border-t border-border/50">
        <Separator />
      </div>

      {/* Tool Groups Section */}
      <ToolGroupsSection
        toolGroups={props.toolGroups}
        selectedToolGroupIds={form.selectedToolGroupIds}
        onChange={form.setSelectedToolGroupIds}
      />


      <div className="pt-4 border-t border-border/50">
        <Separator />
      </div>


        {/* Knowledge Base Section */}
        <KnowledgeSection
        knowledgeItems={form.displayKnowledgeItems}
        agentId={props.initialData?.id}
        onAddItem={form.handleAddKnowledgeItem}
        onUpdateItem={form.handleUpdateKnowledgeItem}
        onDeleteItem={form.handleDeleteKnowledgeItem}
      />

      <div className="pt-4 border-t border-border/50">
        <Separator />
      </div>

      {/* Tags Section */}
      <TagsCardSection
        tags={props.tags}
        selectedTags={form.selectedTags}
        setSelectedTags={form.setSelectedTags}
      />


      <div className="pt-4 border-t border-border/50">
        <Separator />
      </div>

      {/* Welcome Screen Customization */}
      <WelcomeScreenCardSection
        overview={form.overviewCustomization}
        onChange={form.setOverviewCustomization}
      />


      <div className="pt-4 border-t border-border/50">
        <Separator />
      </div>


      {/* Prompt Suggestions */}
      <PromptSuggestionsSection
        agentId={props.initialData?.id}
        onChange={form.setSuggestedPrompts}
        formValues={form.formValues}
      />

    

      {/* Form Footer */}
      <FormFooter
        mode={props.mode}
        isPending={form.isPending}
        primaryModelId={form.primaryModelId}
      />
      
      <input type="hidden" name="userId" value={props.userId || ''} />
    </form>
  );
} 