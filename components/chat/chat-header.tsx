'use client'
import React, { memo, useState } from 'react';
// Import useSidebar
import { useSidebar } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../ui/breadcrumb';
import { HomeIcon, Share2Icon, Copy, Check, DownloadIcon, FileTextIcon, FileIcon, FileTypeIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import Link from 'next/link';
// Import cn utility
import { cn, generateAgentSlug } from '@/lib/utils';
// Import motion from framer-motion
import { motion } from 'framer-motion';

interface ChatHeaderProps {
  hasMessages?: boolean;
  agentName?: string;
  agentId?: string;
}

function ChatHeaderComponent({ hasMessages = false, agentName = "Agent", agentId }: ChatHeaderProps) {
  const [copied, setCopied] = useState(false);
  // Get sidebar state
  const { state: sidebarState } = useSidebar();

  const handleCopy = () => {
    navigator.clipboard.writeText('https://chat.example.com/conversation/123');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: string) => {
    // Mock download functionality
    console.log(`Downloading as ${format}`);
    // In a real app, this would trigger the actual download
  };

  return (
    // Always use justify-between to keep the buttons right-aligned
    <div className={cn(
      "px-4 py-3 flex items-center justify-between",
      hasMessages ? 'border-b' : ''
    )}>
      {/* Breadcrumb will take appropriate space based on sidebar state */}
      <motion.div 
        className={cn(
          "flex",
          sidebarState === 'collapsed' ? 'flex-grow justify-center' : ''
        )}
        layout
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30 
        }}
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">
                  <HomeIcon className="h-3.5 w-3.5" />
                  <span className="sr-only">Home</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <motion.div layout>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={agentId ? `/${generateAgentSlug(agentName, agentId)}` : "/agent"}>
                    {agentName}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </motion.div>
            <BreadcrumbSeparator />
            <motion.div layout>
              <BreadcrumbItem>
                <BreadcrumbPage>New Conversation</BreadcrumbPage>
              </BreadcrumbItem>
            </motion.div>
          </BreadcrumbList>
        </Breadcrumb>
      </motion.div>

      {/* Share buttons section, always aligned to right */}
      {hasMessages ? (
        <motion.div 
          className="flex items-center space-x-1"
          layout
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }}
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" aria-label="Download conversation" className='p-0 m-0 size-8'>
                <DownloadIcon className="size-4 p-0 m-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Download conversation</h4>
                <div className="flex flex-col space-y-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="justify-start font-normal"
                    onClick={() => handleDownload('markdown')}
                  >
                    <FileTextIcon className="h-4 w-4 mr-2" />
                    <span>Markdown (.md)</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="justify-start font-normal"
                    onClick={() => handleDownload('pdf')}
                  >
                    <FileIcon className="h-4 w-4 mr-2" />
                    <span>PDF (.pdf)</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="justify-start font-normal"
                    onClick={() => handleDownload('docx')}
                  >
                    <FileTypeIcon className="h-4 w-4 mr-2" />
                    <span>Word (.docx)</span>
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" aria-label="Share conversation" className='p-0 m-0 size-8'>
                <Share2Icon className="size-4 p-0 m-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Share conversation</h4>
                <div className="flex items-center space-x-2">
                  <div className="bg-muted p-2 rounded text-xs flex-1 truncate">
                    https://chat.example.com/conversation/123
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </motion.div>
      ) : (
        <motion.div 
          className="w-[72px]"
          layout
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }}
        /> // Empty spacer div to maintain layout when no messages
      )}
    </div>
  );
}

// Export memoized component
export const ChatHeader = memo(ChatHeaderComponent);
