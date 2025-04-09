import { selectAgentById, selectKnowledgeByAgentId } from "@/db/repository/agent-repository";
import { getAllModels } from "@/db/actions/agent-actions"; // Import action to get models
import { parseAgentSlug } from "@/lib/utils";
import { notFound } from "next/navigation";
import { EditAgentForm } from "./edit-agent-form"; // Import the new form component
import { Knowledge, Model } from "@/db/schema/agent"; // Import Model type

export default async function Page({
    params,
}: {
    params: Promise<{ "agent-id": string }>;
}) {
    const { "agent-id": agentIdParam } = await params;
    const { agentId } = parseAgentSlug(agentIdParam);
    const [agent, modelsResult, knowledgeResult] = await Promise.all([
        selectAgentById(agentId),
        getAllModels(),
        selectKnowledgeByAgentId(agentId) // Add knowledge fetch to parallel promise
        // auth() // Removed session fetching as it's unused
    ]);

    if (!agent) {
        notFound();
    }

    // Optional: Check if the logged-in user is the creator (requires fetching session)
    // const session = await auth(); // Example: Fetch session if needed
    // if (!session?.user || session.user.id !== agent.creatorId) { ... }

    if (!modelsResult.success || !modelsResult.data) {
        // Handle error fetching models, maybe show a message
        console.error("Failed to fetch models:", modelsResult.error);
        // Render the form without models or show an error state
        return <div>Error loading agent settings. Could not fetch AI models.</div>;
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

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Optional: Add a header or breadcrumbs */}
            <h1 className="text-2xl font-semibold mb-6">Agent Settings</h1>
            <EditAgentForm 
                agent={agent} 
                models={models}
                knowledge={knowledge as Knowledge[]} // Pass knowledge to form
            />
        </div>
    );
}