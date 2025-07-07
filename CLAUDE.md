# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands (always use PNPM For running commands)
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build application for production with Turbopack
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint checks

### Database Commands
- `pnpm db:generate` - Generate database migrations with Drizzle Kit
- `pnpm db:push` - Push database schema changes to database
- `pnpm db:studio` - Open Drizzle Studio for database management

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth with Google OAuth and Polar integration
- **AI/ML**: Multi-provider AI SDK supporting Anthropic, OpenAI, Google, Groq, DeepSeek, Mistral, Perplexity, and xAI
- **Styling**: Tailwind CSS with Radix UI components
- **File Storage**: AWS S3 integration

### Core Architecture

#### Agent System
The application is built around AI agents with configurable capabilities:
- **Agent Schema**: Agents have names, descriptions, system prompts, and welcome messages
- **Multi-Model Support**: Each agent can use multiple AI models (primary/secondary roles)
- **Tool Registry**: Centralized tool system in `tools/registry.ts` with tools like web search, code execution, chart creation, and image generation
- **Knowledge Base**: Agents can have associated knowledge items for RAG (Retrieval Augmented Generation)

#### Database Schema
- **Auth**: User authentication and session management via Better Auth
- **Agents**: Agent definitions with creator relationships and visibility settings
- **Chats**: Chat sessions with message history and attachments
- **Tools**: Available tools that can be assigned to agents
- **Transactions**: User credit system for usage tracking

#### Chat System
- **Real-time Chat**: Server-sent events for streaming AI responses
- **Multi-modal**: Support for text, images, and file attachments
- **Message History**: Persistent chat history with database storage
- **Tool Execution**: Agents can execute tools during conversations

#### Authentication & Authorization
- **Better Auth**: Modern authentication with Google OAuth
- **Polar Integration**: Subscription and billing management
- **User Credits**: Credit-based usage system
- **Admin System**: Admin roles and permissions

### Key Components

#### Frontend Structure
- `app/` - Next.js App Router pages and API routes
- `components/` - Reusable UI components organized by feature
- `components/chat/` - Chat-specific components (messages, input, history)
- `components/ui/` - Base UI components using Radix UI
- `hooks/` - Custom React hooks for state management

#### Backend Structure
- `app/api/` - API routes for chat, authentication, and integrations
- `db/` - Database layer with actions, repositories, and schemas
- `lib/` - Utility functions and configurations
- `tools/` - AI tool implementations

#### AI Integration
- **Multi-Provider Support**: Models from multiple AI providers
- **Tool Registry**: Centralized tool management system
- **Streaming**: Real-time response streaming
- **Usage Tracking**: Token counting and cost calculation

### Development Patterns

#### Database Operations
- Use repository pattern in `db/repository/` for data access
- Use actions in `db/actions/` for complex business logic
- Always use transactions for multi-table operations

#### Component Organization
- Feature-based component organization
- Shared UI components in `components/ui/`
- Custom hooks for complex state management

#### API Routes
- RESTful API design in `app/api/`
- Proper error handling and validation
- Authentication middleware for protected routes

### Environment Variables
Required environment variables are defined in the authentication and database configuration files. Key variables include:
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` - Google OAuth credentials
- `POLAR_ACCESS_TOKEN` - Polar API access token
- Various AI provider API keys for model access

### Testing & Development
- Use `pnpm db:studio` to inspect database during development
- Check `app/api/chat/route.ts` for chat API implementation
- Monitor database migrations in `drizzle/` directory
- Use ESLint configuration for code quality