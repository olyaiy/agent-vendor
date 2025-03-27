'use client';

import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';

interface RecentAgent {
  id: string;
  avatar_url?: string | null;
  thumbnail_url?: string | null;
  agent_display_name: string;
}

export function RecentAgentsAvatars({ agents }: { agents: RecentAgent[] }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  if (agents.length === 0) return null;

  return (
    <div className="mt-2  flex justify-center  ">
      {agents.map((agent) => (
        <Tooltip key={agent.id}>
          <TooltipTrigger asChild>
            <Link
              href={`/${agent.id}`}
              className=" block mx-[4px]"
              onClick={() => {
                setOpenMobile(false);
                router.refresh();
              }}
            >
              <div className=" relative size-full overflow-hidden rounded-full ">
                {(agent.avatar_url || agent.thumbnail_url) ? (
                  <Image 
                    src={`${agent.avatar_url || agent.thumbnail_url}`}
                    alt={agent.agent_display_name}
                    width={48}
                    height={48}
                    className="size-full object-cover aspect-square rounded-full hover:scale-110 transition-all duration-300"
                    quality={90}
                  />
                ) : (
                  <div className="h-full w-full bg-muted flex items-center justify-center text-sm font-medium">
                    {agent.agent_display_name.charAt(0)}
                  </div>
                )}
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{agent.agent_display_name}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
} 