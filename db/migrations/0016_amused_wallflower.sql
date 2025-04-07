ALTER TABLE "Message" ADD COLUMN "model_id" uuid;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "cost_per_million_tokens" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Message" ADD CONSTRAINT "Message_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
