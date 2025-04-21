import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

// Define the shape of a tag object
type Tag = {
  id: string;
  name: string;
};

// Define the props for the TagFilters component
type TagFiltersProps = {
  topTags: Tag[];
  selectedTag?: string;
  tagsResultSuccess: boolean;
  tagsResultError?: string;
};

/**
 * Server component responsible for rendering the tag filter badges.
 */
export function TagFilters({ topTags, selectedTag, tagsResultSuccess, tagsResultError }: TagFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Link href="/">
        <Badge variant={!selectedTag ? 'default' : 'outline'} className="cursor-pointer">
          All
        </Badge>
      </Link>
      {tagsResultSuccess ? (
        topTags.map(tag => (
          <Link key={tag.id} href={`/?tag=${encodeURIComponent(tag.name)}`}>
            <Badge
              variant={selectedTag === tag.name ? 'default' : 'outline'}
              className="cursor-pointer"
            >
              {tag.name}
            </Badge>
          </Link>
        ))
      ) : (
        <p className="text-sm text-red-500">Error loading tags: {tagsResultError}</p>
      )}
    </div>
  );
}
