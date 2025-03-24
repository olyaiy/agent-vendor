"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Plus, MessageSquare, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { getSuggestedPromptsByAgentId, upsertSuggestedPrompts } from "@/app/(agents)/actions";
import { generatePromptSuggestion } from "@/app/(chat)/actions";

interface PromptSuggestionEditorProps {
  agentId?: string;  // Optional for new agents
  initialPrompts?: string[];
  onChange?: (prompts: string[]) => void;
  formValues?: {
    title: string;
    description: string;
    systemPrompt: string;
  };
}

export function PromptSuggestionEditor({ 
  agentId, 
  initialPrompts,
  onChange,
  formValues 
}: PromptSuggestionEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompts, setPrompts] = useState<string[]>(initialPrompts || [
    "What can you help me with?",
    "Tell me about yourself",
    "What features do you have?",
    "How do I get started?"
  ]);
  
  // Load initial prompts if not provided and we have an agentId
  useEffect(() => {
    if (!initialPrompts && agentId) {
      const loadPrompts = async () => {
        setIsLoading(true);
        try {
          const loadedPrompts = await getSuggestedPromptsByAgentId(agentId);
          setPrompts(loadedPrompts);
          onChange?.(loadedPrompts);
        } catch (error) {
          console.error("Failed to load suggested prompts:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadPrompts();
    }
  }, [agentId, initialPrompts, onChange]);

  // Add new prompt
  const handleAddPrompt = useCallback(() => {
    if (prompts.length >= 4) {
      toast.warning("Maximum 4 prompts allowed");
      return;
    }
    
    const newPrompts = [...prompts, ""];
    setPrompts(newPrompts);
    onChange?.(newPrompts);
  }, [prompts, onChange]);

  // Update prompt at index
  const handlePromptChange = useCallback((index: number, value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    setPrompts(newPrompts);
    onChange?.(newPrompts);
  }, [prompts, onChange]);

  // Remove prompt at index
  const handleRemovePrompt = useCallback((index: number) => {
    const newPrompts = prompts.filter((_, i) => i !== index);
    setPrompts(newPrompts);
    onChange?.(newPrompts);
  }, [prompts, onChange]);

  // Save prompts to the database
  const handleSavePrompts = useCallback(async () => {
    if (!agentId) return;
    
    setIsSaving(true);
    try {
      await upsertSuggestedPrompts(agentId, prompts.filter(p => p.trim() !== ""));
      toast.success("Suggested prompts saved");
    } catch (error) {
      console.error("Failed to save suggested prompts:", error);
      toast.error("Failed to save suggested prompts");
    } finally {
      setIsSaving(false);
    }
  }, [agentId, prompts]);

  const handleTestPromptSuggestion = async () => {
    if (!formValues?.title) {
      toast.error('Please enter an agent name first');
      return;
    }

    // Calculate available slots (max 4 - current valid prompts)
    const validPrompts = prompts.filter(p => p.trim() !== "");
    const availableSlots = Math.max(0, 4 - validPrompts.length);

    if (availableSlots === 0) {
      toast.warning('No slots available. Remove some prompts first.');
      return;
    }

    setIsGenerating(true);
    try {
      const suggestions = await generatePromptSuggestion({
        title: formValues.title,
        description: formValues.description,
        count: availableSlots,
        existingPrompts: validPrompts
      });
      

      // Add new suggestions to existing prompts
      const newPrompts = [...prompts];
      suggestions.forEach(suggestion => {
        if (newPrompts.length < 4) {
          newPrompts.push(suggestion);
        }
      });
      
      setPrompts(newPrompts);
      onChange?.(newPrompts);
      toast.success(`Generated ${suggestions.length} new suggestions!`);
      
    } catch (error) {
      console.error('Error generating prompt suggestions:', error);
      toast.error('Failed to generate prompt suggestions');
    } finally {
      setIsGenerating(false);
    }
  };

  // Preview of how the prompts will appear in chat
  const renderPromptPreview = () => {
    const validPrompts = prompts.filter(p => p.trim() !== "");
    
    if (validPrompts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-center p-4">
          <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
          <p>Add some suggested prompts to see a preview</p>
        </div>
      );
    }
    
    return (
      <div className="grid sm:grid-cols-2 gap-2 w-full">
        {validPrompts.map((prompt, index) => {
          const words = prompt.split(' ');
          const boldPart = words.slice(0, 3).join(' ');
          const regularPart = words.slice(3).join(' ');
          
          return (
            <div
              key={index}
              className={index > 1 ? 'hidden sm:block' : 'block'}
            >
              <div className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 flex flex-col w-full h-24 justify-start items-start bg-card hover:bg-accent/50 transition-colors">
                <span className="font-medium">{boldPart}</span>
                {regularPart && (
                  <span className="text-muted-foreground mt-1">
                    {regularPart}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleTestPromptSuggestion}
                disabled={isGenerating || !formValues?.title}
                className="relative group transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-2">
                  {isGenerating ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="size-3.5 group-hover:scale-110 transition-transform" />
                      <span>Generate Ideas</span>
                    </>
                  )}
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Generate AI-powered prompt suggestions based on your agent&apos;s description</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-3">
            {prompts.map((prompt, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    value={prompt}
                    onChange={(e) => handlePromptChange(index, e.target.value)}
                    placeholder="Enter a suggested prompt..."
                    className="w-full"
                    maxLength={100}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePrompt(index)}
                  className="size-10 rounded-full hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPrompt}
                disabled={prompts.length >= 4}
                className="flex items-center gap-1"
              >
                <Plus className="size-4" />
                <span>Add Prompt</span>
              </Button>
              
              <Badge variant="outline" className="text-xs">
                {prompts.filter(p => p.trim() !== "").length}/4 Prompts
              </Badge>
            </div>
            
            {agentId && (
              <Button
                type="button" 
                variant="outline"
                size="sm"
                onClick={handleSavePrompts}
                disabled={isSaving}
                className="w-fit"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Prompts"}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Preview</Label>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {renderPromptPreview()}
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground">
              This is how your suggested prompts will appear to users.
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 