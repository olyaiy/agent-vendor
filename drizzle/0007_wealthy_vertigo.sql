CREATE TABLE "agent_models" (
	"agent_id" text NOT NULL,
	"model_id" text NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "agent_models_agent_id_model_id_pk" PRIMARY KEY("agent_id","model_id")
);
--> statement-breakpoint
ALTER TABLE "agent_models" ADD CONSTRAINT "agent_models_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_models" ADD CONSTRAINT "agent_models_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_primary_model_per_agent" ON "agent_models" USING btree ("agent_id") WHERE "agent_models"."role" = 'primary';