"use client";

import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { TagsSection } from "./tags-section";

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
    <Card className="shadow-sm border-2">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-lg font-semibold">Tags</CardTitle>
        <CardDescription>
          Add tags to help users discover your agent
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <TagsSection 
          tags={tags}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
        />
      </CardContent>
    </Card>
  );
} 