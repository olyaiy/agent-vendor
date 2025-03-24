"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getDefaultColorScheme } from "@/lib/colors";
import { 
  updateAgent, 
  createAgent, 
  deleteAgent, 
  upsertSuggestedPrompts, 
  createKnowledgeItem, 
  updateKnowledgeItem, 
  deleteKnowledgeItem 
} from "@/app/(agents)/actions";
import { ModelInfo } from "../model-selector-section";
import { ToolGroupInfo } from "../tool-group-selector";

// Type definitions
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

interface AgentFormData {
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

export function useAgentForm({
  mode,
  userId,
  models,
  toolGroups,
  tags,
  knowledgeItems = [],
  initialData
}: AgentFormData) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Form state
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(initialData?.thumbnailUrl || null);
  const [primaryModelId, setPrimaryModelId] = useState<string>(initialData?.modelId || "");
  const [alternateModelIds, setAlternateModelIds] = useState<string[]>(initialData?.alternateModelIds || []);
  const [selectedToolGroupIds, setSelectedToolGroupIds] = useState<string[]>(initialData?.toolGroupIds || []);
  const [selectedTags, setSelectedTags] = useState<TagInfo[]>(
    initialData?.tagIds 
      ? initialData.tagIds.map(id => {
          const tag = tags.find(t => t.id === id);
          return tag ? tag : { id, name: "Unknown Tag" };
        })
      : []
  );
  const [colorSchemeId, setColorSchemeId] = useState<string>(
    initialData?.customization?.style?.colorSchemeId || getDefaultColorScheme().id
  );
  const [overviewCustomization, setOverviewCustomization] = useState({
    title: initialData?.customization?.overview?.title || "Welcome to your AI assistant!",
    content: initialData?.customization?.overview?.content || "I'm here to help answer your questions and provide information. Feel free to ask me anything.",
    showPoints: initialData?.customization?.overview?.showPoints || false,
    points: initialData?.customization?.overview?.points || []
  });
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  
  // Temporary knowledge items for create mode
  const [tempKnowledgeItems, setTempKnowledgeItems] = useState<Array<{
    id?: string;
    title: string;
    content: any;
    description?: string;
    type?: string;
  }>>([]);
  
  // Refs
  const systemPromptRef = useRef<HTMLTextAreaElement>(null);
  
  // Form values for prompt generation
  const [formValues, setFormValues] = useState({
    title: initialData?.agentDisplayName || '',
    description: initialData?.description || '',
    systemPrompt: initialData?.systemPrompt || ''
  });

