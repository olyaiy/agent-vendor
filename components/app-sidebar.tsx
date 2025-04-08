"use client"

import { ChevronRight, History, Plus, Users, LifeBuoy, Send, Info, Command } from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
  } from "@/components/ui/sidebar"
import { Logo } from "./logo"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { NavUser } from "./nav-user"
import { NavSecondary } from "./nav-secondary"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useHotkeys } from "react-hotkeys-hook"
import { useEffect, useRef, useState } from "react"

// Mock conversation history
const historyItems = [
  { title: "Project brainstorming session", url: "#", date: "2 hours ago" },
  { title: "Customer support analysis", url: "#", date: "Yesterday" },
  { title: "Content marketing ideas", url: "#", date: "3 days ago" },
  { title: "Product roadmap planning", url: "#", date: "Last week" },
]

// Agent submenu items
const agentItems = [
  { title: "Create", url: "/agents/create" },
  { title: "Browse", url: "/agents/browse" },
  { title: "My Agents", url: "/agents/my-agents" },
]

// NavSecondary items
const navSecondary = [
  {
    title: "Support",
    url: "#",
    icon: LifeBuoy,
  },
  {
    title: "Contact",
    url: "#",
    icon: Send,
  },
  {
    title: "About",
    url: "#",
    icon: Info,
  }
]

export function AppSidebar() {
  const router = useRouter()
  const newChatPath = "/agent/new"
  const newChatButtonRef = useRef<HTMLAnchorElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [isMac, setIsMac] = useState(false)

  // Detect operating system on client side
  useEffect(() => {
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform))
  }, [])

  // Prefetch the new chat route for instant navigation
  useEffect(() => {
    router.prefetch(newChatPath)
  }, [router, newChatPath])

  // Handle Command+K/Ctrl+K shortcut more efficiently using react-hotkeys-hook
  useHotkeys("mod+k", (e) => {
    e.preventDefault()
    
    // Simulate hover effect on key press
    if (newChatButtonRef.current) {
      // Trigger the hover effect
      setIsHovering(true)
      
      // Add a slight delay before navigation for better visual feedback
      setTimeout(() => {
        router.push(newChatPath, { 
          scroll: false
        })
        
        // Reset hover state after navigation
        setTimeout(() => {
          setIsHovering(false)
        }, 150)
      }, 150)
    } else {
      // Fallback if ref isn't available
      router.push(newChatPath, { scroll: false })
    }
  })

  // Custom hover CSS class that will be applied when Command+K is pressed or when actually hovered
  const hoverClass = "bg-input/80 shadow-sm transition-all duration-150"

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="flex items-center justify-center  h-8">
        <Logo/>
      </SidebarHeader>


      <SidebarContent className="py-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* New Chat Button with Command+K/Ctrl+K shortcut */}
              <SidebarMenuItem className="flex">
                <SidebarMenuButton asChild tooltip="New Chat">
                  <Link 
                    href={newChatPath}
                    prefetch
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* History Collapsible Menu */}
              <Collapsible asChild className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="History">
                      <History size={18} />
                      <span>History</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="">
                      {historyItems.map((item) => (
                        <SidebarMenuSubItem key={item.title} className="">
                          <SidebarMenuSubButton asChild className="">
                            <a href={item.url} className="flex items-center justify-start">
                              <span className="text-xs truncate">{item.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              
              {/* Agents Collapsible Menu */}
              <Collapsible asChild className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Agents">
                      <Users size={18} />
                      <span>Agents</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {agentItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={item.url}>
                              <span>{item.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                   
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <NavSecondary
        className="mt-auto"
                      items={navSecondary}
                    />
      </SidebarContent>
      <SidebarFooter >
        <NavUser user={{
          name: "John Doe",
          email: "john.doe@example.com",
          avatar: "https://github.com/shadcn.png"
        }} />
        
      </SidebarFooter >
    </Sidebar>
  )
}
  
