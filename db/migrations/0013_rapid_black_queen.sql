CREATE TABLE IF NOT EXISTS "agent_tool_groups" (
	"agent_id" uuid NOT NULL,
	"tool_group_id" uuid NOT NULL,
	CONSTRAINT "agent_tool_groups_agent_id_tool_group_id_pk" PRIMARY KEY("agent_id","tool_group_id")
);
--> statement-breakpoint
DROP TABLE "agent_tools";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_tool_groups" ADD CONSTRAINT "agent_tool_groups_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_tool_groups" ADD CONSTRAINT "agent_tool_groups_tool_group_id_tool_groups_id_fk" FOREIGN KEY ("tool_group_id") REFERENCES "public"."tool_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "tools" DROP COLUMN IF EXISTS "provider";