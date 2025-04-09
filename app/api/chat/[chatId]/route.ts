import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth'; // Use path alias
import { getChatById } from '@/db/repository/chat-repository'; // Use path alias

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;

  if (!chatId) {
    return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
  }

  // Get the session
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // If the user is not logged in, return an error
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const chat = await getChatById(chatId);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if the logged-in user owns the chat
    if (chat.userId !== session.user.id) {
      // Optionally allow access based on visibility, e.g., if chat.visibility === 'public'
      // For now, strict ownership check
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return the chat details
    return NextResponse.json(chat);

  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
