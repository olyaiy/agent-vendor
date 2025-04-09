"use client"

import { History, Users, LifeBuoy, Send, Info } from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    // SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
  } from "@/components/ui/sidebar"
import { Logo } from "./logo"
import { NavUser } from "./nav-user"
import { NavSecondary } from "./nav-secondary"
import { NewChatButton } from "./new-chat-button"
import Link from "next/link"

// Mock conversation history
const historyItems = [
  { title: "Project brainstorming session", url: "#", date: "2 hours ago" },
  { title: "Customer support analysis", url: "#", date: "Yesterday" },
  { title: "Content marketing ideas", url: "#", date: "3 days ago" },
  { title: "Product roadmap planning", url: "#", date: "Last week" },
]

// Agent submenu items
const agentItems = [
  { title: "Create", url: "/agent/create" },
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
  return (
    <Sidebar variant="inset">
      <SidebarHeader className="flex items-center justify-center h-14">
        <Logo/>
      </SidebarHeader>

      <SidebarContent className="py-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* New Chat Button with Command+K/Ctrl+K shortcut */}
              <NewChatButton />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          {/* <SidebarGroupLabel>Navigation</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {/* History with submenu */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="History">
                  <Link href="/history">
                    <History size={18} />
                    <span>History</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  {historyItems.map((item) => (
                    <SidebarMenuSubItem key={item.title}>
                      <SidebarMenuSubButton asChild>
                        <Link href={item.url} className="flex items-center justify-start">
                          <span className="text-xs truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </SidebarMenuItem>
              
              {/* Agents with submenu */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Agents">
                  <Link href="/agents">
                    <Users size={18} />
                    <span>Agents</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  {agentItems.map((item) => (
                    <SidebarMenuSubItem key={item.title}>
                      <SidebarMenuSubButton asChild>
                        <Link href={item.url}>
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <NavSecondary
          className="mt-auto"
          items={navSecondary}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser /> 
      </SidebarFooter>
    </Sidebar>
  )
}
