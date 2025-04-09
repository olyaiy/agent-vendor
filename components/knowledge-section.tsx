'use client';

import { useState, memo } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { BookOpen, ChevronRight } from 'lucide-react';
import { Knowledge } from '@/db/schema/agent';
import { KnowledgeItemDisplay } from './knowledge-item-display'; // Import the new component

interface KnowledgeSectionProps {
  knowledgeItems: Knowledge[];
}

function KnowledgeSectionComponent({ knowledgeItems }: KnowledgeSectionProps) {
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false); // Default closed

  return (
    <Collapsible
      open={isKnowledgeOpen}
      onOpenChange={setIsKnowledgeOpen}
      className="group"
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 group-hover:bg-muted/30 rounded-md px-3 transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Knowledge Base</span>
        </div>
        <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${isKnowledgeOpen ? 'rotate-90' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="py-3 px-3">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Reference materials the agent can access</p>
          </div>

          {/* Display actual knowledge items using KnowledgeItemDisplay */}
          <div className="space-y-2">
            {knowledgeItems.length > 0 ? (
              knowledgeItems.map((item) => (
                <KnowledgeItemDisplay key={item.id} item={item} />
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">No knowledge items added yet.</p>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export const KnowledgeSection = memo(KnowledgeSectionComponent);
