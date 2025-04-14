'use client';

import { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { Knowledge } from '@/db/schema/agent';

// Helper function to calculate word count
const countWords = (text: string | null): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
};

// Helper to determine stack depth based on word count
const getStackDepth = (wordCount: number): number => {
  if (wordCount > 3000) return 3;
  if (wordCount > 1000) return 2;
  if (wordCount > 500) return 1;
  return 0;
};

interface KnowledgeItemDisplayProps {
  item: Knowledge;
}

function KnowledgeItemDisplayComponent({ item }: KnowledgeItemDisplayProps) {
  const wordCount = countWords(item.content);
  const stackDepth = getStackDepth(wordCount);
  
  // Generate page numbering display (only for items with content)
  const pageCount = Math.max(1, Math.ceil(wordCount / 250)); // Rough estimate: ~250 words per page
  const pageDisplay = `${pageCount} page${pageCount > 1 ? 's' : ''}`;
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="w-full relative cursor-pointer group">
          {/* Document Stack Effect - Renders stacked papers behind based on content length */}
          {stackDepth > 0 && (
            <>
              {/* Third paper (deepest) */}
              {stackDepth >= 3 && (
                <div className="absolute -bottom-1.5 -right-1.5 w-[96%] h-[96%] bg-slate-100 dark:bg-slate-100 rounded-md border border-slate-300 dark:border-slate-300 transform rotate-1"></div>
              )}
              {/* Second paper */}
              {stackDepth >= 2 && (
                <div className="absolute -bottom-1 -right-1 w-[98%] h-[97%] bg-slate-50 dark:bg-slate-50 rounded-md border border-slate-200 dark:border-slate-200 transform rotate-0.5"></div>
              )}
              {/* First paper (just behind main) */}
              {stackDepth >= 1 && (
                <div className="absolute -bottom-0.5 -right-0.5 w-[99%] h-[98%] bg-white dark:bg-white rounded-md border border-slate-200 dark:border-slate-200"></div>
              )}
            </>
          )}
          
          {/* Main Document */}
          <div 
            className="relative bg-white dark:bg-white border border-slate-300 dark:border-slate-300 p-4 rounded-md shadow-sm hover:shadow-md transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 overflow-hidden"
            aria-label={`View knowledge item: ${item.title}`}
          >
            {/* Paper-like header with lines */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5"></div>
            
            {/* Page numbering in top right */}
            <div className="absolute top-1.5 right-2.5">
              <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono">
                {pageDisplay}
              </span>
            </div>
            
            <div className="pt-2.5">
              {/* Document Title and Icon */}
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-primary/10 rounded-full p-1.5 flex-shrink-0">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                </div>
                <h4 className="font-medium text-sm truncate text-black dark:text-black" title={item.title}>
                  {item.title}
                </h4>
              </div>
              
              {/* Document metadata */}
              <div className="space-y-2">
                {item.sourceUrl && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] capitalize px-1.5 py-0 rounded-full bg-slate-100 dark:bg-slate-100 text-slate-600 dark:text-slate-600 font-normal">
                      {item.sourceUrl.split('.').pop() || 'File'}
                    </Badge>
                    <span className="text-xs text-slate-600 dark:text-slate-600 truncate max-w-[150px]" title={item.sourceUrl}>
                      {item.sourceUrl}
                    </span>
                  </div>
                )}
                
                {/* Word count display */}
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200 dark:border-slate-200">
                  <span className="text-[10px] text-slate-600 dark:text-slate-600 bg-slate-100 dark:bg-slate-100 px-1.5 py-0.5 rounded-full">
                    {wordCount.toLocaleString()} words
                  </span>
                  
                  {/* View document text */}
                  <span className="text-[10px] text-primary/70 group-hover:text-primary transition-colors">
                    View document
                  </span>
                </div>
              </div>
            </div>
            
            {/* First line preview decoration */}
            <div className="absolute left-4 right-4 h-[1px] bg-slate-200 dark:bg-slate-200 bottom-12"></div>
            <div className="absolute left-6 right-10 h-[1px] bg-slate-100 dark:bg-slate-100 bottom-10"></div>
            <div className="absolute left-5 right-8 h-[1px] bg-slate-100 dark:bg-slate-100 bottom-8"></div>
          </div>
        </div>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col rounded-md">
        <DialogHeader className="border-b border-border/30 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-primary/10 rounded-full p-1.5">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            {item.title}
          </DialogTitle>
          {item.sourceUrl && (
            <DialogDescription className="text-sm pt-1 flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] capitalize px-1.5 py-0 rounded-full">
                {item.sourceUrl.split('.').pop() || 'File'}
              </Badge>
              <span className="flex items-center gap-2">
                <span>{item.sourceUrl}</span>
                <span className="text-xs text-muted-foreground/70">•</span>
                <span>{wordCount.toLocaleString()} words</span>
                <span className="text-xs text-muted-foreground/70">•</span>
                <span>{pageDisplay}</span>
              </span>
            </DialogDescription>
          )}
        </DialogHeader>
        
        {/* Document content with page styling */}
        <div className="overflow-y-auto flex-1 pr-2 my-2">
          <div className="bg-white dark:bg-white rounded-md p-4 border border-slate-200 dark:border-slate-200 shadow-sm text-black dark:text-black">
            <pre className="text-sm whitespace-pre-wrap break-words font-sans leading-relaxed">
              {item.content}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const KnowledgeItemDisplay = memo(KnowledgeItemDisplayComponent);
