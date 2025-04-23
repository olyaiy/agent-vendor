// app/agents/[agent-id]/page.tsx
import Chat from "@/components/chat";
import ChatMobile from "@/components/chat-mobile";
import {
  selectAgentWithModelBySlug,
  selectKnowledgeByAgentId,
  selectAllModels,
} from "@/db/repository/agent-repository";
import { generateUUID } from "@/lib/utils";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";

type Params = { "agent-id": string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  
  // Get the agent slug from the URL parameters
  const slug = params["agent-id"];
  const agent = await selectAgentWithModelBySlug(slug);
  if (!agent) {
    return { title: "Agent Not Found" };
  }

    // 1) never-null string or undefined
    const description = agent.description ?? undefined;
    const imageUrl   = agent.thumbnailUrl ?? undefined;
  
    // 2) start building a Metadata object
    const meta: Metadata = {
      title: agent.name,
    };
  
    // top-level description
    if (description) {
      meta.description = description;
    }
  
    // icons
    if (imageUrl) {
      meta.icons = {
        icon:  imageUrl,
        apple: imageUrl,
      };
    }
  
    // open graph
    meta.openGraph = {
      title:       agent.name,
      // these two lines only include the keys if they're defined
      ...(description && { description }),
      ...(imageUrl   && { images: [imageUrl] }),
    };
  
    // twitter
    meta.twitter = {
      card:  "summary_large_image",
      title: agent.name,
      ...(description && { description }),
      ...(imageUrl   && { images: [imageUrl] }),
    };
  
    return meta;
  
}

export default async function Page({ params }: { params: Params }) {
  const slug = params["agent-id"];
  const agent = await selectAgentWithModelBySlug(slug);
  if (!agent) notFound();

  // now that we know the real UUID, fetch the knowledge rows
  const [knowledgeItems, models] = await Promise.all([
    selectKnowledgeByAgentId(agent.id),
    selectAllModels(),
  ]);

  const chatId = generateUUID();
  const ua = (await headers()).get("user-agent") || "";
  const isMobile = /Mobile|Android|iP(hone|od|ad)|IEMobile|Opera Mini/i.test(ua);

  return isMobile ? (
    <div className="h-screen pb-12 w-screen">
      <ChatMobile agent={agent} knowledgeItems={knowledgeItems} models={models} chatId={chatId} />
    </div>
  ) : (
    <Chat agent={agent} knowledgeItems={knowledgeItems} models={models} chatId={chatId} />
  );
}
