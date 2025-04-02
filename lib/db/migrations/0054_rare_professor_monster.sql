CREATE TABLE IF NOT EXISTS "GroupChat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp NOT NULL,
	"title" text NOT NULL,
	"userId" uuid NOT NULL,
	"visibility" varchar DEFAULT 'private' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "GroupChatAgents" (
	"groupChatId" uuid NOT NULL,
	"agentId" uuid NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "GroupChatAgents_groupChatId_agentId_pk" PRIMARY KEY("groupChatId","agentId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GroupChat" ADD CONSTRAINT "GroupChat_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GroupChatAgents" ADD CONSTRAINT "GroupChatAgents_groupChatId_GroupChat_id_fk" FOREIGN KEY ("groupChatId") REFERENCES "public"."GroupChat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GroupChatAgents" ADD CONSTRAINT "GroupChatAgents_agentId_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "group_chat_user_id_idx" ON "GroupChat" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "group_chat_created_at_idx" ON "GroupChat" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "group_chat_agents_gc_id_idx" ON "GroupChatAgents" USING btree ("groupChatId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "group_chat_agents_agent_id_idx" ON "GroupChatAgents" USING btree ("agentId");