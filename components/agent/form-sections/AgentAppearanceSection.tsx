"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Eye, 
  EyeOff, 
  Link, 
  Palette, 
  Info, 
  LayoutGrid, 
  Check,
  Lock,
  Globe
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";



interface AgentAppearanceSectionProps {
  initialVisibility?: "public" | "private" | "link";
  colorSchemeId: string;
  setColorSchemeId: (id: string) => void;
}

export default function AgentAppearanceSection({
  initialVisibility = "private",
  colorSchemeId,
  setColorSchemeId,
}: AgentAppearanceSectionProps) {
  const [visibility, setVisibility] = useState<"public" | "private" | "link">(
    initialVisibility
  );
  
  // const colorSchemes = getColorSchemes();
  
  const handleVisibilityChange = (value: string) => {
    setVisibility(value as "public" | "private" | "link");
  };

  return (
    <Card className="border border-muted-foreground/10 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="size-4 text-primary" />
          Appearance & Visibility
        </CardTitle>
        <CardDescription>
          Configure how your agent looks and who can access it
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visibility Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            <Label className="text-sm font-medium">
              Visibility Setting <span className="text-red-500">*</span>
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-80">
                  <p>Control who can see and interact with your agent</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors relative h-full min-h-[200px] flex flex-col ${
                visibility === "private" ? "border-primary bg-primary/5" : "border-border"
              }`}
              onClick={() => setVisibility("private")}
            >
              <div className="absolute top-4 right-4">
                {visibility === "private" && (
                  <div className="size-6 rounded-full bg-primary flex items-center justify-center text-white">
                    <Check className="size-4" />
                  </div>
                )}
              </div>
              <div className="my-2">
                <Lock className="size-8 text-amber-500" />
              </div>
              <h4 className="font-medium">Private</h4>
              <p className="text-sm text-muted-foreground mt-1 grow">
                Only you can see and use this agent. 
                Best for personal assistants or works in progress.
              </p>
            </div>

            <div 
              className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors relative h-full min-h-[200px] flex flex-col ${
                visibility === "link" ? "border-primary bg-primary/5" : "border-border"
              }`}
              onClick={() => setVisibility("link")}
            >
              <div className="absolute top-4 right-4">
                {visibility === "link" && (
                  <div className="size-6 rounded-full bg-primary flex items-center justify-center text-white">
                    <Check className="size-4" />
                  </div>
                )}
              </div>
              <div className="my-2">
                <Link className="size-8 text-blue-500" />
              </div>
              <h4 className="font-medium">Invite Link</h4>
              <p className="text-sm text-muted-foreground mt-1 grow">
                Only people with the direct link can access this agent.
                Not discoverable publicly.
              </p>
            </div>

            <div 
              className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors relative h-full min-h-[200px] flex flex-col ${
                visibility === "public" ? "border-primary bg-primary/5" : "border-border"
              }`}
              onClick={() => setVisibility("public")}
            >
              <div className="absolute top-4 right-4">
                {visibility === "public" && (
                  <div className="size-6 rounded-full bg-primary flex items-center justify-center text-white">
                    <Check className="size-4" />
                  </div>
                )}
              </div>
              <div className="my-2">
                <Globe className="size-8 text-green-500" />
              </div>
              <h4 className="font-medium">Public</h4>
              <p className="text-sm text-muted-foreground mt-1 grow">
                Anyone can find and use this agent.
                Will appear in public listings and search results.
              </p>
            </div>
          </div>
        </div>
        
        {/* Color Scheme Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-1">
            <Label className="text-sm font-medium">
              Color Scheme
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-80">
                  <p>Select a color scheme for your agent&apos;s interface</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* {colorSchemes.map((scheme: ColorScheme) => (
              <div
                key={scheme.id}
                className={cn(
                  "relative group cursor-pointer transition-all rounded-md overflow-hidden border-2",
                  colorSchemeId === scheme.id 
                    ? "border-primary ring-2 ring-primary ring-opacity-50" 
                    : "border-transparent hover:border-muted-foreground/30"
                )}
                onClick={() => setColorSchemeId(scheme.id)}
              >
                <div
                  className="h-16 w-full"
                  style={{ backgroundColor: scheme.primaryColor }}
                />
                <div className="p-2 bg-popover">
                  <p className="text-xs font-medium truncate">{scheme.name}</p>
                </div>
                {colorSchemeId === scheme.id && (
                  <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                    <Check className="size-3" />
                  </div>
                )}
              </div>
            ))} */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 