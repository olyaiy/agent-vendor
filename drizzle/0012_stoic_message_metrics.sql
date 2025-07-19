ALTER TABLE "user" ADD COLUMN "message_count" integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_message_sent_at" timestamp;

