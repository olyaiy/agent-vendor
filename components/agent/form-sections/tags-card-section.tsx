"use client";

import React from "react";
import { TagSelector } from "@/components/ui/tag-selector";

interface TagInfo {
  id: string;
  name: string;
}

interface TagsCardSectionProps {
  tags: TagInfo[];
  selectedTags: TagInfo[];
  setSelectedTags: (tags: TagInfo[]) => void;
}

export function TagsCardSection({
  tags,
  selectedTags,
  setSelectedTags
}: TagsCardSectionProps) {
  return (
    <section className="space-y-12 pb-10 pt-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-4">
          <div className="pb-2 border-b">
            <h2 className="text-lg font-medium tracking-tight">Tags</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add tags to help users discover your agent
            </p>
          </div>
        </div>
        
        <div className="md:col-span-8 space-y-4">
          <TagSelector
            availableTags={tags}
            selectedTags={selectedTags}
            onChange={setSelectedTags}
            getValue={(tag) => tag.id}
            getLabel={(tag) => tag.name}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Tags help users find your agent. Select from existing tags to categorize your agent.
          </p>
        </div>
      </div>
    </section>
  );
} 