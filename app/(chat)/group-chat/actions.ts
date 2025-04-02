'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createGroupChatWithAgents } from '@/lib/db/repositories/chatRepository';
import { auth } from '@/app/(auth)/auth';

// Schema for validating form data
const CreateGroupChatSchema = z.object({
  groupChatName: z.string().min(1, 'Group chat name is required.'),
  // Optional description - validation can be added if needed
  description: z.string().optional(), 
  selectedAgentIds: z.array(z.string().uuid()).min(1, 'At least one agent must be selected.'),
  userId: z.string().uuid(), // Ensure userId is passed and validated
});

interface CreateGroupChatState {
  message?: string | null;
  error?: string | null;
  newGroupChatId?: string | null;
}

export async function createGroupChatAction(
  _prevState: CreateGroupChatState | undefined,
  formData: FormData,
): Promise<CreateGroupChatState> {
  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    return { error: 'User not authenticated.' };
  }

  const agentIds = formData.getAll('selectedAgentIds') as string[]; // Get all selected agent IDs

  const validatedFields = CreateGroupChatSchema.safeParse({
    groupChatName: formData.get('groupChatName'),
    description: formData.get('description'),
    selectedAgentIds: agentIds, // Use the extracted array
    userId: currentUserId, // Use the authenticated user ID
  });

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return {
      error: 'Invalid form data. Please check the fields.',
      // Optionally, return specific field errors if needed for UI
    };
  }

  const { groupChatName, selectedAgentIds, userId } = validatedFields.data;

  try {
    const newChatId = await createGroupChatWithAgents(
      userId,
      groupChatName,
      selectedAgentIds,
    );

    if (!newChatId) {
      return { error: 'Failed to create group chat in database.' };
    }

    // Invalidate cache or revalidate relevant paths if needed
    // revalidatePath('/group-chat'); // Example

    // Redirect on success is handled in the component using the returned ID
    return { message: 'Group chat created successfully!', newGroupChatId: newChatId };

  } catch (error) {
    console.error('Error creating group chat:', error);
    return { error: 'An unexpected error occurred while creating the group chat.' };
  }
}
