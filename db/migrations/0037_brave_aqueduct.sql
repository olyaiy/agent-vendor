ALTER TABLE "user_transactions" ADD COLUMN "agent_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_transactions" ADD CONSTRAINT "user_transactions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_transactions_agent_id_idx" ON "user_transactions" USING btree ("agent_id");