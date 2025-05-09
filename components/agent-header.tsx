import { memo } from 'react';
import Link from 'next/link';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AgentImage } from '@/components/agent-image';
import { Agent } from '@/db/schema/agent';
import { ModelSelect } from '@/components/model-select'; // Import ModelSelect
import type { AgentSpecificModel } from '@/components/chat'; // Import the correct model type
import type { ModelInfo } from "@/app/agent/create/create-agent-form"; // Keep ModelInfo for mapping

interface AgentHeaderProps {
  // Update agent type to include tags
  agent: Agent & { tags?: Array<{ id: string; name: string }> };
  isOwner: boolean;
  // Add props for model selection
  models: AgentSpecificModel[]; // Revert back to AgentSpecificModel type
  selectedModelId: string;
  setSelectedModelId: React.Dispatch<React.SetStateAction<string>>;
}

function AgentHeaderComponent({ agent, isOwner, models, selectedModelId, setSelectedModelId }: AgentHeaderProps) {
  console.log(`[AgentHeaderComponent] Render - typeof window: ${typeof window}, isOwner: ${isOwner}, agent.slug: ${agent?.slug}`);

  // Map AgentSpecificModel[] to ModelInfo[] for ModelSelect
  const modelInfos: ModelInfo[] = models.map(m => ({
    id: m.modelId, // Map modelId to id
    model: m.model,
    description: m.description || null, // Ensure description is string | null
  }));

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
      <div className="space-y-2 ">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{agent.name}</h2>
          {isOwner && (
            <Link href={`/agent/${agent.slug}/settings`}>
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
        {/* Add ModelSelect below description */}
        <div className="space-y-0 pt-2 "> {/* Added pt-2 for spacing */}
          <ModelSelect
            models={modelInfos} // Pass the mapped array
            defaultValue={selectedModelId}
            onValueChange={setSelectedModelId}
          />
        </div>
      </div>

      {/* Dynamic Tags Section */}
      {agent.tags && agent.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 ">
          {agent.tags.map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-xs font-normal">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      <Separator className="my-4" />
    </>
  );
}

export const AgentHeader = memo(AgentHeaderComponent);
