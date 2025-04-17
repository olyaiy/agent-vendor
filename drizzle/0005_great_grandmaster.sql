ALTER TABLE "agent" DROP CONSTRAINT "agent_primary_model_id_models_id_fk";
--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_primary_model_id_models_id_fk" FOREIGN KEY ("primary_model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "model_name_idx" ON "models" USING btree ("model");