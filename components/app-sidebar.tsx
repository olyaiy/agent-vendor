import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
  } from "@/components/ui/sidebar"
import { Logo } from "./logo"
  
  export function AppSidebar() {
    return (
      <Sidebar variant="inset">
        <SidebarHeader className="flex items-center justify-center">
          <Logo/>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup />
          <SidebarGroup />
        </SidebarContent>
        <SidebarFooter />
      </Sidebar>
    )
  }
  
