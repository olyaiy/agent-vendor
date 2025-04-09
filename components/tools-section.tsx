'use client';

import { useState, memo } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Code, ChevronRight } from 'lucide-react';

// No props needed for this static section currently

function ToolsSectionComponent() { // Removed props
  const [isToolsOpen, setIsToolsOpen] = useState(false); // Default closed

  return (
    <Collapsible
      open={isToolsOpen}
      onOpenChange={setIsToolsOpen}
      className="group"
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 group-hover:bg-muted/30 rounded-md px-3 transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
          <Code className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Active Tools</span>
        </div>
        <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${isToolsOpen ? 'rotate-90' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="py-3 px-3">
        {/* Static content for now, can be made dynamic later if needed */}
        <div className="grid grid-cols-1 gap-1.5">
          <div className="flex items-center gap-2.5 py-2">
            <div className="w-1 h-4 bg-amber-500/80 rounded-full"></div>
            <span className="text-sm">Code Editor</span>
          </div>
          <div className="flex items-center gap-2.5 py-2">
            <div className="w-1 h-4 bg-green-500/80 rounded-full"></div>
            <span className="text-sm">Web Browser</span>
          </div>
          <div className="flex items-center gap-2.5 py-2">
            <div className="w-1 h-4 bg-blue-500/80 rounded-full"></div>
            <span className="text-sm">File Explorer</span>
          </div>
          <div className="flex items-center gap-2.5 py-2">
            <div className="w-1 h-4 bg-purple-500/80 rounded-full"></div>
            <span className="text-sm">Terminal</span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export const ToolsSection = memo(ToolsSectionComponent);
