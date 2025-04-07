CREATE TABLE IF NOT EXISTS "agent_models" (
	"agent_id" uuid NOT NULL,
	"model_id" uuid NOT NULL,
	"is_default" boolean DEFAULT false,
	CONSTRAINT "agent_models_agent_id_model_id_pk" PRIMARY KEY("agent_id","model_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agents" DROP CONSTRAINT "agents_model_models_id_fk";
EXCEPTION
 WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_models" ADD CONSTRAINT "agent_models_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_models" ADD CONSTRAINT "agent_models_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agents" DROP COLUMN IF EXISTS "model";
EXCEPTION
 WHEN undefined_column THEN null;
END $$;