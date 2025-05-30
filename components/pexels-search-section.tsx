import React from 'react';
import type { ToolInvocation } from 'ai';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Camera, AlertCircle } from 'lucide-react';

interface SimplifiedPhoto {
  id: number;
  src_medium: string;
  src_large: string;
  alt: string;
  photographer_name: string;
  photographer_url: string;
  photo_url: string;
  width: number;
  height: number;
  avg_color: string;
}

interface PexelsResult {
  error: boolean;
  message: string;
  photos: SimplifiedPhoto[];
  total_results?: number;
  query?: string;
}

interface PexelsSearchSectionProps {
  toolInvocation: ToolInvocation;
}

export default function PexelsSearchSection({ toolInvocation }: PexelsSearchSectionProps) {
  const { args, state } = toolInvocation;

  // Loading state - when the tool is called but no results yet
  if (state === 'call') {
    return (
      <div className="flex items-center p-4 my-2 space-x-2 text-sm border rounded-md bg-muted/30">
        <Camera className="w-5 h-5 text-primary animate-pulse" />
        <div>
          <p className="text-muted-foreground">
            Searching for photos of <span className="font-semibold text-primary">&ldquo;{args.query}&rdquo;</span> on Pexels...
          </p>
          {args.count && args.count !== 6 && (
            <p className="text-xs text-muted-foreground mt-1">
              Looking for {args.count} photo{args.count > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Result state - when we have results from the API
  if (state === 'result' && 'result' in toolInvocation) {
    const pexelsResult = toolInvocation.result as PexelsResult;

    // Handle error cases
    if (pexelsResult.error) {
      return (
        <Card className="my-2">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">Search Failed</p>
                <p className="text-sm text-muted-foreground">{pexelsResult.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Handle no results
    if (!pexelsResult.photos || pexelsResult.photos.length === 0) {
      return (
        <Card className="my-2">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">No Photos Found</p>
                <p className="text-sm text-muted-foreground">{pexelsResult.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Display photos
    return (
      <Card className="my-2">
        <CardContent className="p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-primary" />
                <h3 className="font-medium">Photos from Pexels</h3>
              </div>
              {pexelsResult.total_results && (
                <Badge variant="secondary">
                  {pexelsResult.total_results.toLocaleString()} total results
                </Badge>
              )}
            </div>
            {pexelsResult.query && (
              <p className="text-sm text-muted-foreground mt-1">
                Search: &ldquo;{pexelsResult.query}&rdquo;
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pexelsResult.photos.map((photo) => (
              <div key={photo.id} className="group relative">
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-[4/3] bg-muted">
                    <Image
                      src={photo.src_medium}
                      alt={photo.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    
                    {/* Action buttons overlay */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={photo.photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors"
                        title="View on Pexels"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-700" />
                      </a>
                    </div>
                  </div>
                  
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {photo.alt}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <a
                          href={photo.photographer_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                          title="View photographer profile"
                        >
                          📸 {photo.photographer_name}
                        </a>
                        <span className="text-muted-foreground">
                          {photo.width} × {photo.height}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Pexels attribution */}
          <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
            <p>
              Photos provided by{' '}
              <a
                href="https://www.pexels.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Pexels
              </a>
              . Click on any photo to view on Pexels.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback for unknown states
  return (
    <div className="flex items-center p-4 my-2 space-x-2 text-sm border rounded-md bg-muted/30">
      <Camera className="w-5 h-5 text-primary animate-pulse" />
      <p className="text-muted-foreground">Processing Pexels search...</p>
    </div>
  );
} 