  // Update form values when inputs change
  const handleFormValueChange = (field: "title" | "description" | "systemPrompt", value: string) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // System prompt height adjustment
  const adjustSystemPromptHeight = () => {
    if (systemPromptRef.current) {
      systemPromptRef.current.style.height = 'auto';
      systemPromptRef.current.style.height = `${systemPromptRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (systemPromptRef.current && initialData?.systemPrompt) {
      adjustSystemPromptHeight();
    }
  }, [initialData?.systemPrompt]);

  useEffect(() => {
    if (thumbnailUrl) {
      console.log('Avatar URL exists:', thumbnailUrl);
    } else {
      console.log('No avatar URL exists');
    }
  }, [thumbnailUrl]);

  // Knowledge item handlers
  const handleAddKnowledgeItem = async (item: { title: string; content: any; description?: string; type?: string }) => {
    if (mode === "edit" && initialData?.id) {
      return createKnowledgeItem({
        ...item,
        agentId: initialData.id
      });
    } else if (mode === "create") {
      // In create mode, store the item in state temporarily
      const tempId = `temp-${Date.now()}`;
      const newItem = {
        ...item,
        id: tempId,
        agentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        type: item.type || 'text'
      };
      
      setTempKnowledgeItems(prev => [...prev, {...item, id: tempId}]);
      
      // Return a promise that resolves with a temporary item for UI consistency
      return Promise.resolve({
        id: newItem.id,
        title: newItem.title,
        content: newItem.content,
        type: newItem.type,
        description: newItem.description || null,
        agentId: null,
        createdAt: newItem.createdAt,
        updatedAt: newItem.updatedAt
      });
    }
    
    return Promise.reject("Cannot add knowledge item - missing agent ID");
  };

  const handleUpdateKnowledgeItem = async (item: { id: string; title?: string; content?: any; description?: string }) => {
    if (mode === "edit") {
      return updateKnowledgeItem(item);
    } else if (mode === "create") {
      // For items not yet saved to database, update in local state
      if (item.id.startsWith('temp-')) {
        setTempKnowledgeItems(prev => prev.map(tempItem => {
          if (tempItem.id === item.id) {
            return { ...tempItem, ...item };
          }
          return tempItem;
        }));
        
        // Return a promise that resolves with the updated item for UI consistency
        const updatedItem: KnowledgeItem = {
          id: item.id,
          title: item.title || '', 
          content: item.content || '',
          type: 'text', 
          description: item.description || null,
          agentId: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        return Promise.resolve(updatedItem);
      }
    }
    
    return Promise.reject("Cannot update knowledge item");
  };

  const handleDeleteKnowledgeItem = async (id: string) => {
    if (mode === "edit") {
      return deleteKnowledgeItem(id);
    } else if (mode === "create") {
      // For items not yet saved to database, remove from local state
      if (id.startsWith('temp-')) {
        setTempKnowledgeItems(prev => prev.filter(item => item.id !== id));
        return Promise.resolve({ success: true });
      }
    }
    
    return Promise.reject("Cannot delete knowledge item");
  };

  // Delete agent handler
  const handleDeleteAgent = () => {
    if (mode !== "edit" || !initialData?.id) return;
    
    if (confirm("Are you sure you want to delete this agent? This action cannot be undone.")) {
      startTransition(async () => {
        try {
          await deleteAgent(initialData.id);
          toast.success('Agent deleted successfully');
          router.push('/');
        } catch (error) {
          toast.error('Failed to delete agent. Please try again.');
        }
      });
    }
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        // Basic agent data
        const baseData = {
          agentDisplayName: formData.get("agentDisplayName") as string,
          systemPrompt: formData.get("systemPrompt") as string,
          description: formData.get("description") as string || undefined,
          modelId: primaryModelId,
          visibility: formData.get("visibility") as "public" | "private" | "link",
          creatorId: formData.get("userId") as string,
          thumbnailUrl: thumbnailUrl,
          alternateModelIds: alternateModelIds,
          toolGroupIds: selectedToolGroupIds,
          tagIds: selectedTags.map(tag => tag.id),
          customization: {
            overview: overviewCustomization,
            style: {
              colorSchemeId: colorSchemeId,
            }
          },
          suggestedPrompts: suggestedPrompts.filter(p => p.trim() !== "")
        };

        if (mode === "edit") {
          await updateAgent({ ...baseData, id: initialData!.id });
          
          // If we have an id, also save the suggested prompts
          if (initialData?.id) {
            await upsertSuggestedPrompts(initialData.id, suggestedPrompts.filter(p => p.trim() !== ""));
          }
          
          toast.success("Agent updated successfully");
        } else {
          const result = await createAgent(baseData) as { id: string };
          
          // If we have a new agent id, save the suggested prompts
          if (result?.id) {
            await upsertSuggestedPrompts(result.id, suggestedPrompts.filter(p => p.trim() !== ""));
            
            // Create any temporary knowledge items
            if (tempKnowledgeItems.length > 0) {
              const knowledgePromises = tempKnowledgeItems.map(item => 
                createKnowledgeItem({
                  ...item,
                  agentId: result.id
                })
              );
              
              await Promise.all(knowledgePromises);
            }
          }
          
          toast.success("Agent created successfully");
          router.push("/");
        }
      } catch (error) {
        const action = mode === "create" ? "create" : "update";
        toast.error(`Failed to ${action} agent. Please try again.`);
      }
    });
  };

  // Calculate knowledge items to display based on mode
  const displayKnowledgeItems = mode === "edit" 
    ? knowledgeItems 
    : tempKnowledgeItems.map((item, index) => ({
        id: item.id || `temp-${index}`,
        title: item.title,
        content: item.content,
        type: item.type || 'text',
        description: item.description || null,
        agentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

  return {
    // State
    isPending,
    thumbnailUrl,
    primaryModelId,
    alternateModelIds,
    selectedToolGroupIds,
    selectedTags,
    colorSchemeId,
    overviewCustomization,
    suggestedPrompts,
    formValues,
    systemPromptRef,
    displayKnowledgeItems,

    // State updaters
    setThumbnailUrl,
    setPrimaryModelId,
    setAlternateModelIds,
    setSelectedToolGroupIds,
    setSelectedTags,
    setColorSchemeId,
    setOverviewCustomization,
    setSuggestedPrompts,
    handleFormValueChange,
    
    // Functions
    adjustSystemPromptHeight,
    handleAddKnowledgeItem,
    handleUpdateKnowledgeItem,
    handleDeleteKnowledgeItem,
    handleDeleteAgent,
    handleSubmit,
    
    // Navigation
    router
  };
} 