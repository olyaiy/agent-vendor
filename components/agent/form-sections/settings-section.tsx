"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";

interface SettingsSectionProps {
  settings: {
    maxTokens: number;
    temperature: number;
    topP: number;
    topK: number;
    presencePenalty: number;
    frequencyPenalty: number;
  };
  onSettingsChange: (key: string, value: number) => void;
}

export function SettingsSection({
  settings,
  onSettingsChange
}: SettingsSectionProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
      <div className="md:col-span-4">
        <div className="pb-2 border-b">
          <h2 className="text-lg font-medium tracking-tight">Generation Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customize how your agent generates responses
          </p>
        </div>
      </div>
      
      <div className="md:col-span-8 space-y-6">
        {/* Max Tokens */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-1.5">
              <Label htmlFor="maxTokens" className="text-sm font-medium flex items-center gap-1.5">
                Max Tokens
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="size-3.5 text-muted-foreground mt-0.5" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <p>The maximum number of tokens to generate in the response. Higher values allow for longer responses.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm text-muted-foreground">{settings.maxTokens}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Slider
              id="maxTokens"
              min={0}
              max={8000}
              step={1}
              value={[settings.maxTokens]}
              onValueChange={(value) => onSettingsChange("maxTokens", value[0])}
              className="flex-1"
            />
            <Input
              type="number"
              min={0}
              max={8000}
              value={settings.maxTokens}
              onChange={(e) => onSettingsChange("maxTokens", parseInt(e.target.value) || 0)}
              className="w-20"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Limit how many tokens the model can generate in a single response
          </p>
        </div>

        {/* Temperature */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-1.5">
              <Label htmlFor="temperature" className="text-sm font-medium flex items-center gap-1.5">
                Temperature
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="size-3.5 text-muted-foreground mt-0.5" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <p>Controls randomness in generation. Lower values make the output more deterministic, higher values more creative.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm text-muted-foreground">{settings.temperature.toFixed(2)}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.01}
              value={[settings.temperature]}
              onValueChange={(value) => onSettingsChange("temperature", value[0])}
              className="flex-1"
            />
            <Input
              type="number"
              min={0}
              max={2}
              step={0.01}
              value={settings.temperature}
              onChange={(e) => onSettingsChange("temperature", parseFloat(e.target.value) || 0)}
              className="w-20"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Higher values (0.8+) make output more random, lower values (0.2) more focused and deterministic
          </p>
        </div>

        {/* Top P */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-1.5">
              <Label htmlFor="topP" className="text-sm font-medium flex items-center gap-1.5">
                Top P
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="size-3.5 text-muted-foreground mt-0.5" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <p>Controls diversity via nucleus sampling. A value of 0.9 means considering tokens comprising the top 90% probability mass.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm text-muted-foreground">{settings.topP.toFixed(2)}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Slider
              id="topP"
              min={0}
              max={1}
              step={0.01}
              value={[settings.topP]}
              onValueChange={(value) => onSettingsChange("topP", value[0])}
              className="flex-1"
            />
            <Input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={settings.topP}
              onChange={(e) => onSettingsChange("topP", parseFloat(e.target.value) || 0)}
              className="w-20"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Nucleus sampling: only consider tokens with top P total probability mass
          </p>
        </div>

        {/* Top K */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-1.5">
              <Label htmlFor="topK" className="text-sm font-medium flex items-center gap-1.5">
                Top K
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="size-3.5 text-muted-foreground mt-0.5" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <p>Only sample from the top K most likely tokens at each step. Helps control randomness.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm text-muted-foreground">{settings.topK}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Slider
              id="topK"
              min={0}
              max={100}
              step={1}
              value={[settings.topK]}
              onValueChange={(value) => onSettingsChange("topK", value[0])}
              className="flex-1"
            />
            <Input
              type="number"
              min={0}
              max={100}
              step={1}
              value={settings.topK}
              onChange={(e) => onSettingsChange("topK", parseInt(e.target.value) || 0)}
              className="w-20"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Only consider the top K tokens for sampling at each step
          </p>
        </div>

        {/* Presence Penalty */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-1.5">
              <Label htmlFor="presencePenalty" className="text-sm font-medium flex items-center gap-1.5">
                Presence Penalty
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="size-3.5 text-muted-foreground mt-0.5" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <p>Reduces repetition by penalizing tokens based on whether they appear in the text so far.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm text-muted-foreground">{settings.presencePenalty.toFixed(2)}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Slider
              id="presencePenalty"
              min={-2}
              max={2}
              step={0.01}
              value={[settings.presencePenalty]}
              onValueChange={(value) => onSettingsChange("presencePenalty", value[0])}
              className="flex-1"
            />
            <Input
              type="number"
              min={-2}
              max={2}
              step={0.01}
              value={settings.presencePenalty}
              onChange={(e) => onSettingsChange("presencePenalty", parseFloat(e.target.value) || 0)}
              className="w-20"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Positive values penalize tokens that have already appeared in the text
          </p>
        </div>

        {/* Frequency Penalty */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-1.5">
              <Label htmlFor="frequencyPenalty" className="text-sm font-medium flex items-center gap-1.5">
                Frequency Penalty
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="size-3.5 text-muted-foreground mt-0.5" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <p>Reduces repetition by penalizing tokens based on their frequency in the text so far.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm text-muted-foreground">{settings.frequencyPenalty.toFixed(2)}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Slider
              id="frequencyPenalty"
              min={-2}
              max={2}
              step={0.01}
              value={[settings.frequencyPenalty]}
              onValueChange={(value) => onSettingsChange("frequencyPenalty", value[0])}
              className="flex-1"
            />
            <Input
              type="number"
              min={-2}
              max={2}
              step={0.01}
              value={settings.frequencyPenalty}
              onChange={(e) => onSettingsChange("frequencyPenalty", parseFloat(e.target.value) || 0)}
              className="w-20"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Positive values penalize tokens that appear frequently in the text
          </p>
        </div>
      </div>
    </section>
  );
} 