"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { type User } from "better-auth" // Assuming User type is exported from better-auth

interface UserAvatarProps extends React.ComponentPropsWithoutRef<typeof Avatar> {
  user: Partial<Pick<User, "id" | "name" | "image" | "email">>
}

// Helper function to get initials from name
const getInitials = (name?: string | null): string => {
  if (!name) return "U" // Default to 'U' if no name
  const names = name.trim().split(" ")
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase()
  }
  return (
    (names[0].charAt(0) || "") + (names[names.length - 1].charAt(0) || "")
  ).toUpperCase()
}

export function UserAvatar({ user, ...props }: UserAvatarProps) {
  const initials = getInitials(user.name)
  const identifier = user.id || user.email || "anonymous" // Use ID, fallback to email, then 'anonymous'
  // Remove the text parameter to hide initials on the generated SVG
  const vercelAvatarUrl = `https://avatar.vercel.sh/${encodeURIComponent(
    identifier
  )}.svg`

  return (
    <Avatar {...props}>
      <AvatarImage
        src={user.image || vercelAvatarUrl}
        alt={user.name || "User Avatar"}
      />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}
