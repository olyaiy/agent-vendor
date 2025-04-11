"use client"

import { Plus, Command } from "lucide-react"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useHotkeys } from "react-hotkeys-hook"
import { useEffect, useRef, useState } from "react"

const NewChatButton = () => {
  const router = useRouter()
  const defaultNewChatPath = "/agent/new"
  const [targetPath, setTargetPath] = useState(defaultNewChatPath) // State for the target path
  const newChatButtonRef = useRef<HTMLAnchorElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [isMac, setIsMac] = useState(false)

  // Detect operating system and set initial target path on client side
  useEffect(() => {
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform))

    // Read last visited agent ID from local storage
    const lastVisitedAgentId = localStorage.getItem('lastVisitedAgentId');
    if (lastVisitedAgentId) {
      setTargetPath(`/${lastVisitedAgentId}`);
    } else {
      setTargetPath(defaultNewChatPath);
    }
  }, []) // Runs only once on mount

  // Prefetch the target chat route for instant navigation
  useEffect(() => {
    router.prefetch(targetPath)
  }, [router, targetPath]) // Re-run if targetPath changes

  // Handle Command+K/Ctrl+K shortcut using react-hotkeys-hook
  useHotkeys("mod+k", (e) => {
    e.preventDefault()
    
    // Simulate hover effect on key press
    if (newChatButtonRef.current) {
      // Trigger the hover effect
      setIsHovering(true)
      
      // Add a slight delay before navigation for better visual feedback
      setTimeout(() => {
        router.push(targetPath, { // Use targetPath
          scroll: false
        })

        // Reset hover state after navigation
        setTimeout(() => {
          setIsHovering(false)
        }, 150)
      }, 150)
    } else {
      // Fallback if ref isn't available
      router.push(targetPath, { scroll: false }) // Use targetPath
    }
  })

  // Custom hover CSS class that will be applied when Command+K is pressed or when actually hovered
  const hoverClass = "bg-input/80 shadow-sm transition-all duration-150"

  return (
    <SidebarMenuItem className="flex">
      <SidebarMenuButton asChild tooltip="New Chat">
        <Link
          href={targetPath} // Use targetPath
          prefetch={false} // Prefetching handled by useEffect
          ref={newChatButtonRef}
          className={`flex items-center gap-2 bg-input rounded-xl border-border border-2 py-4 flex-1 transition-all duration-150 ease-in-out ${isHovering ? hoverClass : ''}`}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <Plus size={18} className={`transition-transform duration-150 ${isHovering ? 'rotate-90 scale-110' : ''}`} />
          <span className={`transition-all duration-150 ${isHovering ? 'translate-x-1 font-medium' : ''}`}>New Chat</span>
        </Link>
      </SidebarMenuButton>
      <div className="ml-2 flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-md px-2 border border-border">
        {isMac ? (
          <>
            <Command size={12} />
            <span>K</span>
          </>
        ) : (
          <>
            <span className="font-medium">Ctrl</span>
            <span>+K</span>
          </>
        )}
      </div>
    </SidebarMenuItem>
  )
}

export { NewChatButton }
