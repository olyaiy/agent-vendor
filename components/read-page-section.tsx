'use client';

import React from 'react';
import type { ToolInvocation } from 'ai';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Loader2, ExternalLink, FileText, Image as ImageIcon, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import Image from 'next/image'; // For displaying images if needed

// --- Type Definitions ---

interface ReadPageArgs {
  url: string;
}

interface ReadPageData {
  title: string;
  url: string;
  content: string; // Contains HTML content
  links: Record<string, string>;
  images: Record<string, string>; // Assuming keys are alt text/names, values are URLs
}

interface ReadPageResult {
  code: number;
  status: number;
  data?: ReadPageData; // Make data optional to handle potential errors where data might be missing
  error?: string; // Add an optional error field
}

interface ReadPageSectionProps {
  toolInvocation: ToolInvocation;
}

// --- Helper Functions (Optional, e.g., for sanitizing/truncating) ---

// Basic HTML tag stripper (replace with a more robust sanitizer if needed)
const stripHtml = (html: string): string => {
  if (!html) return '';
  let doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
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
    if (!result || result.code !== 200 || !result.data) {
      const errorMessage = result?.error || (result?.code !== 200 ? `Request failed with status ${result?.code}` : "No data received from the tool.");
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

    const { title, url, content, links, images } = result.data;
    const plainContentSnippet = truncateText(stripHtml(content), 300); // Show ~300 chars of text content
    const domain = new URL(url).hostname.replace("www.", "");
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    const linkEntries = Object.entries(links || {});
    const imageEntries = Object.entries(images || {});

    return (
      <motion.div
        className="border rounded-lg overflow-hidden bg-card"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <CardHeader className="p-4 bg-muted/30">
          <motion.div variants={item} className="flex items-center gap-2 mb-1">
             <FileText className="h-4 w-4 text-muted-foreground" />
             <CardTitle className="text-base font-medium">{title || 'Untitled Page'}</CardTitle>
          </motion.div>
          <motion.div variants={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
             <Image src={faviconUrl} alt="" width={16} height={16} className="h-4 w-4" unoptimized />
             <Link href={url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate flex items-center gap-1">
               {domain} <ExternalLink className="h-3 w-3" />
             </Link>
          </motion.div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {plainContentSnippet && (
            <motion.div variants={item}>
              <h4 className="text-sm font-medium mb-1">Content Snippet</h4>
              <p className="text-sm text-muted-foreground text-pretty">
                {plainContentSnippet}
              </p>
            </motion.div>
          )}

          {/* Links section removed as per request */}

          {imageEntries.length > 0 && (
             <motion.div variants={item}>
               <Separator className="my-3" />
               <h4 className="text-sm font-medium mb-2">Images Found ({imageEntries.length})</h4>
               {/* Basic display for now, could be enhanced with thumbnails */}
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-2">
                 {imageEntries.map(([alt, imgUrl], index) => (
                   <Link
                     key={index}
                     href={imgUrl}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="text-xs text-muted-foreground hover:underline truncate flex items-center gap-1"
                     title={imgUrl}
                   >
                     <ImageIcon className="h-3 w-3 flex-shrink-0" />
                     <span className="truncate">{alt || `Image ${index + 1}`}</span>
                   </Link>
                 ))}
               </div>
             </motion.div>
          )}
        </CardContent>
      </motion.div>
    );
  }

  // Fallback for unexpected states
  return null;
};

export default ReadPageSection;