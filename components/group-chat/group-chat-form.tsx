"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Users, CheckIcon, SearchIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Minimal Agent type based on getAgents return type
interface MinimalAgent {
  id: string;
  agent_display_name: string;
  thumbnail_url: string | null;
  description: string | null;
  creatorId: string | null;
  tags?: { name: string }[] | null;
  toolGroups?: { display_name: string }[] | null;
}

interface GroupChatFormProps {
  userId: string;
  agents: MinimalAgent[];
}

export default function GroupChatForm({ userId, agents }: GroupChatFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination state
  const itemsPerPage = 9; // Show 9 agents per page (3x3 grid on desktop)
  const [currentPage, setCurrentPage] = useState(1);

  // Handle agent selection/deselection
  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  };

  // Filter agents based on search query
  const filteredAgents = useMemo(() => {
    return agents.filter(agent =>
      agent.agent_display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.description && agent.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [agents, searchQuery]);

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / itemsPerPage));
  
  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Get current page of agents
  const currentAgents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAgents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAgents, currentPage, itemsPerPage]);

  // Handle pagination
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  // Placeholder for future submit handler
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted (no action)");
    console.log("Selected Agent IDs:", Array.from(selectedAgentIds));
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      <div className="space-y-12 pb-10 pt-8">
        {/* Basic Info Section */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-4">
            <div className="pb-2 border-b">
              <h2 className="text-lg font-medium tracking-tight">Group Details</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Basic information for your group chat.
              </p>
            </div>
          </div>

          <div className="md:col-span-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-start gap-1.5">
                  <Label htmlFor="groupChatName" className="text-sm font-medium flex items-center gap-1.5">
                    Group Chat Name
                    <span className="text-red-500">*</span>
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="size-3.5 text-muted-foreground mt-0.5" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[250px]">
                        <p>The name of your group chat as displayed to participants.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900">
                  Required
                </Badge>
              </div>
              <Input
                id="groupChatName"
                name="groupChatName"
                required
                placeholder="Enter a name for the group chat"
                className="h-11"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-1.5 mb-1.5">
                <Label htmlFor="description" className="text-sm font-medium flex items-center gap-1.5">
                  Description
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle className="size-3.5 text-muted-foreground mt-0.5" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[250px]">
                      <p>A brief description of the group chat's purpose.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the purpose of this group chat"
                className="min-h-24 resize-none"
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* Agent Selection Section */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4">
            <div className="sticky top-4 space-y-4">
              <div className="pb-2 border-b">
                <h2 className="text-lg font-medium tracking-tight">Participants</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Select the agents to include in this chat.
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Choose at least one agent to participate in the group chat.
              </p>

              {/* Summary of selected agents */}
              {selectedAgentIds.size > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium mb-2">Selected Agents</h3>
                  <div className="space-y-2.5">
                    {Array.from(selectedAgentIds).map(id => {
                      const agent = agents.find(a => a.id === id);
                      if (!agent) return null;
                      return (
                        <div key={id} className="flex items-center justify-between gap-2 text-sm">
                          <div className="flex items-center gap-2 truncate">
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              <AvatarImage src={agent.thumbnail_url ?? undefined} alt={agent.agent_display_name} />
                              <AvatarFallback className="text-xs">
                                {agent.agent_display_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{agent.agent_display_name}</span>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0" 
                            onClick={() => handleSelectAgent(id)}
                          >
                            <span className="sr-only">Remove {agent.agent_display_name}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" className="h-3 w-3 fill-muted-foreground hover:fill-foreground">
                              <path d="M6 5.1L9.1.8c.3-.3.7-.3 1 0 .3.3.3.7 0 1L7 6l3.2 3.2c.3.3.3.7 0 1-.1.1-.3.2-.5.2s-.4-.1-.5-.2L6 7l-3.1 4.2c-.1.1-.3.2-.5.2s-.4-.1-.5-.2c-.3-.3-.3-.7 0-1L5 6 .8 2.9c-.3-.3-.3-.7 0-1 .3-.3.7-.3 1 0L6 5.1z"/>
                            </svg>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  className="pl-10 h-11"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Badge
                variant={selectedAgentIds.size > 0 ? "default" : "outline"}
                className="cursor-default transition-colors h-7 w-fit shrink-0"
              >
                {selectedAgentIds.size} of {agents.length} selected
              </Badge>
            </div>

            <div className="bg-secondary/50 border rounded-lg p-4">
              {/* Agent grid with fixed height */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 min-h-[450px]">
                {currentAgents.length > 0 ? (
                  currentAgents.map((agent) => {
                    const isSelected = selectedAgentIds.has(agent.id);
                    return (
                      <div
                        key={agent.id}
                        onClick={() => handleSelectAgent(agent.id)}
                        className={cn(
                          "relative border rounded-lg p-4 cursor-pointer transition-all duration-200",
                          "flex flex-col justify-between h-[150px]", // Increased height to prevent overflow
                          isSelected
                            ? "bg-background border-primary/30 ring-1 ring-primary/20"
                            : "hover:bg-background/80"
                        )}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <CheckIcon className="size-4 text-primary" />
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8 mt-0.5 flex-shrink-0">
                            <AvatarImage src={agent.thumbnail_url ?? undefined} alt={agent.agent_display_name} />
                            <AvatarFallback className="text-sm">
                              {agent.agent_display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium pr-6 text-xs sm:text-sm leading-snug line-clamp-2 break-words">
                              {agent.agent_display_name}
                            </h3>
                            {agent.description && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 cursor-help overflow-hidden text-ellipsis">
                                      {agent.description}
                                    </p>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" align="start" className="max-w-[260px] sm:max-w-[300px]">
                                    {agent.description}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                        
                        {/* Tags display (optional) */}
                        {agent.tags && agent.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2 overflow-hidden max-h-[22px]">
                            {agent.tags.slice(0, 2).map(tag => (
                              <span key={tag.name} className="inline-flex text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground truncate max-w-[80px]">
                                {tag.name}
                              </span>
                            ))}
                            {agent.tags.length > 2 && (
                              <span className="inline-flex text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                                +{agent.tags.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center p-6 border border-dashed rounded-lg text-muted-foreground">
                    No agents match your search criteria
                  </div>
                )}
              </div>
              
              {/* Pagination controls */}
              {filteredAgents.length > itemsPerPage && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className="h-8 px-2.5"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2.5"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              {selectedAgentIds.size === 0
                ? "Select at least one agent to start the group chat."
                : `${selectedAgentIds.size} agent${selectedAgentIds.size === 1 ? "" : "s"} selected.`}
            </p>
          </div>
        </section>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between py-5 border-t mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="w-28"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending || selectedAgentIds.size === 0}
          className="w-48 gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Users className="size-4" />
              Create Group Chat
            </>
          )}
        </Button>
      </div>
      <input type="hidden" name="userId" value={userId || ''} />
    </form>
  );
} 