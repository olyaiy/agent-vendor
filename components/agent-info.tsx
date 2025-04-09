// components/agent-info.tsx
'use client'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog" // Added Dialog components
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button" // Import Button
import Link from "next/link" // Import Link
import { Brain, ChevronRight, Settings, Code, BookOpen, FileText } from "lucide-react" // Removed X icon, Added FileText
import { Pencil2Icon } from "@radix-ui/react-icons"
import { useState } from "react"
import { Agent, Knowledge } from "@/db/schema/agent" // Import Knowledge type
import { AgentImage } from "@/components/agent-image"
import { ModelSelect } from '@/components/model-select'

interface AgentInfoProps {
  agent: Agent & { modelName?: string };
  isOwner: boolean; // Add isOwner prop
  knowledgeItems: Knowledge[]; // Add knowledgeItems prop
}

// Helper function to calculate word count
const countWords = (text: string | null): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
};

export function AgentInfo({ agent, isOwner, knowledgeItems }: AgentInfoProps) { // Destructure knowledgeItems
  // Debugging logs for isOwner
  console.log("AgentInfo - Agent Creator ID:", agent.creatorId);
  console.log("AgentInfo - Received isOwner prop:", isOwner);
  
  // Add console logs for agent model data
  console.log("AgentInfo - Agent Model:", agent);
  console.log("AgentInfo - Primary Model ID:", agent.primaryModelId);
  console.log("AgentInfo - Model Name:", agent.modelName);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isToolsOpen, setIsToolsOpen] = useState(false)
  const [isBehaviourOpen, setIsBehaviourOpen] = useState(true)
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false)
  const [selectedKnowledgeItem, setSelectedKnowledgeItem] = useState<Knowledge | null>(null); // State for dialog

  return (
    <div className="h-full p-4 space-y-6 overflow-y-auto pb-24">
      {/* Replace image section */}
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <AgentImage
          thumbnailUrl={agent.thumbnailUrl || agent.avatarUrl}
          agentId={agent.id}
        />
      </div>

      {/* Left-aligned Content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{agent.name}</h2>
          {isOwner && (
            <Link href={`/${agent.id}/settings`} passHref>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="w-5 h-5 text-muted-foreground hover:text-foreground"
                aria-label="Edit Agent"
              >
                <Pencil2Icon className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {agent.description || "Your AI-powered assistant for code generation, debugging, and documentation."}
        </p>
      </div>

      {/* Categories Section */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        <Badge variant="outline" className="text-xs font-normal">Code</Badge>
        <Badge variant="outline" className="text-xs font-normal">Web</Badge>
        <Badge variant="outline" className="text-xs font-normal">Data</Badge>
        <Badge variant="outline" className="text-xs font-normal">Security</Badge>
        <Badge variant="outline" className="text-xs font-normal">AI</Badge>
        <Badge variant="outline" className="text-xs font-normal">Mobile</Badge>
      </div>

      <Separator className="my-4" />

      {/* Sections Container */}
      <div className="space-y-1">
        {/* Behaviour Section */}
        <Collapsible
          open={isBehaviourOpen}
          onOpenChange={setIsBehaviourOpen}
          className="group"
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 group-hover:bg-muted/30 rounded-md px-3 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Brain className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Behaviour</span>
            </div>
            <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${isBehaviourOpen ? 'rotate-90' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="py-3 px-3">
            <textarea
              className="w-full min-h-[100px] p-3 text-sm border-0 rounded-md bg-muted/30 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              placeholder="Define how the AI assistant should behave..."
              defaultValue={agent.systemPrompt || "You are a helpful, creative, and knowledgeable assistant specialized in software development."}
            />
            <p className="text-xs text-muted-foreground mt-2">Determines the assistant&apos;s personality and behavior</p>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Knowledge Section */}
        <Collapsible
          open={isKnowledgeOpen}
          onOpenChange={setIsKnowledgeOpen}
          className="group"
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 group-hover:bg-muted/30 rounded-md px-3 transition-colors cursor-pointer">
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

              {/* Display actual knowledge items with Dialog */}
              <div className="space-y-2">
                {knowledgeItems.length > 0 ? (
                  knowledgeItems.map((item) => (
                    <Dialog key={item.id} onOpenChange={(open) => !open && setSelectedKnowledgeItem(null)}>
                      <DialogTrigger asChild>
                        <button className="w-full text-left bg-muted/30 p-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer block">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium truncate pr-2" title={item.title}>
                              <FileText className="inline-block w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                              {item.title}
                            </h4>
                            {/* Removed X button */}
                          </div>
                          {/* Display sourceUrl if available */}
                          {item.sourceUrl && (
                            <div className="flex items-center mt-1.5">
                              <Badge variant="secondary" className="text-xs capitalize">
                                {item.sourceUrl.split('.').pop() || 'File'} {/* Simple type detection */}
                              </Badge>
                              <span className="text-xs text-muted-foreground ml-2 max-w-[150px] truncate" title={item.sourceUrl}>
                                {item.sourceUrl}
                              </span>
                            </div>
                          )}
                          {/* Display word count */}
                          <div className="flex justify-end mt-1">
                            <span className="text-[10px] text-muted-foreground">
                              {countWords(item.content).toLocaleString()} words
                            </span>
                          </div>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                        <DialogHeader>
                          <DialogTitle className="truncate pr-10">{item.title}</DialogTitle>
                          {item.sourceUrl && (
                            <DialogDescription>
                              Source: {item.sourceUrl} ({countWords(item.content).toLocaleString()} words)
                            </DialogDescription>
                          )}
                        </DialogHeader>
                        <div className="overflow-y-auto flex-1 pr-2">
                          <pre className="text-sm whitespace-pre-wrap break-words font-sans py-2">
                            {item.content}
                          </pre>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">No knowledge items added yet.</p>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Tools Section */}
        <Collapsible 
          open={isToolsOpen} 
          onOpenChange={setIsToolsOpen}
          className="group"
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 group-hover:bg-muted/30 rounded-md px-3 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Code className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Active Tools</span>
            </div>
            <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${isToolsOpen ? 'rotate-90' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="py-3 px-3">
            <div className="grid grid-cols-1 gap-1.5">
              <div className="flex items-center gap-2.5 py-2">
                <div className="w-1 h-4 bg-amber-500/80 rounded-full"></div>
                <span className="text-sm">Code Editor</span>
              </div>
              <div className="flex items-center gap-2.5 py-2">
                <div className="w-1 h-4 bg-green-500/80 rounded-full"></div>
                <span className="text-sm">Web Browser</span>
              </div>
              <div className="flex items-center gap-2.5 py-2">
                <div className="w-1 h-4 bg-blue-500/80 rounded-full"></div>
                <span className="text-sm">File Explorer</span>
              </div>
              <div className="flex items-center gap-2.5 py-2">
                <div className="w-1 h-4 bg-purple-500/80 rounded-full"></div>
                <span className="text-sm">Terminal</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Settings Section */}
        <Collapsible
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          className="group"
        >
          {/* Updated CollapsibleTrigger to include Edit button */}
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 group-hover:bg-muted/30 rounded-md px-3 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Agent Settings</span>
            </div>
            {/* Container for Edit button and Chevron */}
            <div className="flex items-center gap-1">

              {/* Chevron is always visible */}
              <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${isSettingsOpen ? 'rotate-90' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="py-3 px-3 space-y-5">
            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">AI Model</label>
              <ModelSelect defaultValue={agent.modelName || agent.primaryModelId} />
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs text-muted-foreground">Temperature</label>
                <span className="text-xs text-muted-foreground">0.7</span>
              </div>
              <Slider 
                defaultValue={[0.7]} 
                max={1} 
                step={0.1} 
                className="w-full" 
              />
              <p className="text-xs text-muted-foreground mt-1">Creativity vs precision</p>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs text-muted-foreground">Max Tokens</label>
                <span className="text-xs text-muted-foreground">4000</span>
              </div>
              <Slider 
                defaultValue={[4000]} 
                max={8000} 
                step={100} 
                className="w-full" 
              />
              <p className="text-xs text-muted-foreground mt-1">Maximum output length</p>
            </div>
            
            {/* Context Length */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs text-muted-foreground">Context Length</label>
                <span className="text-xs text-muted-foreground">16K</span>
              </div>
              <Select defaultValue="16k">
                <SelectTrigger className="w-full bg-muted/30 border-0 focus:ring-1 focus:ring-ring">
                  <SelectValue placeholder="Select context length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8k">8K tokens</SelectItem>
                  <SelectItem value="16k">16K tokens</SelectItem>
                  <SelectItem value="32k">32K tokens</SelectItem>
                  <SelectItem value="64k">64K tokens</SelectItem>
                  <SelectItem value="128k">128K tokens</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Memory capacity for conversation</p>
            </div>
            
            {/* Advanced Options */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-medium">Advanced Options</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="streaming" className="text-sm">Response Streaming</Label>
                  <p className="text-xs text-muted-foreground">Display responses as they&apos;re generated</p> {/* Fixed escaping */}
                </div>
                <Switch id="streaming" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tool-use" className="text-sm">Tool Use</Label>
                  <p className="text-xs text-muted-foreground">Allow agent to use external tools</p>
                </div>
                <Switch id="tool-use" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="web-access" className="text-sm">Web Access</Label>
                  <p className="text-xs text-muted-foreground">Enable browsing capabilities</p>
                </div>
                <Switch id="web-access" defaultChecked />
              </div>
            </div>
            
            {/* API Settings */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-muted-foreground">API Key</label>
                <Badge variant="outline" className="text-xs font-normal">Connected</Badge>
              </div>
              <Select defaultValue="default">
                <SelectTrigger className="w-full bg-muted/30 border-0 focus:ring-1 focus:ring-ring">
                  <SelectValue placeholder="Select API source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Use default key</SelectItem>
                  <SelectItem value="custom">Use custom key</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
          </Collapsible>
        {/* Removed duplicated content */}
      </div>
    </div>
  )
}
