'use client';

import React from 'react';
import type { ToolInvocation } from 'ai';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// Removed Card imports
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Loader2, ExternalLink, AlertCircle, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import Image from 'next/image';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'; // Added Tooltip imports
import { CardTitle } from './ui/card';

// --- Type Definitions ---

interface ReadPageArgs {
  url: string;
}

interface ReadPageResult {
  title?: string;
  url: string;
  content: string; // Contains markdown content
  error?: string; // Add an optional error field
}

interface ReadPageSectionProps {
  toolInvocation: ToolInvocation;
}

// --- Helper Functions (Optional, e.g., for sanitizing/truncating) ---

// Basic HTML tag stripper (replace with a more robust sanitizer if needed)
const stripHtml = (html: string): string => {
  if (!html) return '';
  
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Server-side: Use a simple regex-based approach
    return html.replace(/<[^>]*>/g, '');
  } else {
    // Client-side: Use DOMParser
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  }
};

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};


// --- Animation Variants ---
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};


// --- Component Implementation ---

const ReadPageSection = ({ toolInvocation }: ReadPageSectionProps) => {
  const args = toolInvocation.args as ReadPageArgs;

  // --- Call State ---
  if (toolInvocation.state === 'call' || toolInvocation.state === 'partial-call') {
    return (
      <motion.div
        className="p-4 border rounded-lg bg-muted/30"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div className="flex items-center gap-2 mb-3" variants={item}>
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground truncate">
            Reading page: <span className="font-medium text-foreground">{args.url}</span>
          </p>
        </motion.div>
        <motion.div className="space-y-3" variants={item}>
          <Skeleton className="h-5 w-3/4" /> {/* Title Skeleton */}
          <Skeleton className="h-4 w-1/2" /> {/* URL Skeleton */}
          <Skeleton className="h-4 w-full" /> {/* Content Skeleton */}
          <Skeleton className="h-4 w-5/6" /> {/* Content Skeleton */}
          <Skeleton className="h-4 w-full" /> {/* Content Skeleton */}
        </motion.div>
      </motion.div>
    );
  }

  // --- Result State ---
  if (toolInvocation.state === 'result') {
    const result = toolInvocation.result as ReadPageResult | undefined;

    // Handle Errors or Missing Data
    if (!result || result.error || !result.content) {
      const errorMessage = result?.error || "No data received from the tool.";
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Reading Page</AlertTitle>
            <AlertDescription>
              {errorMessage} <br />
              URL: {args.url}
            </AlertDescription>
          </Alert>
        </motion.div>
      );
    }

    const { title, url, content } = result;
    const plainContentSnippet = truncateText(stripHtml(content), 300); // Show ~300 chars of text content
    const domain = new URL(url).hostname.replace("www.", "");
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    
    // Extract images from markdown content
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const imageMatches = [...content.matchAll(imageRegex)];
    const images = imageMatches.slice(0, 4).map(match => ({
      alt: match[1] || 'Image',
      url: match[2]
    }));

    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 border rounded-lg bg-muted/30 hover:border-border/80 hover:bg-accent/10 transition-colors duration-200 relative"
            >
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {/* Read Page Badge */}
                <div className="absolute top-2 right-2">
                  <motion.div 
                    variants={item}
                    className="flex items-center gap-1 text-xs text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded-full"
                  >
                    <BookOpen className="h-2.5 w-2.5" />
                    <span className="text-[10px]">Read</span>
                  </motion.div>
                </div>
                
                {/* Header Section */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <motion.div variants={item} className="flex items-center gap-2 cursor-pointer">
                      <Image src={faviconUrl} alt="" width={16} height={16} className="h-4 w-4 flex-shrink-0" unoptimized />
                      <CardTitle className="text-xs font-medium truncate">{title || 'Untitled Page'}</CardTitle>
                    </motion.div>
                    <motion.div variants={item} className="flex items-center gap-1.5 text-xs text-muted-foreground pl-6">
                      <span className="truncate flex items-center gap-1">
                        {domain} <ExternalLink className="h-3 w-3" />
                      </span>
                    </motion.div>
                  </div>
                </div>
                
                {/* Images preview section - new row */}
                {images.length > 0 && (
                  <motion.div variants={item} className="flex gap-2 mt-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative flex-1 aspect-square max-w-24 rounded overflow-hidden border border-border/30">
                        <Image 
                          src={image.url} 
                          alt={image.alt} 
                          fill 
                          className="object-cover" 
                          unoptimized 
                        />
                        {images.length > 4 && index === 3 && (
                          <div className="absolute inset-0 bg-background/50 flex items-center justify-center text-xs font-medium">
                            +{images.length - 4}
                          </div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top" align="start" className="bg-card text-card-foreground max-w-md">
            <h1 className="text-base font-medium">{title || 'Untitled Page'}</h1>
            <Separator className="my-2" />
            {/* Content moved to tooltip */}
            {plainContentSnippet && (
              <p className="text-sm text-pretty max-w-xs max-h-40 overflow-y-auto mb-2">
                {plainContentSnippet}
              </p>
            )}
            <p className="text-xs text-muted-foreground break-all">{url}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Fallback for unexpected states
  return null;
};

export default ReadPageSection;