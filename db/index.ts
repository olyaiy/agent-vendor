// Re-export the database client
export * from './client';

// Re-export all repository functions for backward compatibility
export * from './repositories/userRepository';
export * from './repositories/chatRepository';
export * from './repositories/messageRepository';
export * from './repositories/documentRepository';
export * from './repositories/agentRepository';
export * from './repositories/tagRepository';
export * from './repositories/modelRepository';
export * from './repositories/toolRepository';
export * from './repositories/transactionRepository';
export * from './repositories/knowledgeRepository';

// TODO: Add exports from other repositories as they are implemented
// export * from './repositories/transactionRepository';
// export * from './repositories/knowledgeRepository';
// etc.

// Re-export all schema
export * from './schema'; 