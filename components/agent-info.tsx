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
import { Brain, ChevronDown, ChevronUp, Settings, Wrench, Zap } from "lucide-react"
import { useState } from "react"

export function AgentInfo() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isToolsOpen, setIsToolsOpen] = useState(true)
  const [isBehaviourOpen, setIsBehaviourOpen] = useState(false)
  
  return (
    <div className="h-full p-4 space-y-4 overflow-y-auto pb-24">
      {/* Full-width Image */}
      <div className="w-full aspect-square bg-gray-200 rounded-lg" />

      {/* Left-aligned Content */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Assistant</h2>
        <p className="text-sm text-muted-foreground">
          Your AI-powered assistant for code generation, debugging, and documentation.
        </p>
      </div>

      {/* Categories Section - Always visible */}


        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-xs px-2 py-0.5">💻 Code</Badge>
          <Badge variant="outline" className="text-xs px-2 py-0.5">🌐 Web</Badge>
          <Badge variant="outline" className="text-xs px-2 py-0.5">📊 Data</Badge>
          <Badge variant="outline" className="text-xs px-2 py-0.5">🔒 Security</Badge>
          <Badge variant="outline" className="text-xs px-2 py-0.5">🤖 AI</Badge>
          <Badge variant="outline" className="text-xs px-2 py-0.5">📱 Mobile</Badge>
        </div>


      <Separator className="my-4" />

      {/* Behaviour Section */}
      <Collapsible
        open={isBehaviourOpen}
        onOpenChange={setIsBehaviourOpen}
        className="p-1 cursor-pointer"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer">
          <div className="flex items-center gap-2">
            <Brain size={16} />
            <span className="font-medium">Behaviour</span>
          </div>
          {isBehaviourOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-3">
          {/* System Prompt */}
          <div className="space-y-2">
            <label htmlFor="system-prompt" className="text-sm font-medium">System Prompt</label>
            <textarea
              id="system-prompt"
              className="w-full min-h-[100px] p-2 text-sm border rounded-md"
              placeholder="Define how the AI assistant should behave..."
              defaultValue="You are a helpful, creative, and knowledgeable assistant specialized in software development."
            />
            <p className="text-xs text-muted-foreground">Determines the assistant&apos;s personality and capabilities</p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator className="my-4" />

      {/* Tools Section */}
      <Collapsible 
        open={isToolsOpen} 
        onOpenChange={setIsToolsOpen}
        className="p-1 cursor-pointer"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer">
          <div className="flex items-center gap-2">
            <Wrench size={16} />
            <span className="font-medium">Active Tools</span>
          </div>
          {isToolsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-3">
          {/* Active Tools List */}
          <div className="space-y-2">
            <ul className="space-y-2">
              <li className="flex items-center gap-2 p-1.5 rounded-md bg-muted/50">
                <Zap size={14} className="text-amber-500" />
                <span className="text-sm">Code Editor</span>
              </li>
              <li className="flex items-center gap-2 p-1.5 rounded-md bg-muted/50">
                <Zap size={14} className="text-green-500" />
                <span className="text-sm">Web Browser</span>
              </li>
              <li className="flex items-center gap-2 p-1.5 rounded-md bg-muted/50">
                <Zap size={14} className="text-blue-500" />
                <span className="text-sm">File Explorer</span>
              </li>
              <li className="flex items-center gap-2 p-1.5 rounded-md bg-muted/50">
                <Zap size={14} className="text-purple-500" />
                <span className="text-sm">Terminal</span>
              </li>
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator className="my-4" />

      {/* Settings Section */}
      <Collapsible
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        className="p-1 cursor-pointer"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full  cursor-pointer">
          <div className="flex items-center gap-2">
            <Settings size={16} />
            <span className="font-medium">Agent Settings</span>
          </div>
          {isSettingsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-3">
          {/* Model Selection */}
          <div className="space-y-2">
            <label htmlFor="model" className="text-sm font-medium">AI Model</label>
            <select 
              id="model" 
              className="w-full p-2 text-sm border rounded-md"
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
              <label htmlFor="temperature" className="text-sm font-medium">Temperature</label>
              <span className="text-sm">0.7</span>
            </div>
            <Slider 
              id="temperature"
              defaultValue={[0.7]} 
              max={1} 
              step={0.1} 
              className="w-full" 
            />
            <p className="text-xs text-muted-foreground">Controls creativity vs precision</p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label htmlFor="max-tokens" className="text-sm font-medium">Max Tokens</label>
              <span className="text-sm">4000</span>
            </div>
            <Slider 
              id="max-tokens"
              defaultValue={[4000]} 
              max={8000} 
              step={100} 
              className="w-full" 
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}