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
import { Brain, ChevronRight, Settings, Code } from "lucide-react"
import { useState } from "react"

export function AgentInfo() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isToolsOpen, setIsToolsOpen] = useState(true)
  const [isBehaviourOpen, setIsBehaviourOpen] = useState(false)
  
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
              <select 
                className="w-full p-2 text-sm border-0 rounded-md bg-muted/30 focus:outline-none focus:ring-1 focus:ring-ring"
                defaultValue="gpt-4"
              >
                <option value="gpt-4">GPT-4 Turbo</option>
                <option value="claude">Claude 3 Opus</option>
                <option value="mistral">Mistral Large</option>
              </select>
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
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}