import { pgTable, foreignKey, uuid, timestamp, text, varchar, json, boolean, unique, primaryKey, pgEnum } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const modelType = pgEnum("model_type", ['text-large', 'text-small', 'reasoning', 'image', 'search'])
export const visibility = pgEnum("visibility", ['public', 'private', 'link'])



export const chat = pgTable("Chat", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	title: text().notNull(),
	userId: uuid().notNull(),
	visibility: varchar().default('private').notNull(),
	agentId: uuid(),
},
(table) => {
	return {
		chatUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Chat_userId_User_id_fk"
		}),
		chatAgentIdAgentsIdFk: foreignKey({
			columns: [table.agentId],
			foreignColumns: [agents.id],
			name: "Chat_agentId_agents_id_fk"
		}).onDelete("cascade"),
	}
});

export const user = pgTable("User", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 64 }).notNull(),
	password: varchar({ length: 64 }),
});

export const message = pgTable("Message", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid().notNull(),
	role: varchar().notNull(),
	content: json().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
},
(table) => {
	return {
		messageChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Message_chatId_Chat_id_fk"
		}).onDelete("cascade"),
	}
});

export const suggestion = pgTable("Suggestion", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	documentId: uuid().notNull(),
	documentCreatedAt: timestamp({ mode: 'string' }).notNull(),
	originalText: text().notNull(),
	suggestedText: text().notNull(),
	description: text(),
	isResolved: boolean().default(false).notNull(),
	userId: uuid().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
},
(table) => {
	return {
		suggestionUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Suggestion_userId_User_id_fk"
		}),
		suggestionDocumentIdDocumentCreatedAtDocumentIdCreatedAtF: foreignKey({
			columns: [table.documentId, table.documentCreatedAt],
			foreignColumns: [document.id, document.createdAt],
			name: "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_f"
		}),
	}
});

export const agents = pgTable("agents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	agent: varchar({ length: 255 }).default('temp_slug').notNull(),
	agentDisplayName: varchar("agent_display_name", { length: 255 }).notNull(),
	systemPrompt: text("system_prompt").notNull(),
	description: text(),
	visibility: visibility().default('public'),
	creatorId: uuid("creator_id"),
	artifactsEnabled: boolean("artifacts_enabled").default(true),
	thumbnailUrl: text("thumbnail_url"),
},
(table) => {
	return {
		agentsCreatorIdUserIdFk: foreignKey({
			columns: [table.creatorId],
			foreignColumns: [user.id],
			name: "agents_creator_id_User_id_fk"
		}),
		agentsAgentUnique: unique("agents_agent_unique").on(table.agent),
	}
});

export const models = pgTable("models", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	modelDisplayName: varchar("model_display_name", { length: 255 }).notNull(),
	model: varchar({ length: 255 }).notNull(),
	provider: varchar({ length: 255 }).notNull(),
	modelType: modelType("model_type").default('text-small'),
	description: text(),
},
(table) => {
	return {
		modelsModelUnique: unique("models_model_unique").on(table.model),
	}
});

export const tools = pgTable("tools", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	toolDisplayName: varchar("tool_display_name", { length: 255 }).notNull(),
	tool: varchar({ length: 255 }).notNull(),
	provider: varchar({ length: 255 }).notNull(),
	description: text(),
	parameterSchema: json("parameter_schema"),
	config: json(),
},
(table) => {
	return {
		toolsToolUnique: unique("tools_tool_unique").on(table.tool),
	}
});

export const agentTools = pgTable("agent_tools", {
	agentId: uuid("agent_id").notNull(),
	toolId: uuid("tool_id").notNull(),
},
(table) => {
	return {
		agentToolsAgentIdAgentsIdFk: foreignKey({
			columns: [table.agentId],
			foreignColumns: [agents.id],
			name: "agent_tools_agent_id_agents_id_fk"
		}).onDelete("cascade"),
		agentToolsToolIdToolsIdFk: foreignKey({
			columns: [table.toolId],
			foreignColumns: [tools.id],
			name: "agent_tools_tool_id_tools_id_fk"
		}).onDelete("cascade"),
		agentToolsAgentIdToolIdPk: primaryKey({ columns: [table.agentId, table.toolId], name: "agent_tools_agent_id_tool_id_pk"}),
	}
});

export const vote = pgTable("Vote", {
	chatId: uuid().notNull(),
	messageId: uuid().notNull(),
	isUpvoted: boolean().notNull(),
},
(table) => {
	return {
		voteChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Vote_chatId_Chat_id_fk"
		}).onDelete("cascade"),
		voteMessageIdMessageIdFk: foreignKey({
			columns: [table.messageId],
			foreignColumns: [message.id],
			name: "Vote_messageId_Message_id_fk"
		}).onDelete("cascade"),
		voteChatIdMessageIdPk: primaryKey({ columns: [table.chatId, table.messageId], name: "Vote_chatId_messageId_pk"}),
	}
});

export const agentModels = pgTable("agent_models", {
	agentId: uuid("agent_id").notNull(),
	modelId: uuid("model_id").notNull(),
	isDefault: boolean("is_default").default(false),
},
(table) => {
	return {
		agentModelsAgentIdAgentsIdFk: foreignKey({
			columns: [table.agentId],
			foreignColumns: [agents.id],
			name: "agent_models_agent_id_agents_id_fk"
		}).onDelete("cascade"),
		agentModelsModelIdModelsIdFk: foreignKey({
			columns: [table.modelId],
			foreignColumns: [models.id],
			name: "agent_models_model_id_models_id_fk"
		}).onDelete("cascade"),
		agentModelsAgentIdModelIdPk: primaryKey({ columns: [table.agentId, table.modelId], name: "agent_models_agent_id_model_id_pk"}),
	}
});

export const document = pgTable("Document", {
	id: uuid().defaultRandom().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	title: text().notNull(),
	content: text(),
	text: varchar().default('text').notNull(),
	userId: uuid().notNull(),
},
(table) => {
	return {
		documentUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Document_userId_User_id_fk"
		}),
		documentIdCreatedAtPk: primaryKey({ columns: [table.id, table.createdAt], name: "Document_id_createdAt_pk"}),
	}
});