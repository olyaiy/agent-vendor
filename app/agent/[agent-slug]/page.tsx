// app/agent/[agent-slug]/page.tsx
import Chat from "@/components/chat";
import ChatMobile from "@/components/chat-mobile";
import { generateUUID } from "@/lib/utils";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { selectAgentBySlug, selectAgentKnowledgeBySlug, selectAgentModelsBySlug } from "@/db/repository"; // Removed selectAgentTagsBySlug
import type { AgentSpecificModel } from '@/components/chat'; // Import the type definition from Chat component

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
  const agent = await selectAgentBySlug(agentSlug); 
  if (!agent) notFound();

  // 3. Fetch Agent Models (returns AgentModelWithDetails: agentId, modelId, role, model, description)
  const rawAgentModels = await selectAgentModelsBySlug(agentSlug);
  // Removed unused selectAllModels call

  // 4. Fetch Knowledge Items
  const knowledgeItems = await selectAgentKnowledgeBySlug(agentSlug);

  // Removed unused tags fetching
  // const tags = await selectAgentTagsBySlug(agentSlug);

  // 6. Transform rawAgentModels into the AgentSpecificModel structure expected by Chat component
  const agentModelsForChat: AgentSpecificModel[] = rawAgentModels.map(rawModel => ({
    agentId: rawModel.agentId,
    modelId: rawModel.modelId,
    role: rawModel.role,
    model: rawModel.model, // The model string name
    description: rawModel.description, // Optional description
    id: rawModel.modelId // Add the id alias required by AgentSpecificModel
  }));


  // --- Chat ---
  const chatId = generateUUID();
  const ua = (await headers()).get("user-agent") || "";
  const isMobile = /Mobile|Android|iP(hone|od|ad)|IEMobile|Opera Mini/i.test(ua);

  return isMobile ? (
    <div className="h-screen pb-12 w-screen">
      <ChatMobile agent={agent} knowledgeItems={knowledgeItems} 
      agentModels={agentModelsForChat} chatId={chatId} />
    </div>
  ) : (
    <>
    
    <Chat
    agent={agent} // Pass agent directly as ChatProps expects Agent type
    knowledgeItems={knowledgeItems}
    agentModels={agentModelsForChat} // Pass the transformed data
    chatId={chatId}
    />
   
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
