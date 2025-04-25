// app/agent/[agent-slug]/page.tsx
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
import { selectAgentBySlug, selectAgentKnowledgeBySlug, selectAgentModelsBySlug, selectAgentTagsBySlug } from "@/db/repository";

type Params = { "agent-slug": string };

export default async function Page({
  params,                  
}: {
  params: Promise<Params>;
}) {


  // 1. Await the params promise
  const resolvedParams = await params;
  const agentSlug = resolvedParams["agent-slug"];

  // 2. Fetch Agent Details using the resolved slug
  const agent = await selectAgentBySlug(agentSlug); // Use selectAgentBySlug
  if (!agent) notFound();

  // 3. Fetch Agent Models (Removed as unused for now)
  const agentModels = await selectAgentModelsBySlug(agentSlug);
  const allModels = await selectAllModels();

  // 4. Fetch Knowledge Items (Removed as unused for now)
  const knowledgeItems = await selectAgentKnowledgeBySlug(agentSlug);

  // 5. Fetch Tags (Removed as unused for now)
  const tags = await selectAgentTagsBySlug(agentSlug);






  // --- Chat ---
  const chatId = generateUUID();
  const ua = (await headers()).get("user-agent") || "";
  const isMobile = /Mobile|Android|iP(hone|od|ad)|IEMobile|Opera Mini/i.test(ua);

  return isMobile ? (
    <div className="h-screen pb-12 w-screen">
      {/* <ChatMobile agent={agent} knowledgeItems={knowledgeItems} models={models} chatId={chatId} /> */}
    </div>
  ) : (
    <>
    {/* 
    <Chat 
    agent={agent} 
    knowledgeItems={knowledgeItems} 
    models={models} 
    chatId={chatId} 
    /> 
    */}
    </>
  );
}







type GenerateMetadataProps = {
  params: Promise<Params>;
};

// Function to generate metadata for the agent page
export async function generateMetadata(
  { params }: GenerateMetadataProps
): Promise<Metadata> {
  
  
  // Get the agent slug from the URL parameters
  const { "agent-slug": slug } = await params;

  const agent = await selectAgentBySlug(slug);
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
