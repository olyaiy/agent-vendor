CREATE TABLE IF NOT EXISTS "knowledge_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" jsonb NOT NULL,
	"type" varchar(50) DEFAULT 'text' NOT NULL,
	"description" text,
	"agent_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_title_idx" ON "knowledge_items" USING btree ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_agent_id_idx" ON "knowledge_items" USING btree ("agent_id");