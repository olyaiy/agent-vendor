'use client';

import React from 'react';
import type { ToolInvocation } from 'ai';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import Image from 'next/image';
import { Separator } from './ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";


interface WebSearchSectionProps {
  toolInvocation: ToolInvocation;
}

// Define a type for the expected result structure
interface SearchResult {
    title: string;
    url: string;
    content?: string;
    score?: number;
}

interface SearchResults {
    results: SearchResult[];
    answer?: string;
    images?: string[];
}

const SearchResultCard = ({ result }: { result: SearchResult }) => {
  const domain = result.url
    ? new URL(result.url).hostname.replace("www.", "")
    : "";
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block py-2 px-4 rounded-lg border border-border hover:bg-accent transition-colors duration-200 h-full"
          >
            <div className="flex flex-col gap-1 h-full">
              <div className="flex items-center gap-1.5">
                <Image
                  src={faviconUrl}
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4"
                  unoptimized
                />
                <span className="text-xs text-muted-foreground">{domain}</span>
              </div>
              <h3 className="text-xs line-clamp-2">{result.title}</h3>
            </div>
          </Link>
        </TooltipTrigger>

        {result.content && (
          <TooltipContent
            side="top"
            align="start"
            className="bg-card text-card-foreground"
          >
            <h1 className=" text-base">{result.title}</h1>
            <Separator className="my-2" />
            <p className="max-w-xs text-pretty text-sm">{result.content}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

const WebSearchSection = ({ toolInvocation }: WebSearchSectionProps) => {
    // Define animation variants outside the conditionals so they can be reused
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

    if (toolInvocation.state === 'result') {
        const searchResults = toolInvocation.result as SearchResults | undefined;
        const results = searchResults?.results;
        const MAX_INITIAL_RESULTS = 3; // Show first 3 initially

        if (!results || results.length === 0) {
            return (
                <Alert variant="destructive">
                    <AlertDescription>
                        No results found or failed to load results.
                    </AlertDescription>
                </Alert>
            );
        }

        const showDialog = results.length > MAX_INITIAL_RESULTS + 1; // +1 because the 4th item becomes the button
        const initialResults = showDialog
            ? results.slice(0, MAX_INITIAL_RESULTS)
            : results;
        const remainingResultsCount = results.length - MAX_INITIAL_RESULTS;

        return (
            <div>
                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2"
                    variants={container}
                    initial="hidden"
                    animate="show"
                >
                    {initialResults.map((result, index) => (
                        <motion.div key={index} variants={item}>
                            <SearchResultCard result={result} />
                        </motion.div>
                    ))}

                    {showDialog && (
                        <motion.div variants={item}>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-full w-full flex items-center justify-center text-sm text-muted-foreground hover:bg-accent"
                                    >
                                        +{remainingResultsCount} more sources
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[800px]">
                                    <DialogHeader>
                                        <DialogTitle>All Web Search Sources</DialogTitle>
                                    </DialogHeader>
                                    <div className="max-h-[60vh] overflow-y-auto pr-4">
                                        <motion.div 
                                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4"
                                            variants={container}
                                            initial="hidden"
                                            animate="show"
                                        >
                                            {results.map((result, index) => (
                                                <motion.div key={`dialog-${index}`} variants={item}>
                                                    <SearchResultCard result={result} />
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        );
    }

    if (toolInvocation.state === 'call') {
        const maxResults = Math.min(toolInvocation.args.max_results || 4, 4);
        
        return (
            <>
                <div className="flex items-center gap-2 mb-4">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                        Searching for: &ldquo;{toolInvocation.args.query}&rdquo;
                    </p>
                </div>
                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2"
                    variants={container}
                    initial="hidden"
                    animate="show"
                >
                    {Array.from({ length: maxResults }).map((_, index) => (
                        <motion.div 
                            key={index}
                            className={`py-2 px-4 rounded-lg border border-border h-24 ${index > 0 && index < 2 ? 'hidden md:block' : ''} ${index > 1 ? 'hidden lg:block' : ''}`}
                            variants={item}
                        >
                            <div className="flex flex-col gap-2 animate-pulse">
                                <div className="flex items-center gap-1.5">
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
                <pre>{JSON.stringify(toolInvocation, null, 2)}</pre>
            </>
        );
    }

    // Fallback for other states or if state is not 'call' or 'result'
    return null;
};

export default WebSearchSection;
