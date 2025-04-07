CREATE TABLE IF NOT EXISTS "agent_tools" (
	"agent_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	CONSTRAINT "agent_tools_agent_id_tool_id_pk" PRIMARY KEY("agent_id","tool_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_display_name" varchar(255) NOT NULL,
	"tool" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"description" text,
	"parameter_schema" json,
	"config" json,
	CONSTRAINT "tools_tool_unique" UNIQUE("tool")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_tools" ADD CONSTRAINT "agent_tools_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_tools" ADD CONSTRAINT "agent_tools_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
