import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

/**
 * Get the current session with proper error handling
 */
export async function getCurrentSession() {
  try {
    const headersList = await headers();
    return await auth.api.getSession({ headers: headersList });
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
}

/**
 * Check if the current user is an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const session = await getCurrentSession();
  return session?.user?.role?.includes('admin') ?? false;
}

/**
 * Check if the current user can access a chat
 * Users can access their own chats, admins can access any chat
 */
export async function canAccessChat(chatUserId: string): Promise<{
  canAccess: boolean;
  session: Awaited<ReturnType<typeof getCurrentSession>>;
  isAdmin: boolean;
  isOwner: boolean;
}> {
  const session = await getCurrentSession();
  
  if (!session?.user) {
    return {
      canAccess: false,
      session,
      isAdmin: false,
      isOwner: false,
    };
  }

  const isAdmin = session.user.role?.includes('admin') ?? false;
  const isOwner = session.user.id === chatUserId;
  const canAccess = isOwner || isAdmin;

  return {
    canAccess,
    session,
    isAdmin,
    isOwner,
  };
}

/**
 * Check if the current user can access admin features
 */
export async function requireAdmin(): Promise<{
  success: boolean;
  session: Awaited<ReturnType<typeof getCurrentSession>>;
  error?: string;
}> {
  const session = await getCurrentSession();
  
  if (!session?.user) {
    return {
      success: false,
      session,
      error: 'Authentication required',
    };
  }

  const isAdmin = session.user.role?.includes('admin') ?? false;
  
  if (!isAdmin) {
    return {
      success: false,
      session,
      error: 'Admin access required',
    };
  }

  return {
    success: true,
    session,
  };
} 