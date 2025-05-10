CREATE TYPE "public"."tool_type" AS ENUM('basetool', 'sequence', 'api');--> statement-breakpoint
CREATE TABLE "agent_tools" (
	"agent_id" text NOT NULL,
	"tool_id" text NOT NULL,
	CONSTRAINT "agent_tools_agent_id_tool_id_pk" PRIMARY KEY("agent_id","tool_id")
);
--> statement-breakpoint
CREATE TABLE "tools" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"displayName" text,
	"description" text,
	"creator_id" text,
	"type" "tool_type" NOT NULL,
	"definition" jsonb,
	"input_schema" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_tools" ADD CONSTRAINT "agent_tools_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_tools" ADD CONSTRAINT "agent_tools_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tools_name_idx" ON "tools" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tools_creator_id_idx" ON "tools" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "tools_type_idx" ON "tools" USING btree ("type");