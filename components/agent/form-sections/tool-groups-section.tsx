"use client";

import React from "react";
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
    <section className="space-y-2 pb-10 pt-8">
      <div className="space-y-8">
        <div className="pb-2 border-b">
          <h2 className="text-lg font-medium tracking-tight">Tool Groups</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enable specific tools and capabilities for your agent
          </p>
        </div>
        
        <ToolGroupSelector
          toolGroups={toolGroups}
          selectedToolGroupIds={selectedToolGroupIds}
          onChange={onChange}
          className="pt-2"
        />
      </div>
    </section>
  );
} 