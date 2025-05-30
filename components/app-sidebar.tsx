"use client"

import { Users, LifeBuoy, Info, HelpCircle } from "lucide-react"
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
import { HistoryMenu } from "./history-menu"
import { ErrorBoundary } from "./ui/error-boundary"


// Agent submenu items
const agentItems = [
  { title: "Create", url: "/agent/create" },
  { title: "My Agents", url: "/profile/agents" },
  // { title: "Browse", url: "/agents/browse" },
]

// NavSecondary items
const navSecondary = [
  {
    title: "Support",
    url: "/support",
    icon: LifeBuoy,
  },
  {
    title: "FAQ",
    url: "/faq",
    icon: HelpCircle,
  },
  // {
  //   title: "Contact",
  //   url: "/contact",
  //   icon: Send,
  // },
  {
    title: "About",
    url: "/about",
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
              <ErrorBoundary>
                <HistoryMenu />
              </ErrorBoundary>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          {/* <SidebarGroupLabel>Navigation</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              
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
