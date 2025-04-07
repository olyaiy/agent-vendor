import { relations } from "drizzle-orm/relations";
import { user, chat, agents, message, suggestion, document, agentTools, tools, vote, agentModels, models } from "./schema";

export const chatRelations = relations(chat, ({one, many}) => ({
	user: one(user, {
		fields: [chat.userId],
		references: [user.id]
	}),
	agent: one(agents, {
		fields: [chat.agentId],
		references: [agents.id]
	}),
	messages: many(message),
	votes: many(vote),
}));

export const userRelations = relations(user, ({many}) => ({
	chats: many(chat),
	suggestions: many(suggestion),
	agents: many(agents),
	documents: many(document),
}));

export const agentsRelations = relations(agents, ({one, many}) => ({
	chats: many(chat),
	user: one(user, {
		fields: [agents.creatorId],
		references: [user.id]
	}),
	agentTools: many(agentTools),
	agentModels: many(agentModels),
}));

export const messageRelations = relations(message, ({one, many}) => ({
	chat: one(chat, {
		fields: [message.chatId],
		references: [chat.id]
	}),
	votes: many(vote),
}));

export const suggestionRelations = relations(suggestion, ({one}) => ({
	user: one(user, {
		fields: [suggestion.userId],
		references: [user.id]
	}),
	document: one(document, {
		fields: [suggestion.documentId],
		references: [document.id]
	}),
}));

export const documentRelations = relations(document, ({one, many}) => ({
	suggestions: many(suggestion),
	user: one(user, {
		fields: [document.userId],
		references: [user.id]
	}),
}));

export const agentToolsRelations = relations(agentTools, ({one}) => ({
	agent: one(agents, {
		fields: [agentTools.agentId],
		references: [agents.id]
	}),
	tool: one(tools, {
		fields: [agentTools.toolId],
		references: [tools.id]
	}),
}));

export const toolsRelations = relations(tools, ({many}) => ({
	agentTools: many(agentTools),
}));

export const voteRelations = relations(vote, ({one}) => ({
	chat: one(chat, {
		fields: [vote.chatId],
		references: [chat.id]
	}),
	message: one(message, {
		fields: [vote.messageId],
		references: [message.id]
	}),
}));

export const agentModelsRelations = relations(agentModels, ({one}) => ({
	agent: one(agents, {
		fields: [agentModels.agentId],
		references: [agents.id]
	}),
	model: one(models, {
		fields: [agentModels.modelId],
		references: [models.id]
	}),
}));

export const modelsRelations = relations(models, ({many}) => ({
	agentModels: many(agentModels),
}));