ALTER TABLE "agent" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_slug_unique" UNIQUE("slug");