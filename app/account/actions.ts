'use server';

import { auth } from '@/lib/auth'; // Use the initialized auth object
import { headers } from 'next/headers'; // Import headers
import { db } from '@/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { user as userSchema, session as sessionSchema } from '@/db/schema/auth-schema';
import { eq } from 'drizzle-orm';

// --- Type Definitions (matching page.tsx) ---
type User = {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null | undefined;
    username?: string | null | undefined;
    displayUsername?: string | null | undefined;
    isAnonymous?: boolean | null | undefined;
    role?: string | null | undefined;
    banned?: boolean | null | undefined;
    banReason?: string | null | undefined;
    banExpires?: Date | null | undefined; // Expect Date
};
type DBSession = {
    id: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    ipAddress?: string | null | undefined;
    userAgent?: string | null | undefined;
    impersonatedBy?: string | null | undefined;
};
type AuthResult = {
    session: DBSession;
    user: User;
} | null;


// --- Validation Schemas ---
const ProfileUpdateSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  displayUsername: z.string().optional(),
  // Add image validation if needed
});

const UsernameUpdateSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.'),
});


// --- Helper Functions ---
async function getUser(): Promise<User> { // Return User directly or throw
  // Corrected: Use auth.api.getSession with headers
  const readonlyHeaders = await headers(); // Await based on TS behavior
  const mutableHeaders = new Headers(readonlyHeaders);
  const authResult: AuthResult = await auth.api.getSession({ headers: mutableHeaders });

  if (!authResult?.user) {
    throw new Error('Not authenticated');
  }
  return authResult.user;
}

// --- Server Actions ---

export async function updateProfile(formData: FormData) {
  try {
    const user = await getUser(); // Now uses the corrected helper
    const data = ProfileUpdateSchema.parse({
      name: formData.get('name') as string | undefined,
      displayUsername: formData.get('displayUsername') as string | undefined,
      // Parse image data if implementing image upload
    });

    const updateData: Partial<typeof userSchema.$inferInsert> = {};
    if (data.name) updateData.name = data.name;
    if (data.displayUsername) updateData.displayUsername = data.displayUsername;
    // Add image update logic here if needed

    if (Object.keys(updateData).length > 0) {
        await db.update(userSchema)
            .set({ ...updateData, updatedAt: new Date() })
            .where(eq(userSchema.id, user.id));
    }

    revalidatePath('/account');
    return { success: true, message: 'Profile updated successfully.' };
  } catch (error) {
    console.error("Error updating profile:", error);
    if (error instanceof z.ZodError) {
        return { success: false, message: 'Validation failed.', errors: error.flatten().fieldErrors };
    }
    // Catch specific auth error if user is not found by getUser()
    if (error instanceof Error && error.message === 'Not authenticated') {
        return { success: false, message: 'Authentication required.' };
    }
    return { success: false, message: 'Failed to update profile.' };
  }
}

export async function updateUsername(newUsername: string) {
    try {
        const user = await getUser();
        const validation = UsernameUpdateSchema.safeParse({ username: newUsername });

        if (!validation.success) {
            return { success: false, message: 'Validation failed.', errors: validation.error.flatten().fieldErrors };
        }

        // Check if username is already taken (case-insensitive check recommended for usernames)
        const existingUser = await db.select({ id: userSchema.id })
            .from(userSchema)
            .where(eq(userSchema.username, newUsername.toLowerCase())) // Store/check lowercase
            .limit(1)
            .then(res => res[0]); // Get the first result or undefined


        if (existingUser && existingUser.id !== user.id) {
            return { success: false, message: 'Username is already taken.' };
        }

        await db.update(userSchema)
            .set({ username: newUsername.toLowerCase(), updatedAt: new Date() }) // Store lowercase
            .where(eq(userSchema.id, user.id));

        revalidatePath('/account');
        return { success: true, message: 'Username updated successfully.' };
    } catch (error) {
        console.error("Error updating username:", error);
        if (error instanceof Error && error.message === 'Not authenticated') {
            return { success: false, message: 'Authentication required.' };
        }
        return { success: false, message: 'Failed to update username.' };
    }
}


