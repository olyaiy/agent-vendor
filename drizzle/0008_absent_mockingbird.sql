ALTER TABLE "agent" DROP CONSTRAINT "agent_primary_model_id_models_id_fk";
--> statement-breakpoint
ALTER TABLE "agent" DROP COLUMN "primary_model_id";