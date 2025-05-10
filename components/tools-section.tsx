'use client';

import { useState, memo } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Code, ChevronRight } from 'lucide-react';
import { Tool } from '@/db/schema/tool'; // Import Tool type

interface ToolsSectionProps {
  assignedTools: Tool[];
}

function ToolsSectionComponent({ assignedTools }: ToolsSectionProps) {
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
      <CollapsibleContent className="py-3 px-3 relative">
        <div className="space-y-1">
          {assignedTools && assignedTools.length > 0 ? (
            assignedTools.map((tool, index) => (
              <div key={tool.id || index} className="flex items-center gap-2.5 py-1.5 px-1">
                {/* Optional: Add a visual indicator or icon per tool type if desired */}
                {/* <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> */}
                <span className="text-sm text-muted-foreground">{tool.displayName || tool.name}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic px-1 py-1.5">
              No tools currently active for this agent.
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export const ToolsSection = memo(ToolsSectionComponent);