export async function revokeSession(sessionId: string) {
  try {
    const user = await getUser(); // Fetch user to ensure authentication before proceeding
    const session = await db.select({ userId: sessionSchema.userId })
        .from(sessionSchema)
        .where(eq(sessionSchema.id, sessionId))
        .limit(1)
        .then(res => res[0]);

    // Ensure the session exists and belongs to the currently authenticated user
    if (!session || session.userId !== user.id) {
        return { success: false, message: 'Session not found or permission denied.' };
    }

    await db.delete(sessionSchema).where(eq(sessionSchema.id, sessionId));
    revalidatePath('/account');
    return { success: true, message: 'Session revoked.' };
  } catch (error) {
    console.error("Error revoking session:", error);
     if (error instanceof Error && error.message === 'Not authenticated') {
        return { success: false, message: 'Authentication required.' };
    }
    return { success: false, message: 'Failed to revoke session.' };
  }
}

export async function resendVerificationEmail() {
  try {
    const user = await getUser();
    // Use the 'user' variable
    console.log(`Resending verification email for user ${user.id} (email: ${user.email}) (placeholder)`);
    // TODO: Implement actual email sending logic using better-auth or a mail service
    // Example: await auth.sendVerificationEmail(user.email); // Might need the 'auth' object from lib/auth for this
    return { success: true, message: 'Verification email sent (placeholder).' };
  } catch (error) {
    console.error("Error resending verification email:", error);
     if (error instanceof Error && error.message === 'Not authenticated') {
        return { success: false, message: 'Authentication required.' };
    }
    return { success: false, message: 'Failed to resend verification email.' };
  }
}

export async function deleteAccount() {
    try {
        const user = await getUser();
        console.log(`Attempting to delete account for user ${user.id} (placeholder)`);
        // Implement actual account deletion logic
        // Ensure cascading deletes are set up correctly in the DB schema or handle manually
        await db.delete(userSchema).where(eq(userSchema.id, user.id));
        // Sign the user out after deletion
        // await auth.signOut(); // Assuming better-auth has a signout method
        console.log(`Account deleted for user ${user.id} (placeholder)`);
        // Revalidation might not be needed if the user is redirected/signed out
        // revalidatePath('/'); // Or redirect
        return { success: true, message: 'Account deleted successfully (placeholder).' };
    } catch (error) {
        console.error("Error deleting account:", error);
         if (error instanceof Error && error.message === 'Not authenticated') {
            return { success: false, message: 'Authentication required.' };
        }
        return { success: false, message: 'Failed to delete account.' };
    }
}

// Placeholder for image update - requires storage setup
export async function updateProfileImage(imageUrl: string) {
    try {
        const user = await getUser();
        await db.update(userSchema)
            .set({ image: imageUrl, updatedAt: new Date() })
            .where(eq(userSchema.id, user.id));
        revalidatePath('/account');
        return { success: true, message: 'Profile image updated.' };
    } catch (error) {
        console.error("Error updating profile image:", error);
         if (error instanceof Error && error.message === 'Not authenticated') {
            return { success: false, message: 'Authentication required.' };
        }
        return { success: false, message: 'Failed to update profile image.' };
    }
}

// Placeholder for unlinking provider - complex, depends on better-auth capabilities
export async function unlinkProvider(providerId: string) {
    try {
        const user = await getUser();
        console.log(`Unlinking provider ${providerId} for user ${user.id} (placeholder)`);
        // Needs specific logic to remove the account link from the 'account' table
        // Ensure user has other login methods (e.g., password, another provider) before allowing unlink
        revalidatePath('/account');
        return { success: true, message: 'Provider unlinked (placeholder).' };
    } catch (error) {
        console.error("Error unlinking provider:", error);
         if (error instanceof Error && error.message === 'Not authenticated') {
            return { success: false, message: 'Authentication required.' };
        }
        return { success: false, message: 'Failed to unlink provider.' };
    }
}