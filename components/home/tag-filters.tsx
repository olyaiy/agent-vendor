import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
    <div className="flex space-x-2 overflow-x-auto pb-4 mb-6">
      {tagsResultSuccess ? (
        <>
          <Link href="/" className="flex-shrink-0">
            <Button
              variant={!selectedTag ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
            >
              All
            </Button>
          </Link>
          {topTags.map(tag => (
            <Link key={tag.id} href={selectedTag === tag.name ? "/" : `/?tag=${encodeURIComponent(tag.name)}`} className="flex-shrink-0">
              <Button
                variant={selectedTag === tag.name ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
              >
                {tag.name}
              </Button>
            </Link>
          ))}
        </>
      ) : (
        <p className="text-sm text-red-500">Error loading tags: {tagsResultError}</p>
      )}
    </div>
  );
}
