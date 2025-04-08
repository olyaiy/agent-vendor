// components/agent-info.tsx
'use client'

import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
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
  SelectGroup,
  SelectLabel
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Brain, ChevronRight, Settings, Code, BookOpen, X, ZapIcon } from "lucide-react"
import { useState } from "react"

export function AgentInfo() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isToolsOpen, setIsToolsOpen] = useState(false)
  const [isBehaviourOpen, setIsBehaviourOpen] = useState(true)
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false)
  
  return (
    <div className="h-full p-4 space-y-6 overflow-y-auto pb-24">
      {/* Full-width Image */}
      <div className="w-full aspect-square bg-gray-200 rounded-lg" />

      {/* Left-aligned Content */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Assistant</h2>
        <p className="text-sm text-muted-foreground">
          Your AI-powered assistant for code generation, debugging, and documentation.
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
              defaultValue="You are a helpful, creative, and knowledgeable assistant specialized in software development."
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
              
              <div className="space-y-2">
                {/* Knowledge Item */}
                <div className="bg-muted/30 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">React Documentation</h4>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Official React documentation including hooks, components, and patterns</p>
                  <div className="flex items-center mt-2">
                    <Badge variant="secondary" className="text-xs">Website</Badge>
                    <span className="text-xs text-muted-foreground ml-2 max-w-[150px] truncate" title="react.dev">react.dev</span>
                  </div>
                  <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-muted-foreground">125,000 words</span>
                  </div>
                </div>
                
                {/* Knowledge Item */}
                <div className="bg-muted/30 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Next.js 14 App Router Guide</h4>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Complete guide to the App Router architecture including server components</p>
                  <div className="flex items-center mt-2">
                    <Badge variant="secondary" className="text-xs">PDF</Badge>
                    <span className="text-xs text-muted-foreground ml-2 max-w-[150px] truncate" title="nextjs.org/docs/app-router-guide.pdf">nextjs.org/docs/app-router-guide.pdf</span>
                  </div>
                  <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-muted-foreground">85,500 words</span>
                  </div>
                </div>
                
                {/* Knowledge Item */}
                <div className="bg-muted/30 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Company Codebase</h4>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Private repository with company coding standards and examples</p>
                  <div className="flex items-center mt-2">
                    <Badge variant="secondary" className="text-xs">Text</Badge>
                    <span className="text-xs text-muted-foreground ml-2 max-w-[150px] truncate" title="github.com/company/standards">github.com/company/standards</span>
                  </div>
                  <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-muted-foreground">32,400 words</span>
                  </div>
                </div>
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
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 group-hover:bg-muted/30 rounded-md px-3 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Agent Settings</span>
            </div>
            <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${isSettingsOpen ? 'rotate-90' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="py-3 px-3 space-y-5">
            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">AI Model</label>
              <Select defaultValue="gpt-4">
                <SelectTrigger className="w-full bg-muted/30 border-0 focus:ring-1 focus:ring-ring">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>OpenAI</SelectLabel>
                    <SelectItem value="gpt-4">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-3.5">GPT-3.5 Turbo</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Anthropic</SelectLabel>
                    <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                    <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Others</SelectLabel>
                    <SelectItem value="mistral-large">Mistral Large</SelectItem>
                    <SelectItem value="llama-3">Llama 3</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
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
                  <p className="text-xs text-muted-foreground">Display responses as they're generated</p>
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
      </div>
    </div>
  )
}