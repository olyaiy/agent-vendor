import Link from 'next/link';
import { ArrowUpIcon, PaperclipIcon } from '@/components/util/icons';
import type { Agent } from '@/lib/db/schema';

export function ReadOnlyPrompt({ agent }: { agent: Agent }) {
  return (
    <Link 
      href={`/${agent.id}`}
      className="w-full block"
    >
      <div className="relative w-full">
        <div className="sm:min-h-[98px] max-h-[calc(50vh)] sm:max-h-[calc(50vh)] 
          overflow-auto resize-none rounded-md !text-base bg-muted/70 pb-8 sm:pb-10 
          dark:border-zinc-700 border relative px-4 py-3 flex items-center justify-center">
          <span className="flex items-center gap-2 text-muted-foreground font-medium">
            Chat with {agent.agent_display_name}
          </span>
          
          {/* Mimicking attachment button position */}
          <div className="absolute bottom-0 left-0 p-1 sm:p-2 w-fit flex flex-row justify-start opacity-50">
            <div className="p-[6px] sm:p-[7px] h-fit border rounded-md rounded-bl-lg dark:border-zinc-700">
              <PaperclipIcon size={14} />
            </div>
          </div>
          
          {/* Mimicking send button position */}
          <div className="absolute bottom-0 right-0 p-1 sm:p-2 w-fit flex flex-row justify-end opacity-50">
            <div className="rounded-full p-3 sm:p-1.5 h-fit border dark:border-zinc-600">
              <div className="sm:scale-[0.65]">
                <ArrowUpIcon size={22} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
} 