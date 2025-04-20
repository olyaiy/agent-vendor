import Chat from "@/components/chat";
import ChatMobile from "@/components/chat-mobile";
import { selectAgentWithModelById, selectKnowledgeByAgentId, selectAllModels } from "@/db/repository/agent-repository"; // Added selectAllModels
import { getChatById, getMessagesByChatId } from "@/db/repository/chat-repository";
import { DBMessage } from "@/db/schema/chat";
import { auth } from "@/lib/auth";

import { Attachment, UIMessage } from "ai";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from 'next';



type Props = {
  params: Promise<{ 'agent-id': string; 'chat-id': string }>; // Updated type
};

export async function generateMetadata(
  { params }: Props,
): Promise<Metadata> {
  // read route params
  const { 'agent-id': agentId } = await params; // Updated access

  // fetch data
  const agent = await selectAgentWithModelById(agentId);

  if (!agent) {
    return {
      title: 'Agent Not Found',
    };
  }

  const description = agent.description; // TODO: Add fallback description if needed
  const imageUrl = agent.thumbnailUrl; // TODO: Add fallback icon if needed

  return {
    title: agent.name, // Use agent name as requested
    ...(description && { description: description }), // Only add description if it exists
    ...(imageUrl && { // Only add icons if imageUrl exists
      icons: {
        icon: imageUrl,
        apple: imageUrl,
      },
    }),
    openGraph: {
      title: agent.name,
      ...(description && { description: description }), // Use description if available
      ...(imageUrl && { images: [imageUrl] }), // Use image if available
    },
    twitter: {
      card: 'summary_large_image',
      title: agent.name,
      ...(description && { description: description }), // Use description if available
      ...(imageUrl && { images: [imageUrl] }), // Use image if available
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ "agent-id": string; "chat-id": string }>;
}) {

  // Get the agent id and chat id from the url
  const { "agent-id": agentId, "chat-id": chatId } = await params;



  // Fetch the chat from the database
  const chat = await getChatById(chatId);
  if (!chat) {
    notFound();
  }

  // Get the session
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // Check if the user is the owner of the chat
  if (session?.user?.id !== chat.userId) {
    return notFound();
  }


  // Fetch agent, knowledge items, and all models in parallel
  const [agent, knowledgeItems, models] = await Promise.all([
    selectAgentWithModelById(agentId),
    selectKnowledgeByAgentId(agentId), // Fetch knowledge items
    selectAllModels() // Fetch all models
  ]);

  if (!agent) {
    notFound();
  }


  
  const messagesFromDb = await getMessagesByChatId({
    id: chatId,
  });





  function convertToUIMessages(messages: Array<DBMessage>): Array<UIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage['parts'],
      role: message.role as UIMessage['role'],
      // Extract clean text content from parts
      content: (message.parts as UIMessage['parts'])
        .map(part => {
          if (part.type === 'text') return part.text;
          if (part.type === 'tool-invocation') {
            const result = part.toolInvocation.state === 'result' 
              ? part.toolInvocation.result 
              : null;
            // Extract relevant content from search results
            if (result?.results) {
              return result.results
                .slice(0, 3) // Show top 3 results
                .map((r: { title: string; content: string }) => `${r.title}\n${r.content}`)
                .join('\n\n');
            }
            return '';
          }
          return '';
        })
        .filter(Boolean)
        .join('\n'),
      createdAt: message.createdAt,
      experimental_attachments:
        (message.attachments as Array<Attachment>) ?? [],
    }));
  }



  const initialMessages = convertToUIMessages(messagesFromDb);

 // Ownership check happens in the client component (Chat)

 const ua = (await headers()).get("user-agent") ?? "";
 const isMobile = /Mobile|Android|iP(hone|od|ad)|BlackBerry|IEMobile|Opera Mini/i.test(ua);

 return isMobile ? (
   <div className="h-screen pb-12 w-screen">
   <ChatMobile
     agent={agent}
     knowledgeItems={knowledgeItems}
     models={models}
     chatId={chatId}
      initialMessages={initialMessages}
     />
   </div>
 ) : (
   <Chat
     agent={agent}
     knowledgeItems={knowledgeItems}
     models={models} // Pass models list
     chatId={chatId}
      initialMessages={initialMessages}
   />
 );
}
