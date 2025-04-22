'use client';

import React from 'react';
import type { ToolInvocation } from 'ai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const WebSearchSection = ({ toolInvocation }: WebSearchSectionProps) => {
    if (toolInvocation.state === 'result') {
        const searchResults = toolInvocation.result as SearchResults | undefined;
        const results = searchResults?.results;

        return (
                <div>
                    
                    {results && results.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {results.map((result, index) => {
                                // Extract domain from URL for display
                                const domain = result.url ? new URL(result.url).hostname.replace('www.', '') : '';
                                
                                // Favicon URL using Google's favicon service
                                const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
                                
                                return (
                                    <TooltipProvider key={index}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <a 
                                                    href={result.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block p-4 rounded-lg border border-border hover:bg-accent transition-colors duration-200 h-full"
                                                >
                                                    <div className="flex flex-col gap-2 h-full">
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
                                                </a>
                                            </TooltipTrigger>
                                          
                                            {result.content && (
                                                <TooltipContent side="top" align="start" className="bg-card text-card-foreground">
                                                    <h1 className=" text-base">{result.title}</h1>
                                                    <Separator className="my-2" />
                                                    <p className="max-w-xs text-pretty text-sm">{result.content}</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                );
                            })}
                        </div>
                    ) : (
                        <Alert variant="destructive">
                            <AlertDescription>No results found or failed to load results.</AlertDescription>
                        </Alert>
                    )}
                    </div>


        );
    }

    if (toolInvocation.state === 'call') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Searching the web...</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Looking for: &ldquo;{toolInvocation.args.search_term}&rdquo;
                    </p>
                    {/* Skeleton loading state in a row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32 hidden md:block" />
                        <Skeleton className="h-32 hidden lg:block" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Fallback for other states or if state is not 'call' or 'result'
    return null;
};

export default WebSearchSection;
