import { selectAgentById, selectKnowledgeByAgentId } from "@/db/repository/agent-repository";
import { getAllModels, getAllTagsAction, getTagsForAgentAction } from "@/db/actions/agent-actions"; // Import actions
import { Tag } from "@/db/schema/agent"; // Import Tag type
import { notFound } from "next/navigation";
import { EditAgentForm } from "./edit-agent-form"; // Import the new form component
import { Knowledge, Model } from "@/db/schema/agent"; // Import types

export default async function Page({
    params,
}: {
    params: Promise<{ "agent-id": string }>;
}) {
    const { "agent-id": agentId } = await params;
    const [agent, modelsResult, knowledgeResult, allTagsResult, agentTagsResult] = await Promise.all([
        selectAgentById(agentId),
        getAllModels(),
        selectKnowledgeByAgentId(agentId),
        getAllTagsAction(), // Fetch all available tags
        getTagsForAgentAction(agentId) // Fetch tags for this specific agent
    ]);

    if (!agent) {
        notFound();
    }

    // Optional: Check if the logged-in user is the creator (requires fetching session)
    // const session = await auth(); // Example: Fetch session if needed
    // if (!session?.user || session.user.id !== agent.creatorId) { ... }

    if (!modelsResult.success || !modelsResult.data) {
        console.error("Failed to fetch models");
        return <div>Error loading agent settings. Could not fetch AI models.</div>;
    }
    if (!allTagsResult.success || !allTagsResult.data) {
        console.error("Failed to fetch all tags");
        return <div>Error loading agent settings. Could not fetch tags.</div>;
    }

    if (!agentTagsResult.success || !agentTagsResult.data) {
        console.error("Failed to fetch agent tags");
        return <div>Error loading agent settings. Could not fetch agent&apos;s current tags.</div>;
    }

    const models = modelsResult.data.map((model: Model) => ({
        id: model.id,
        model: model.model,
        description: model.description
    }));

    const knowledge = knowledgeResult.map(knowledge => ({
        id: knowledge.id,
        title: knowledge.title,
        content: knowledge.content,
        sourceUrl: knowledge.sourceUrl
    }));

    // Format tags for the multiselect component
    const allTagsOptions = allTagsResult.data.map((tag: Tag) => ({
        value: tag.id,
        label: tag.name,
    }));

    const currentAgentTags = agentTagsResult.data.map((tag: Tag) => ({
        value: tag.id,
        label: tag.name,
    }));

    return (
        <div className="container mx-auto px-4 py-8 ">
            {/* Optional: Add a header or breadcrumbs */}
            <h1 className="text-2xl font-semibold mb-6">Agent Settings</h1>
            <EditAgentForm 
                agent={agent} 
                models={models}
                knowledge={knowledge as Knowledge[]}
                allTags={allTagsOptions} // Pass all available tags
                currentTags={currentAgentTags} // Pass currently selected tags
            />
        </div>
    );
}