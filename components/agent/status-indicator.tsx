import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatusIndicatorProps {
  icon: LucideIcon
  iconClassName?: string
  children: ReactNode
  className?: string
}

export function StatusIndicator({
  icon: Icon,
  iconClassName,
  children,
  className
}: StatusIndicatorProps) {
  return (
    <span className={cn("flex items-center gap-1 text-muted-foreground text-xs", className)}>
      <Icon size={16} className={iconClassName} />
      <span>{children}</span>
    </span>
  )
}
