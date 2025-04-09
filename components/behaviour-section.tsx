'use client';

import { useState, memo } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Brain, ChevronRight } from 'lucide-react';

interface BehaviourSectionProps {
  initialSystemPrompt: string | null;
}

function BehaviourSectionComponent({ initialSystemPrompt }: BehaviourSectionProps) {
  const [isBehaviourOpen, setIsBehaviourOpen] = useState(true); // Default open

  return (
    <Collapsible
      open={isBehaviourOpen}
      onOpenChange={setIsBehaviourOpen}
      className="group"
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 group-hover:bg-muted/30 rounded-md px-3 transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
          <Brain className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Behaviour</span>
        </div>
        <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${isBehaviourOpen ? 'rotate-90' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="py-3 px-3">
        <textarea
          className="w-full min-h-[100px] p-3 text-sm border-0 rounded-md bg-muted/30 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          placeholder="Define how the AI assistant should behave..."
          defaultValue={initialSystemPrompt || "You are a helpful, creative, and knowledgeable assistant specialized in software development."}
          // Consider adding onChange if this needs to be controlled externally later
        />
        <p className="text-xs text-muted-foreground mt-2">Determines the assistant&#39;s personality and behavior</p>
      </CollapsibleContent>
    </Collapsible>
  );
}

export const BehaviourSection = memo(BehaviourSectionComponent);
