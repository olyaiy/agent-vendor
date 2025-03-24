'use client'

import { cn } from '@/lib/utils'
import {
  BookCheck,
  Check,
  Film,
  Image,
  MessageCircleMore,
  Newspaper,
  Repeat2,
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react'
import React from 'react'
import { ToolBadge } from './tool-badge'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { StatusIndicator } from '../agent/status-indicator'

type SectionProps = {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  title?: string
  separator?: boolean
}

export const Section: React.FC<SectionProps> = ({
  children,
  className,
  size = 'md',
  title,
  separator = false
}) => {
  const iconSize = 16
  const iconClassName = 'mr-1.5 text-muted-foreground'
  let icon: React.ReactNode
  switch (title) {
    case 'Images':
      // eslint-disable-next-line jsx-a11y/alt-text
      icon = <Image size={iconSize} className={iconClassName} />
      break
    case 'Videos':
      icon = <Film size={iconSize} className={iconClassName} />
      break
    case 'Sources':
      icon = <Newspaper size={iconSize} className={iconClassName} />
      break
    case 'News':
      icon = <Newspaper size={iconSize} className={iconClassName} />
      break
    case 'Answer':
      icon = <BookCheck size={iconSize} className={iconClassName} />
      break
    case 'Related':
      icon = <Repeat2 size={iconSize} className={iconClassName} />
      break
    case 'Follow-up':
      icon = <MessageCircleMore size={iconSize} className={iconClassName} />
      break
    default:
      icon = <Search size={iconSize} className={iconClassName} />
  }

  return (
    <>
      {separator && <Separator className="my-2 bg-primary/10" />}
      <section
        className={cn(
          `${size === 'sm' ? 'py-1' : size === 'lg' ? 'py-3' : 'py-1'} px-0.5 sm:px-0`,
          className
        )}
      >
        {title && (
          <Badge
            variant="secondary"
            className="flex items-center leading-none w-fit my-1 text-xs sm:text-sm"
          >
            {icon}
            {title}
          </Badge>
        )}
        {children}
      </section>
    </>
  )
}

export function ToolArgsSection({
  children,
  tool,
  number,
  state
}: {
  children: React.ReactNode
  tool: string
  number?: number
  state?: string
}) {
  // Determine which tool identifier to use based on state
  const toolName = tool.replace('Tool', '')
  const displayTool = state && state !== 'result' ? `${toolName}_loading` : toolName
  
  return (
    <Section size="sm" className="py-0 flex items-center justify-between overflow-hidden pr-1 sm:pr-2 gap-1">
      <ToolBadge tool={displayTool} className="text-xs sm:text-sm max-w-[70%] sm:max-w-none truncate">
        {children}
      </ToolBadge>
      {state === 'result' && number && !tool.includes('retrieve') && (
        <StatusIndicator icon={Check} iconClassName="text-green-500" className="text-xs whitespace-nowrap">
          {number} results
        </StatusIndicator>
      )}
      {state === 'result' && tool.includes('retrieve') && (
        <StatusIndicator icon={Check} iconClassName="text-green-500" className="text-xs whitespace-nowrap">
          Page retrieved
        </StatusIndicator>
      )}
      {state && state !== 'result' && (
        <span className="flex items-center text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
          <span className="inline-block animate-[pulse_2s_ease-in-out_infinite] text-muted-foreground/80 dark:text-muted-foreground/90">
            {tool.includes('retrieve') ? 'Reading' : 'Searching'}
          </span>
          <span className="inline-flex ml-1">
            <span className="animate-pulse">.</span>
            <span className="animate-pulse" style={{ animationDelay: '300ms' }}>.</span>
            <span className="animate-pulse" style={{ animationDelay: '600ms' }}>.</span>
          </span>
        </span>
      )}
      {!state && number && (
        <StatusIndicator icon={Check} iconClassName="text-green-500" className="text-xs whitespace-nowrap">
          {number} results
        </StatusIndicator>
      )}
    </Section>
  )
}
