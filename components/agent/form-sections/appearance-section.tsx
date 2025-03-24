"use client";

import { Eye, EyeOff, Link, AlertCircle, Palette } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AppearanceSectionProps {
  initialVisibility: "public" | "private" | "link";
}

export function AppearanceSection({ initialVisibility }: AppearanceSectionProps) {
  const visibilityOptions = [
    {
      value: "public",
      label: "Public",
      description: "Everyone can see and use your agent",
      icon: <Eye className="size-4" />,
    },
    {
      value: "private",
      label: "Private",
      description: "Only you can see and use your agent",
      icon: <EyeOff className="size-4" />,
    },
    {
      value: "link",
      label: "Link sharing",
      description: "Anyone with the link can access",
      icon: <Link className="size-4" />,
    },
  ];

  return (
    <Card className="border shadow-sm bg-slate-50 dark:bg-slate-900/40">
      <CardHeader className="pb-3 pt-5">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Palette className="size-5 text-primary" />
          Appearance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">Visibility</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="size-3.5 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[250px]">
                  <p>Controls who can see and use your agent.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <RadioGroup defaultValue={initialVisibility} name="visibility" className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            {visibilityOptions.map((option) => (
              <div key={option.value} className="relative">
                <RadioGroupItem
                  value={option.value}
                  id={`visibility-${option.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`visibility-${option.value}`}
                  className="flex flex-col h-full p-4 bg-white dark:bg-slate-800 border rounded-lg cursor-pointer
                            transition-all hover:border-primary/50 hover:bg-slate-100 dark:hover:bg-slate-700/50
                            peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 dark:peer-data-[state=checked]:bg-primary/20
                            shadow-sm peer-data-[state=checked]:shadow-md"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                      {option.icon}
                    </div>
                    <span className="font-medium text-sm">{option.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
} 