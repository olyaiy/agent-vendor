'use client'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Textarea } from '@/components/ui/textarea'
// TooltipProvider was already imported, but ensuring it's available for new instance
import { CheckIcon, ChevronRightIcon, EnterFullScreenIcon, ExitFullScreenIcon, InfoCircledIcon, Cross2Icon, MagicWandIcon } from '@radix-ui/react-icons'
import React, { useEffect, useRef, useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Agent } from '@/db/schema/agent';
import { updateAgentSystemPromptAction } from '@/db/actions/agent.actions';
import { FormSection } from '@/components/form-section'
// Import for onPointerDownOutside event type if needed, though often inferred
// import type { PointerDownOutsideEvent } from '@radix-ui/react-dismissable-layer';


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

    const [isImproving, setIsImproving] = useState(false);
    const [showImprovementActions, setShowImprovementActions] = useState(false);
    const [promptBeforeImprovement, setPromptBeforeImprovement] = useState("");
    const [improvementError, setImprovementError] = useState<string | null>(null);

    const [customImproveInstructions, setCustomImproveInstructions] = useState("Please improve the following prompt:");
    const [isImproveTooltipOpen, setIsImproveTooltipOpen] = useState(false);


    useEffect(() => {
        const newPrompt = agent.systemPrompt || "";
        setCurrentSystemPrompt(newPrompt);
        initialSystemPrompt.current = newPrompt;
        setIsDirty(false);
        setShowImprovementActions(false);
        setImprovementError(null);
        setCustomImproveInstructions("Please improve the following prompt:");
        setIsImproveTooltipOpen(false);
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
        if (showImprovementActions) {
            setShowImprovementActions(false);
        }
        setImprovementError(null);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isDirty || isPending || isImproving || showImprovementActions) return;

        startTransition(async () => {
            try {
                const result = await updateAgentSystemPromptAction(agent.id, currentSystemPrompt);
                if (result.success) {
                    initialSystemPrompt.current = currentSystemPrompt;
                    setIsDirty(false);
                    setShowSuccess(true);
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

    const handleImprovePrompt = async () => { 
        if (!currentSystemPrompt.trim() || isImproving || isPending) return;

        setIsImproving(true);
        setShowImprovementActions(false);
        setImprovementError(null);
        setPromptBeforeImprovement(currentSystemPrompt);
        setIsImproveTooltipOpen(false); 
        
        let accumulatedStream = "";

        try {
            const response = await fetch('/api/improve-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: currentSystemPrompt,
                    customInstructions: customImproveInstructions 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to fetch improved prompt.' }));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            if (!response.body) {
                throw new Error('Response body is null.');
            }
            
            setCurrentSystemPrompt(""); 
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true }); 
                accumulatedStream += chunk;
                setCurrentSystemPrompt(accumulatedStream);
                adjustSystemPromptHeight(); 
            }
            
            setShowImprovementActions(true);

        } catch (error) {
            console.error("Improvement error:", error);
            setImprovementError(error instanceof Error ? error.message : String(error));
            setCurrentSystemPrompt(promptBeforeImprovement); 
            adjustSystemPromptHeight();
        } finally {
            setIsImproving(false);
        }
    };

    const handleKeepImprovement = () => {
        setShowImprovementActions(false);
        setImprovementError(null);
        initialSystemPrompt.current = promptBeforeImprovement; 
        setIsDirty(true); 
    };

    const handleGoBackFromImprovement = () => {
        setCurrentSystemPrompt(promptBeforeImprovement);
        setShowImprovementActions(false);
        setImprovementError(null);
        adjustSystemPromptHeight();
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
                        readOnly={isImproving} 
                    />
                </div>

                {improvementError && (
                    <p className="text-sm text-red-600 mt-1">{improvementError}</p>
                )}

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

            <div className="flex justify-end items-center mt-4 space-x-2">
                {!showImprovementActions && (
                    <TooltipProvider delayDuration={0}>
                        <Tooltip open={isImproveTooltipOpen} onOpenChange={setIsImproveTooltipOpen}>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isPending || isImproving || !currentSystemPrompt.trim() || showSuccess}
                                    className="flex items-center gap-1.5"
                                    // Removed onClick here, TooltipTrigger handles opening
                                >
                                    <MagicWandIcon className="size-4" />
                                    {isImproving ? 'Improving...' : 'Improve Prompt'}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent
                                side="top"
                                align="end"
                                className="p-4 bg-background border shadow-lg rounded-md min-w-[380px] w-auto z-[60]"
                                
                                // Removed onInteractOutside as it's not a valid prop
                            >
                                <div className="space-y-3">
                                    <Label htmlFor="customImproveInstructions" className="text-sm font-medium block mb-1.5">
                                        Custom Instructions for AI Improver:
                                    </Label>
                                    <Textarea
                                        id="customImproveInstructions"
                                        value={customImproveInstructions}
                                        onChange={(e) => setCustomImproveInstructions(e.target.value)}
                                        placeholder="e.g., Focus on making it more concise and add examples."
                                        className="min-h-[100px] text-sm p-2 border rounded-md w-full"
                                        rows={4}
                                        onClick={(e) => e.stopPropagation()} // Attempt to keep tooltip open
                                        onMouseDown={(e) => e.stopPropagation()} // Attempt to keep tooltip open
                                        onFocus={(e) => e.stopPropagation()} // Attempt to keep tooltip open
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleImprovePrompt} 
                                        className="w-full mt-2"
                                        disabled={isPending || isImproving || !currentSystemPrompt.trim() || showSuccess || !customImproveInstructions.trim()}
                                    >
                                        {isImproving ? 'Improving...' : 'Improve with these Instructions'}
                                    </Button>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}

                {showImprovementActions && (
                    <>
                        <Button
                            type="button"
                            onClick={handleKeepImprovement}
                            className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-1.5"
                        >
                            <CheckIcon className="size-4" />
                            Keep
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleGoBackFromImprovement}
                            className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-1.5"
                        >
                            <Cross2Icon className="size-4" />
                            Go Back
                        </Button>
                    </>
                )}
                <Button
                    type="submit"
                    disabled={!isDirty || isPending || isImproving || showImprovementActions || showSuccess}
                    className={`${showSuccess ? "bg-green-600 hover:bg-green-700 text-white" : ""} ${isImproving || showImprovementActions ? "opacity-50 cursor-not-allowed" : ""}`}
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
