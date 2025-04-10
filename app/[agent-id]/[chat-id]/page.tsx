import Chat from "@/components/chat";
import { selectAgentWithModelById, selectKnowledgeByAgentId } from "@/db/repository/agent-repository"; // Added selectKnowledgeByAgentId
import { getChatById, getMessagesByChatId } from "@/db/repository/chat-repository";
import { DBMessage } from "@/db/schema/chat";
import { auth } from "@/lib/auth";
import { parseAgentSlug } from "@/lib/utils";
import { Attachment, UIMessage } from "ai";
import { headers } from "next/headers";
import { notFound } from "next/navigation";


export default async function Page({
  params,
}: {
  params: Promise<{ "agent-id": string; "chat-id": string }>;
}) {

  // Get the agent id and chat id from the url
  const { "agent-id": agentIdParam, "chat-id": chatId } = await params;
  const { agentId } = parseAgentSlug(agentIdParam);


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


  // Fetch agent and knowledge items in parallel for efficiency
  const [agent, knowledgeItems] = await Promise.all([
    selectAgentWithModelById(agentId),
    selectKnowledgeByAgentId(agentId) // Fetch knowledge items
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



  return (
    <Chat 
    initialMessages={convertToUIMessages(messagesFromDb)}
    agent={agent} 
    knowledgeItems={knowledgeItems} 
    chatId={chatId}
    /> // Pass agent and knowledgeItems
  );
}
