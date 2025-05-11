'use client';

import { useState, memo } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Code, ChevronRight } from 'lucide-react';
import { Tool } from '@/db/schema/tool'; // Import Tool type
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Utility function to generate a vibrant retro color from a string
function stringToColor(str: string): string {
  // Generate a hash from the string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Define a set of retro-inspired, vibrant base hues
  const retroHues = [
    350,  // vibrant pink/red
    320,  // magenta
    275,  // purple
    230,  // vibrant blue
    195,  // cyan
    160,  // mint/teal
    130,  // lime green
    95,   // vibrant green
    55,   // neon yellow
    35,   // orange
    10    // coral/red-orange
  ];
  
  // Pick a base hue from our retro palette based on the hash
  const baseHue = retroHues[Math.abs(hash) % retroHues.length];
  
  // Add a small variation to the selected base hue (+/- 10 degrees)
  const hueVariation = ((hash >> 8) % 20) - 10;
  const finalHue = (baseHue + hueVariation + 360) % 360;
  
  // Retro colors have high saturation but not too high lightness
  // so they pop but aren't too bright
  return `hsl(${finalHue}, 80%, 60%)`;
}

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
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 group-hover:bg-muted/30 rounded-lg px-3 transition-all duration-200 ease-in-out cursor-pointer hover:scale-[1.01] transform">
        <div className="flex items-center gap-3">
          <Code className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Active Tools</span>
        </div>
        <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${isToolsOpen ? 'rotate-90' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="py-3 px-3 relative">
        <div>
          <p className="text-xs text-muted-foreground mb-3">Tools this agent can use during conversations</p>
          
          {assignedTools && assignedTools.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {assignedTools.map((tool, index) => {
                // Generate a unique color for each tool based on its name or ID
                const accentColor = stringToColor(tool.name || tool.id || `tool-${index}`);
                
                return (
                  <TooltipProvider key={tool.id || index} delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild className="cursor-pointer">
                        <div className="relative group/tool border border-border/40 bg-muted/20 hover:bg-muted/40 rounded-md p-2.5 transition-all duration-150 hover:shadow-sm cursor-default">
                          <div 
                            className="absolute top-0 left-0 w-1 h-full rounded-l-md" 
                            style={{ backgroundColor: accentColor }}
                          ></div>
                          <div className="pl-1.5">
                            <p className="text-sm font-medium truncate">{tool.displayName || tool.name}</p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[250px]">
                        <p className="text-xs">{tool.description || `Tool: ${tool.name}`}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-4 px-3 rounded-md bg-muted/20 border border-border/40">
              <p className="text-xs text-muted-foreground italic">
                No tools currently active for this agent.
              </p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export const ToolsSection = memo(ToolsSectionComponent);
