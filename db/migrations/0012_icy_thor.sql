CREATE TABLE IF NOT EXISTS "tool_group_tools" (
	"tool_group_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	CONSTRAINT "tool_group_tools_tool_group_id_tool_id_pk" PRIMARY KEY("tool_group_id","tool_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tool_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"description" text,
	"creator_id" uuid,
	CONSTRAINT "tool_groups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_group_tools" ADD CONSTRAINT "tool_group_tools_tool_group_id_tool_groups_id_fk" FOREIGN KEY ("tool_group_id") REFERENCES "public"."tool_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_group_tools" ADD CONSTRAINT "tool_group_tools_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tool_groups" ADD CONSTRAINT "tool_groups_creator_id_User_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
