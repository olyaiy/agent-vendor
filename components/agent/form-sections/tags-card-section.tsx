"use client";

import React from "react";
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
    <TagsSection
      tags={tags}
      selectedTags={selectedTags}
      setSelectedTags={setSelectedTags}
    />
  );
} 