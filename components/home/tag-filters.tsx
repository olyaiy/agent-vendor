import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getTopTagsAction } from '@/db/actions/tag.actions';

// Define the props for the TagFilters component
type TagFiltersProps = {
  selectedTag?: string;
};

/**
 * Server component responsible for fetching and rendering the tag filter badges.
 * Now handles its own data fetching for better performance.
 */
export async function TagFilters({ selectedTag }: TagFiltersProps) {
  // Fetch top tags
  const tagsResult = await getTopTagsAction(20);
  const topTags = tagsResult.success ? tagsResult.data || [] : [];

  return (
    <div className="flex space-x-2 overflow-x-auto pb-4 mb-6">
      {tagsResult.success ? (
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
        <p className="text-sm text-red-500">Error loading tags: {tagsResult.error}</p>
      )}
    </div>
  );
}
