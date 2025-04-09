// components/ui/model-select.tsx
"use client"

import * as React from "react"
import { InfoIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ModelSelectProps {
  defaultValue?: string
  onValueChange?: (value: string) => void
}

interface Model {
  id: string
  name: string
  description: string
  tokens?: string
  contextWindow?: string
  strengths?: string[]
}

interface ModelGroup {
  label: string
  description: string
  models: Model[]
}

export function ModelSelect({ defaultValue, onValueChange }: ModelSelectProps) {
  const modelGroups: ModelGroup[] = [
    {
      label: "OpenAI",
      description: "Latest multi-modal models from OpenAI",
      models: [
        { 
          id: 'gpt-4o', 
          name: 'GPT-4o', 
          description: "OpenAI's most capable model for text and vision tasks",
          contextWindow: "128K tokens",
          strengths: ["Advanced reasoning", "Multi-modal capabilities", "Real-time responses"]
        },
        { 
          id: 'gpt-4o-mini', 
          name: 'GPT-4o Mini', 
          description: "Smaller, faster version of GPT-4o with similar capabilities",
          contextWindow: "128K tokens",
          strengths: ["Faster responses", "Cost efficient", "Strong general capabilities"]
        },
      ],
    },
    {
      label: "Mistral",
      description: "High-performance models from Mistral AI",
      models: [
        { 
          id: 'mistral-small-latest', 
          name: 'Mistral Small', 
          description: "Compact model with excellent reasoning abilities",
          contextWindow: "32K tokens",
          strengths: ["Fast inference", "Cost effective", "Well-rounded performance"]
        },
        { 
          id: 'mistral-large-latest', 
          name: 'Mistral Large', 
          description: "Mistral's flagship model with superior capabilities",
          contextWindow: "32K tokens",
          strengths: ["Advanced reasoning", "High accuracy", "Complex task handling"]
        },
        { 
          id: 'mistral-saba-24b', 
          name: 'Mistral Saba 24B', 
          description: "State-of-the-art model optimized for long-form content",
          contextWindow: "32K tokens",
          strengths: ["Document processing", "Long-form content", "Nuanced understanding"]
        },
      ],
    },
    {
      label: "Llama",
      description: "Open models from Meta AI",
      models: [
        { 
          id: 'llama-3.3-70b-versatile', 
          name: 'Llama 3.3 70B', 
          description: "Meta's latest and most powerful Llama model",
          contextWindow: "128K tokens",
          strengths: ["Versatile applications", "Strong reasoning", "Open weights"]
        },
        { 
          id: 'llama-3.1-8b-instant', 
          name: 'Llama 3.1 8B', 
          description: "Lightweight model offering fast responses",
          contextWindow: "8K tokens",
          strengths: ["Quick responses", "Resource efficient", "Good for simple tasks"]
        },
        { 
          id: 'llama-guard-3-8b', 
          name: 'Llama Guard 3 8B', 
          description: "Specialized for content moderation and safety",
          contextWindow: "8K tokens",
          strengths: ["Content moderation", "Safety features", "Policy enforcement"]
        },
        { 
          id: 'llama3-70b-8192', 
          name: 'Llama 3 70B', 
          description: "Powerful foundation model with broad capabilities",
          contextWindow: "8K tokens",
          strengths: ["General knowledge", "Multilingual support", "Code generation"]
        },
        { 
          id: 'llama3-8b-8192', 
          name: 'Llama 3 8B', 
          description: "Compact version of Llama 3 for resource-conscious applications",
          contextWindow: "8K tokens",
          strengths: ["Edge deployment", "Low latency", "Efficient resource usage"]
        },
      ],
    },
    {
      label: "Claude",
      description: "Anthropic's conversational AI models",
      models: [
        { 
          id: 'claude-3-5-sonnet-20241022', 
          name: 'Claude 3.5 Sonnet', 
          description: "Latest model with excellent conversational abilities",
          contextWindow: "200K tokens",
          strengths: ["Natural conversation", "Nuanced responses", "Helpful and harmless"]
        },
        { 
          id: 'claude-3-5-haiku-20241022', 
          name: 'Claude 3.5 Haiku', 
          description: "Faster, more compact Claude model",
          contextWindow: "200K tokens",
          strengths: ["Quick responses", "Efficient", "Good for simple queries"]
        },
        { 
          id: 'claude-3-7-sonnet-20250219', 
          name: 'Claude 3.7 Sonnet', 
          description: "Most advanced Claude model with superior reasoning",
          contextWindow: "200K tokens",
          strengths: ["Complex reasoning", "Factual accuracy", "Nuanced understanding"]
        },
      ],
    },
    {
      label: "Gemini",
      description: "Multi-modal models from Google DeepMind",
      models: [
        { 
          id: 'gemini-2.0-flash-exp', 
          name: 'Gemini 2.0 Flash', 
          description: "Fast inference optimized model from Google",
          contextWindow: "128K tokens",
          strengths: ["Rapid responses", "Low latency", "Efficient"]
        },
        { 
          id: 'gemini-1.5-pro', 
          name: 'Gemini 1.5 Pro', 
          description: "Powerful multi-modal capabilities",
          contextWindow: "1M tokens",
          strengths: ["Extremely long context", "Multi-modal", "Versatile abilities"]
        },
        { 
          id: 'gemini-1.5-pro-latest', 
          name: 'Gemini 1.5 Pro Latest', 
          description: "Most recent version of Gemini Pro",
          contextWindow: "1M tokens",
          strengths: ["Up-to-date knowledge", "Improved reasoning", "Enhanced capabilities"]
        },
        { 
          id: 'gemini-1.5-flash', 
          name: 'Gemini 1.5 Flash', 
          description: "Optimized for speed while maintaining quality",
          contextWindow: "1M tokens",
          strengths: ["Fast inference", "Resource efficient", "Long context"]
        },
        { 
          id: 'gemini-1.5-flash-latest', 
          name: 'Gemini 1.5 Flash Latest', 
          description: "Latest Gemini Flash model with improvements",
          contextWindow: "1M tokens",
          strengths: ["Latest improvements", "Optimized performance", "Faster responses"]
        },
        { 
          id: 'gemini-1.5-flash-8b', 
          name: 'Gemini 1.5 Flash 8B', 
          description: "Compact 8B parameter version of Gemini Flash",
          contextWindow: "1M tokens",
          strengths: ["Lightweight", "Edge-friendly", "Battery efficient"]
        },
        { 
          id: 'gemini-1.5-flash-8b-latest', 
          name: 'Gemini 1.5 Flash 8B Latest', 
          description: "Most recent compact Gemini model",
          contextWindow: "1M tokens",
          strengths: ["Latest optimizations", "Efficient", "Improved capabilities"]
        },
      ],
    },
    {
      label: "Others",
      description: "Various specialized models from different providers",
      models: [
        { id: 'o1-mini', name: 'O1 Mini', description: "Compact reasoning-focused model" },
        { id: 'o1', name: 'O1', description: "Full-sized O1 model with superior reasoning" },
        { id: 'o3-mini', name: 'O3 Mini', description: "Latest generation compact model from Octo research" },
        { id: 'sonar-pro', name: 'Sonar Pro', description: "Professional search and reasoning model" },
        { id: 'sonar', name: 'Sonar', description: "Base Sonar model optimized for search" },
        { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', description: "Enhanced reasoning capabilities" },
        { id: 'r1-1776', name: 'R1 1776', description: "American-values aligned conversational model" },
        { id: 'pixtral-large-latest', name: 'Pixtral Large', description: "Advanced vision-language model" },
        { id: 'gemma2-9b-it', name: 'Gemma 2 9B', description: "Open-weight model from Google" },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: "Mixture of experts with long context" },
        { id: 'qwen-qwq-32b', name: 'Qwen QWQ 32B', description: "Upgraded Qwen model with improved capabilities" },
        { id: 'qwen-2.5-32b', name: 'Qwen 2.5 32B', description: "Latest generation Qwen model" },
        { id: 'deepseek-chat', name: 'Deepseek Chat', description: "Specialized for conversational tasks" },
        { id: 'deepseek-reasoner', name: 'Deepseek Reasoner', description: "Enhanced for complex reasoning" },
        { id: 'grok-2-1212', name: 'Grok 2 1212', description: "xAI's open-weight generalist model" },
        { id: 'grok-2-latest', name: 'Grok 2 Latest', description: "Most recent version of Grok 2" },
      ],
    },
  ]

  return (
    <TooltipProvider>
      <Select defaultValue={defaultValue} onValueChange={onValueChange}>
        <SelectTrigger className="w-full bg-muted/30 border-0 focus:ring-1 focus:ring-ring">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent className="max-h-[500px]">
          {modelGroups.map((group, groupIndex) => (
            <React.Fragment key={group.label}>
              {groupIndex > 0 && <SelectSeparator />}
              <SelectGroup>
                <div className="flex items-center justify-between px-2 py-1.5">
                  <SelectLabel className="text-sm font-medium">{group.label}</SelectLabel>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px]">
                      {group.description}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="px-1 py-0.5">
                  {group.models.map((model) => (
                    <Tooltip key={model.id}>
                      <TooltipTrigger asChild>
                        <div>
                          <SelectItem 
                            value={model.id} 
                            className="py-1.5 pr-2 rounded-sm cursor-pointer hover:bg-muted/50 pl-8 relative"
                          >
                            <span className="font-medium">{model.name}</span>
                          </SelectItem>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[250px] p-3">
                        <div className="space-y-2">
                          <p className="font-medium text-sm">{model.name}</p>
                          <p className="text-xs text-muted-foreground">{model.description}</p>
                          {model.contextWindow && (
                            <div className="mt-1">
                              <span className="text-xs font-medium">Context:</span>
                              <span className="text-xs ml-1">{model.contextWindow}</span>
                            </div>
                          )}
                          {model.strengths && model.strengths.length > 0 && (
                            <div className="mt-1">
                              <span className="text-xs font-medium">Strengths:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {model.strengths.map((strength, i) => (
                                  <span key={i} className="inline-flex text-[10px] bg-muted rounded-full px-2 py-0.5">
                                    {strength}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </SelectGroup>
            </React.Fragment>
          ))}
        </SelectContent>
      </Select>
    </TooltipProvider>
  )
}