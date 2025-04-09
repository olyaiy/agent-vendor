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

// Helper function to calculate word count (copied from original AgentInfo)
const countWords = (text: string | null): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
};

interface KnowledgeItemDisplayProps {
  item: Knowledge;
}

function KnowledgeItemDisplayComponent({ item }: KnowledgeItemDisplayProps) {
  // Note: The setSelectedKnowledgeItem state from the original component is removed
  // as the Dialog's open state is managed internally by Radix UI.
  // If external control over the dialog is needed later, props can be added.

  return (
    <Dialog> {/* Removed onOpenChange as it's not needed for basic display */}
      <DialogTrigger asChild>
        <button className="w-full text-left bg-muted/30 p-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer block">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium truncate pr-2" title={item.title}>
              <FileText className="inline-block w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              {item.title}
            </h4>
            {/* Removed X button */}
          </div>
          {/* Display sourceUrl if available */}
          {item.sourceUrl && (
            <div className="flex items-center mt-1.5">
              <Badge variant="secondary" className="text-xs capitalize">
                {item.sourceUrl.split('.').pop() || 'File'} {/* Simple type detection */}
              </Badge>
              <span className="text-xs text-muted-foreground ml-2 max-w-[150px] truncate" title={item.sourceUrl}>
                {item.sourceUrl}
              </span>
            </div>
          )}
          {/* Display word count */}
          <div className="flex justify-end mt-1">
            <span className="text-[10px] text-muted-foreground">
              {countWords(item.content).toLocaleString()} words
            </span>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate pr-10">{item.title}</DialogTitle>
          {item.sourceUrl && (
            <DialogDescription>
              Source: {item.sourceUrl} ({countWords(item.content).toLocaleString()} words)
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-2">
          <pre className="text-sm whitespace-pre-wrap break-words font-sans py-2">
            {item.content}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const KnowledgeItemDisplay = memo(KnowledgeItemDisplayComponent);
