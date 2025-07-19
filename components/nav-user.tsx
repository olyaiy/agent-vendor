"use client"

import { useRouter } from "next/navigation" // Import useRouter
import {
  BadgeCheck,
  // Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Moon,
  Palette,
  // Sparkles,
  Sun,
} from "lucide-react"

import {
} from "@/components/ui/avatar"
import { UserAvatar } from "@/components/ui/user-avatar" // Import UserAvatar
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client" // Import authClient
import { Skeleton } from "@/components/ui/skeleton" // Import Skeleton
import GoogleSignInButton from "@/components/auth/GoogleSignInButton" // Import the Google Sign In button
import { useTheme } from "next-themes"
import * as React from "react"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter() // Initialize router
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Sign out handler
  const handleSignOut = async () => {
    try {
      // Assuming better-auth client has a signOut method
      // If not, we might need to check documentation or authClient definition
      await authClient.signOut() 

      router.push('/') // Redirect to home page after sign out
    } catch (error) {
      console.error("Sign out failed:", error)
      // Optionally show an error message to the user
    }
  }

  // Loading state
  if (isPending) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="cursor-wait">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="grid flex-1 text-left text-sm leading-tight gap-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Signed out state
  if (!session) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          {/* Replace the generic button with the Google Sign In button */}
          <GoogleSignInButton />
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Signed in state - use session.user data
  const user = session.user; // Get user data from session

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="cursor-pointer">
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {/* Replace Avatar with UserAvatar */}
              <UserAvatar user={user} className="h-8 w-8 rounded-lg" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name || "User"}</span>
                <span className="truncate text-xs">{user.email || ""}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                {/* Replace Avatar with UserAvatar */}
                <UserAvatar user={user} className="h-8 w-8 rounded-lg" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name || "User"}</span>
                  <span className="truncate text-xs">{user.email || ""}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            {/* <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator /> */}
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/credits')}>
                <CreditCard />
                Credits and Billing
              </DropdownMenuItem>
              {/* <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem> */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {mounted && (
                <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {theme === "dark" ? (
                    <>
                      <Sun className="mr-2 h-4 w-4" />
                      Switch to Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      Switch to Dark Mode
                    </>
                  )}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* Add onSelect handler to the Log out item */}
            <DropdownMenuItem onSelect={handleSignOut}> 
              <LogOut className="mr-2 h-4 w-4" /> {/* Added spacing */}
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
