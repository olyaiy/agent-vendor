"use client"

import { ChevronRight, History, Plus, Users } from "lucide-react"
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

export function AppSidebar() {
  return (
    <Sidebar variant="inset">
      <SidebarHeader className="flex items-center justify-center  h-8">
        <Logo/>
      </SidebarHeader>


      <SidebarContent className="py-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* New Chat Button */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="New Chat">

                  <a href="/c" className="flex items-center gap-2 bg-input rounded-xl border-border border-2 py-4 ">
                    <Plus size={18} />
                    <span>New Chat</span>
                  </a>

                </SidebarMenuButton>
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
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
  
