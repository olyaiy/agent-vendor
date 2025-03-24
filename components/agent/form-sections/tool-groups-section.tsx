"use client";

import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ToolGroupSelector, ToolGroupInfo } from "../tool-group-selector";

interface ToolGroupsSectionProps {
  toolGroups: ToolGroupInfo[];
  selectedToolGroupIds: string[];
  onChange: (toolGroupIds: string[]) => void;
}

export function ToolGroupsSection({
  toolGroups,
  selectedToolGroupIds,
  onChange
}: ToolGroupsSectionProps) {
  return (
    <Card className="shadow-sm border-2">
      <CardHeader className="pb-3 sm:pb-4 border-b">
        <CardTitle className="text-base sm:text-lg font-semibold">Tool Groups</CardTitle>
        <CardDescription className="text-sm">
          Enable specific tools and capabilities for your agent
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
        <ToolGroupSelector
          toolGroups={toolGroups}
          selectedToolGroupIds={selectedToolGroupIds}
          onChange={onChange}
        />
      </CardContent>
    </Card>
  );
} 