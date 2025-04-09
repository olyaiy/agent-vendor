import { memo } from 'react';
import Link from 'next/link';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AgentImage } from '@/components/agent-image';
import { Agent } from '@/db/schema/agent';

interface AgentHeaderProps {
  agent: Agent;
  isOwner: boolean;
}

function AgentHeaderComponent({ agent, isOwner }: AgentHeaderProps) {
  return (
    <>
      {/* Image section */}
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <AgentImage
          thumbnailUrl={agent.thumbnailUrl || agent.avatarUrl}
          agentId={agent.id}
        />
      </div>

      {/* Left-aligned Content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{agent.name}</h2>
          {isOwner && (
            <Link href={`/${agent.id}/settings`} passHref>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="w-5 h-5 text-muted-foreground hover:text-foreground"
                aria-label="Edit Agent"
              >
                <Pencil2Icon className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {agent.description || "Your AI-powered assistant for code generation, debugging, and documentation."}
        </p>
      </div>

      {/* Categories Section */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {/* TODO: Make categories dynamic if needed */}
        <Badge variant="outline" className="text-xs font-normal">Code</Badge>
        <Badge variant="outline" className="text-xs font-normal">Web</Badge>
        <Badge variant="outline" className="text-xs font-normal">Data</Badge>
        <Badge variant="outline" className="text-xs font-normal">Security</Badge>
        <Badge variant="outline" className="text-xs font-normal">AI</Badge>
        <Badge variant="outline" className="text-xs font-normal">Mobile</Badge>
      </div>

      <Separator className="my-4" />
    </>
  );
}

export const AgentHeader = memo(AgentHeaderComponent);
