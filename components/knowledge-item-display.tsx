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
    <Dialog>
      <DialogTrigger asChild>
        <button className="w-full text-left bg-muted/30 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 ease-in-out transform hover:scale-[1.01] cursor-pointer block space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium truncate pr-2 flex items-center gap-1.5" title={item.title}>
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{item.title}</span>
            </h4>
          </div>
          {item.sourceUrl && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs capitalize px-2 py-0.5 rounded-full">
                {item.sourceUrl.split('.').pop() || 'File'}
              </Badge>
              <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={item.sourceUrl}>
                {item.sourceUrl}
              </span>
            </div>
          )}
          <div className="flex justify-end">
            <span className="text-xs text-muted-foreground">
              {countWords(item.content).toLocaleString()} words
            </span>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col rounded-lg">
        <DialogHeader>
          <DialogTitle className="truncate pr-10 text-lg">{item.title}</DialogTitle>
          {item.sourceUrl && (
            <DialogDescription className="text-sm">
              Source: {item.sourceUrl} ({countWords(item.content).toLocaleString()} words)
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-2">
          <pre className="text-sm whitespace-pre-wrap break-words font-sans py-2 leading-relaxed">
            {item.content}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const KnowledgeItemDisplay = memo(KnowledgeItemDisplayComponent);
