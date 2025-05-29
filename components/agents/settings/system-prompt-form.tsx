'use client'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Textarea } from '@/components/ui/textarea'
import { CheckIcon, ChevronRightIcon, EnterFullScreenIcon, ExitFullScreenIcon, InfoCircledIcon, Cross2Icon, MagicWandIcon, ReloadIcon } from '@radix-ui/react-icons'
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


    const [isImproving, setIsImproving] = useState(false);
    const [showImprovementActions, setShowImprovementActions] = useState(false);
    const [promptBeforeImprovement, setPromptBeforeImprovement] = useState("");
    const [improvementError, setImprovementError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [customImproveInstructions, setCustomImproveInstructions] = useState("Create a comprehensive and effective system prompt:");
    
    // Preset improvement instructions
    const improvePresets = [
        { label: "✂️ More concise", value: "Make this prompt more concise while maintaining all key instructions. Reduce verbosity and redundancy." },
        { label: "🔍 Add examples", value: "Enhance this prompt with 2-3 clear, specific examples that demonstrate the expected behavior and outputs." },
        { label: "🧠 More precise", value: "Make this prompt more precise and specific. Clarify ambiguous instructions and add necessary constraints." },
        { label: "🌟 More creative", value: "Make this prompt encourage more creative and diverse responses while maintaining the core requirements." },
    ];

    useEffect(() => {
        const newPrompt = agent.systemPrompt || "";
        setCurrentSystemPrompt(newPrompt);
        initialSystemPrompt.current = newPrompt;
        setIsDirty(false);
        setShowImprovementActions(false);
        setImprovementError(null);
        setCustomImproveInstructions("Create a comprehensive and effective system prompt:");
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
        if (isImproving || isPending) return;

        setIsImproving(true);
        setShowImprovementActions(false);
        setImprovementError(null);
        setPromptBeforeImprovement(currentSystemPrompt);
        
        let accumulatedStream = "";
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
            // If no prompt exists, send a request to generate a new one
            const promptToImprove = currentSystemPrompt.trim() || "Generate a comprehensive system prompt for an AI assistant.";
            
            const response = await fetch('/api/improve-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: promptToImprove,
                    customInstructions: customImproveInstructions 
                }),
                signal,
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
            if (error instanceof Error && error.name === 'AbortError') {
                console.log("Prompt improvement stopped by user.");
                setCurrentSystemPrompt(promptBeforeImprovement); // Revert to original or keep partial
                setImprovementError("Prompt improvement was cancelled.");
            } else {
                console.error("Improvement error:", error);
                setImprovementError(error instanceof Error ? error.message : String(error));
                setCurrentSystemPrompt(promptBeforeImprovement); 
            }
            adjustSystemPromptHeight();
        } finally {
            setIsImproving(false);
            abortControllerRef.current = null;
        }
    };

    const handleKeepImprovement = () => {
        setShowImprovementActions(false);
        setImprovementError(null);
        initialSystemPrompt.current = promptBeforeImprovement; 
        setIsDirty(true); 
        adjustSystemPromptHeight();
    };

    const handleStopImproving = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    const handleGoBackFromImprovement = () => {
        setCurrentSystemPrompt(promptBeforeImprovement);
        setShowImprovementActions(false);
        setImprovementError(null);
        adjustSystemPromptHeight();
    };

    const applyPreset = (preset: string) => {
        setCustomImproveInstructions(preset);
    };

    useEffect(() => {
        // Add the custom animation style for textarea pulsing
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes textarea-pulse {
                0%, 100% {
                    border-color: rgb(129, 140, 248, 0.5);
                    box-shadow: 0 0 5px rgba(99, 102, 241, 0.2);
                }
                50% {
                    border-color: rgb(99, 102, 241, 1);
                    box-shadow: 0 0 12px rgba(99, 102, 241, 0.6);
                }
            }
            
            .animate-textarea-pulse {
                border-width: 2px;
                border-color: rgb(129, 140, 248, 0.5);
                animation: textarea-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            
            .dark .animate-textarea-pulse {
                border-color: rgb(129, 140, 248, 0.3);
                box-shadow: 0 0 5px rgba(99, 102, 241, 0.2);
            }
            
            .dark .animate-textarea-pulse {
                animation: textarea-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
        `;
        document.head.appendChild(style);
        
        // Clean up
        return () => {
            document.head.removeChild(style);
        };
    }, []);

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
                <div className={`bg-secondary/50 border rounded-lg p-0.5 relative ${isImproving ? 'animate-textarea-pulse' : ''}`}>
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
                    <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-md flex items-start gap-2 mt-2 text-sm border border-red-200 dark:border-red-900">
                        <Cross2Icon className="size-4 mt-0.5 flex-shrink-0" />
                        <p>{improvementError}</p>
                    </div>
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
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    onClick={handleImprovePrompt}
                                    disabled={isPending || isImproving || showSuccess || !customImproveInstructions.trim()}
                                    className="bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-indigo-950/40 dark:to-sky-950/40 border-indigo-200 dark:border-indigo-900 hover:border-indigo-300 dark:hover:border-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5"
                                >
                                    {isImproving ? (
                                        <span className="flex items-center gap-1.5">
                                            <ReloadIcon className="size-4 animate-spin" />
                                            {currentSystemPrompt.trim() ? 'Enhancing...' : 'Writing...'}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5">
                                            <MagicWandIcon className="size-4" />
                                            {currentSystemPrompt.trim() ? 'Enhance Prompt' : 'Write Prompt'}
                                        </span>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent 
                                side="top"
                                align="end"
                                className="p-0 bg-gradient-to-r from-indigo-50/20 to-sky-50/20 dark:from-indigo-950/20 dark:to-sky-950/20 border-none shadow-xl rounded-xl w-80 z-50 backdrop-blur-sm [&>svg]:hidden overflow-hidden"
                                sideOffset={10}
                                forceMount
                            >
                                <div className="p-4 space-y-4 relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 to-sky-100/30 dark:from-indigo-900/20 dark:to-sky-900/30 rounded-xl pointer-events-none" aria-hidden="true"></div>
                                    
                                    {/* Custom arrow */}
                                    <div className="absolute -bottom-2 right-4 w-4 h-4 rotate-45 bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-950 dark:to-sky-950 shadow-sm"></div>
                                    
                                    <div className="flex justify-between items-center relative">
                                        <Label htmlFor="customImproveInstructions" className="text-sm font-medium text-white flex items-center gap-1.5">
                                            <MagicWandIcon className="size-3.5" />
                                            {currentSystemPrompt.trim() ? 'Enhancement Options' : 'Prompt Writing Options'}
                                        </Label>
                                        <Button 
                                            variant="default" 
                                            size="sm" 
                                            className="h-7 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-full" 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleImprovePrompt();
                                            }}
                                            disabled={isImproving || !customImproveInstructions.trim()}
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 relative">
                                        {improvePresets.map((preset, index) => (
                                            <Button 
                                                key={index}
                                                type="button" 
                                                variant="outline" 
                                                size="sm"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    applyPreset(preset.value);
                                                }}
                                                className="text-xs py-1 h-8 border-indigo-200/70 dark:border-indigo-800/50 bg-white/90 dark:bg-slate-900/80 text-white hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-lg shadow-sm transition-colors duration-150"
                                            >
                                                {preset.label}
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="mb-2 rounded-lg overflow-hidden ring-1 ring-indigo-200/50 dark:ring-indigo-800/30 shadow-sm">
                                        <Textarea
                                            id="customImproveInstructions"
                                            value={customImproveInstructions}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                setCustomImproveInstructions(e.target.value);
                                            }}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onPointerDown={(e) => e.stopPropagation()}
                                            placeholder="e.g., Focus on making it more concise and add examples."
                                            className="min-h-[80px] text-xs resize-none border-0 rounded-lg w-full 
                                            bg-white/90 dark:bg-slate-900/90 text-white placeholder:text-white 
                                            focus-visible:ring-1 focus-visible:ring-indigo-300 dark:focus-visible:ring-indigo-700 
                                            focus-visible:ring-offset-0"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}

                {showImprovementActions && (
                    <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900 p-2 pl-3 pr-1 rounded-lg">
                        <div className="text-sm text-green-700 dark:text-green-400 flex items-center gap-1.5">
                            <CheckIcon className="size-4" />
                            <span>Prompt enhanced successfully!</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                onClick={handleKeepImprovement}
                                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5"
                                size="sm"
                            >
                                <CheckIcon className="size-3.5" />
                                Keep Changes
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleGoBackFromImprovement}
                                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center gap-1.5"
                            >
                                <Cross2Icon className="size-3.5" />
                                Revert
                            </Button>
                        </div>
                    </div>
                )}
                {isImproving && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleStopImproving}
                        className="border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300 dark:hover:border-red-800 flex items-center gap-1.5"
                    >
                        <Cross2Icon className="size-4" />
                        Stop
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={!isDirty || isPending || isImproving || showImprovementActions || showSuccess}
                    className={`${showSuccess ? "bg-green-600 hover:bg-green-700 text-white" : ""} ${(isImproving || showImprovementActions) ? "opacity-40 cursor-not-allowed" : ""}`}
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
