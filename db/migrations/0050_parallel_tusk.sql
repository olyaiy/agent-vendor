CREATE INDEX IF NOT EXISTS "agent_models_is_default_idx" ON "agent_models" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agents_visibility_creator_idx" ON "agents" USING btree ("visibility","creator_id");--> statement-breakpoint
ALTER TABLE "agents" DROP COLUMN IF EXISTS "settings";