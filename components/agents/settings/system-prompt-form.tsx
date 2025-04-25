'use client'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Textarea } from '@/components/ui/textarea'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CheckIcon, ChevronRightIcon, EnterFullScreenIcon, ExitFullScreenIcon, InfoCircledIcon } from '@radix-ui/react-icons'
import React, { useEffect, useRef, useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Agent } from '@/db/schema/agent';
import { updateAgentSystemPromptAction } from '@/db/actions/agent.actions';
import { FormSection } from '@/components/form-section'

interface SystemPromptFormProps {
  agent: Agent;
}

const SystemPromptForm = ({ agent }: SystemPromptFormProps) => {
    const [isPending, startTransition] = useTransition();
    const [showExpandToggle, setShowExpandToggle] = useState(false);
    const [isSystemPromptExpanded, setIsSystemPromptExpanded] = useState(false);
    const systemPromptRef = useRef<HTMLTextAreaElement>(null);
    const [currentSystemPrompt, setCurrentSystemPrompt] = useState(agent.systemPrompt || "");
    const [isDirty, setIsDirty] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const initialSystemPrompt = useRef(agent.systemPrompt || "");

    useEffect(() => {
        const newPrompt = agent.systemPrompt || "";
        setCurrentSystemPrompt(newPrompt);
        initialSystemPrompt.current = newPrompt;
        setIsDirty(false);
        adjustSystemPromptHeight();
    }, [agent.systemPrompt]);

    useEffect(() => {
        setIsDirty(currentSystemPrompt !== initialSystemPrompt.current);
    }, [currentSystemPrompt]);

    const adjustSystemPromptHeight = () => {
        const textarea = systemPromptRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    useEffect(() => {
        adjustSystemPromptHeight();
        if (systemPromptRef.current) {
            const text = currentSystemPrompt;
            const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
            setShowExpandToggle(wordCount > 500);
        }
    }, [currentSystemPrompt]);

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCurrentSystemPrompt(event.target.value);
        adjustSystemPromptHeight();
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isDirty || isPending) return;

        startTransition(async () => {
            try {
                const result = await updateAgentSystemPromptAction(agent.id, currentSystemPrompt);
                if (result.success) {
                    initialSystemPrompt.current = currentSystemPrompt;
                    setIsDirty(false);
                    
                    // Show success state
                    setShowSuccess(true);
                    
                    // Reset success state after 3 seconds
                    setTimeout(() => {
                        setShowSuccess(false);
                    }, 3000);
                } else {
                    console.error("Failed to update system prompt:", result.error);
                }
            } catch (error) {
                console.error("An unexpected error occurred:", error);
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <FormSection title="System Prompt" description="Instructions that define how your agent behaves.">
            <div className="space-y-4">
                <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-start gap-1.5">
                        <Label htmlFor="systemPrompt" className="text-sm font-medium flex items-center gap-1.5">
                            System Prompt
                            <span className="text-red-500">*</span>
                        </Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <InfoCircledIcon className="size-3.5 text-muted-foreground mt-0.5" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-[250px]">
                                    <p>Instructions that define how your agent behaves.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900">
                        Required
                    </Badge>
                </div>
                <div className="bg-secondary/50 border rounded-lg p-0.5 relative">
                    {showExpandToggle && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 text-xs h-7 px-2 flex items-center gap-1 z-10"
                            onClick={() => setIsSystemPromptExpanded(prev => !prev)}
                            aria-label={isSystemPromptExpanded ? 'Collapse' : 'Expand'}
                        >
                            {isSystemPromptExpanded ? (
                                <ExitFullScreenIcon />
                            ) : (
                                <EnterFullScreenIcon />
                            )}
                            {isSystemPromptExpanded ? 'Collapse' : 'Expand'}
                        </Button>
                    )}
                    <Textarea
                        id="systemPrompt"
                        name="systemPrompt"
                        placeholder="e.g. You are a friendly assistant! Keep your responses concise and helpful."
                        className={`min-h-[180px] font-mono text-sm leading-relaxed bg-background border-0 focus-visible:ring-1 focus-visible:ring-offset-0 resize-none w-full ${showExpandToggle && !isSystemPromptExpanded ? 'max-h-[300px] overflow-y-auto' : ''}`}
                        required
                        ref={systemPromptRef}
                        value={currentSystemPrompt}
                        onChange={handleInputChange}
                        onInput={adjustSystemPromptHeight}
                    />
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border text-sm">
                    <h3 className="font-medium mb-2 text-primary flex items-center gap-2">
                        <ChevronRightIcon className="size-4" />
                        Tips for effective system prompts:
                    </h3>
                    <ul className="list-disc list-inside space-y-1.5 pl-1 text-muted-foreground">
                        <li>Define the agent&apos;s role clearly (e.g., &quot;You are a math tutor&quot;)</li>
                        <li>Specify tone and style (formal, casual, technical)</li>
                        <li>Set response length preferences (concise, detailed)</li>
                        <li>Include any domain-specific knowledge</li>
                    </ul>
                </div>
            </div>

            <div className="flex justify-end mt-4">
                <Button
                    type="submit"
                    disabled={!isDirty || isPending}
                    className={showSuccess ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                >
                    {isPending ? 'Saving...' : 
                     showSuccess ? (
                        <span className="flex items-center gap-1">
                            <CheckIcon className="size-4" />
                            Saved
                        </span>
                     ) : 'Save Changes'}
                </Button>
            </div>
            </FormSection>
        </form>
    )
}

export default SystemPromptForm
