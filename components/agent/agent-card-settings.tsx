"use client";

import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";

interface AgentCardSettingsProps {
  agentId: string;
  userId?: string;
  creatorId?: string | null;
}

export function AgentCardSettings({ agentId, userId, creatorId }: AgentCardSettingsProps) {
  const router = useRouter();

  return (
    <button
      className="p-1 hover:bg-accent rounded-md"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        router.push(
          userId === creatorId 
            ? `/agents/${agentId}/edit` 
            : `/agents/${agentId}/view`
        );
      }}
    >
      <Settings className="size-4" />
    </button>
  );
} 