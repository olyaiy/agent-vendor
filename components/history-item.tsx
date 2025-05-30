"use client"

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreHorizontal, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { SidebarMenuSubItem, SidebarMenuSubButton } from '@/components/ui/sidebar'
import { toast } from 'sonner'

interface HistoryItemProps {
  item: {
    id: string
    title: string
    url: string
    agentSlug: string | null
  }
  isActive: boolean
  index: number
  onNavigate: (url: string, e: React.MouseEvent) => void
  onDelete: (chatId: string) => void
  onRename: (chatId: string, newTitle: string) => Promise<void>
}

const listItemVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  },
  exit: { 
    opacity: 0, 
    y: -8, 
    scale: 0.95,
    transition: { 
      duration: 0.2 
    }
  }
}

export function HistoryItem({ 
  item, 
  isActive, 
  index, 
  onNavigate, 
  onDelete, 
  onRename 
}: HistoryItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [inlineEditValue, setInlineEditValue] = useState('')
  const [isSubmittingRename, setIsSubmittingRename] = useState(false)

  const handleStartEdit = useCallback(() => {
    setEditingChatId(item.id)
    setInlineEditValue(item.title)
  }, [item.id, item.title])

  const handleSaveRename = useCallback(async () => {
    const trimmedTitle = inlineEditValue.trim()

    if (trimmedTitle === item.title) {
      setEditingChatId(null)
      setInlineEditValue('')
      return
    }
    if (!trimmedTitle) {
      toast.error("Title cannot be empty.")
      return
    }
    if (trimmedTitle.length > 100) {
      toast.error("Title cannot exceed 100 characters.")
      return
    }

    setIsSubmittingRename(true)
    try {
      await onRename(item.id, trimmedTitle)
    } finally {
      setEditingChatId(null)
      setIsSubmittingRename(false)
      setInlineEditValue('')
    }
  }, [inlineEditValue, item.id, item.title, onRename])

  const handleCancelRename = useCallback(() => {
    setEditingChatId(null)
    setInlineEditValue('')
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveRename()
    }
    if (e.key === 'Escape') {
      handleCancelRename()
    }
  }, [handleSaveRename, handleCancelRename])

  const handleMouseEnter = useCallback(() => {
    if (!editingChatId) setIsHovered(true)
  }, [editingChatId])

  const handleMouseLeave = useCallback(() => {
    if (!editingChatId) setIsHovered(false)
  }, [editingChatId])

  const handleDeleteClick = useCallback(() => {
    onDelete(item.id)
  }, [item.id, onDelete])

  const isEditing = editingChatId === item.id

  return (
    <motion.div
      key={item.id}
      custom={index}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={listItemVariants}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      layout
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative group"
    >
      <SidebarMenuSubItem className="p-0">
        <div className="flex items-center justify-between w-full min-h-[30px]">
          {isEditing ? (
            <div className="flex items-center w-full px-1.5 py-0.5">
              <Input
                type="text"
                value={inlineEditValue}
                onChange={(e) => setInlineEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="text-xs h-[26px] flex-grow mr-1 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 bg-transparent border-slate-600 hover:border-slate-500 focus:border-slate-400"
                autoFocus
                disabled={isSubmittingRename}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0.5 text-green-500 hover:text-green-400 disabled:text-muted-foreground"
                onClick={handleSaveRename}
                disabled={isSubmittingRename || !inlineEditValue.trim() || inlineEditValue === item.title || inlineEditValue.length > 100}
              >
                <Check size={15} />
                <span className="sr-only">Save</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0.5 text-red-500 hover:text-red-400 disabled:text-muted-foreground"
                onClick={handleCancelRename}
                disabled={isSubmittingRename}
              >
                <X size={15} />
                <span className="sr-only">Cancel</span>
              </Button>
            </div>
          ) : (
            <SidebarMenuSubButton
              asChild
              className={`flex-grow ${isActive ? 'bg-slate-800/50' : ''} ${isHovered && !isEditing ? 'pr-7' : ''}`}
            >
              <a
                href={item.url}
                className={`flex items-center justify-start w-full text-left py-1.5 px-2 ${isActive ? 'text-white font-medium' : ''}`}
                onClick={(e) => onNavigate(item.url, e)}
              >
                <span className="text-xs truncate" title={item.title}>{item.title}</span>
              </a>
            </SidebarMenuSubButton>
          )}

          <AnimatePresence>
            {isHovered && !isEditing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <Popover onOpenChange={(open) => {
                   if (!open && isHovered && !isEditing) {
                     // Keep hover active if still hovering
                   } else if (!open) {
                     setIsHovered(false)
                   }
                }}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0.5 text-muted-foreground hover:text-foreground data-[state=open]:bg-slate-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal size={15} />
                      <span className="sr-only">Options for {item.title}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-1"
                    side="right"
                    align="start"
                    sideOffset={5}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      className="w-full h-auto text-sm justify-start px-2 py-1.5 text-foreground hover:bg-accent focus-visible:bg-accent"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartEdit()
                      }}
                    >
                      Rename
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full h-auto text-sm justify-start px-2 py-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 focus-visible:bg-red-500/10 focus-visible:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteClick()
                      }}
                    >
                      Delete
                    </Button>
                  </PopoverContent>
                </Popover>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SidebarMenuSubItem>
    </motion.div>
  )
} 