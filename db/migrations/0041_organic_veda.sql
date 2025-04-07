CREATE TABLE IF NOT EXISTS "suggested_prompts" (
	"agent_id" uuid PRIMARY KEY NOT NULL,
	"prompts" jsonb DEFAULT '["What are the advantages of using Next.js?","Help me write an essay about silicon valley","Write code to demonstrate djikstra's algorithm","What is the weather in San Francisco?"]'::jsonb NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "suggested_prompts" ADD CONSTRAINT "suggested_prompts_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "suggested_prompts_agent_id_idx" ON "suggested_prompts" USING btree ("agent_id");