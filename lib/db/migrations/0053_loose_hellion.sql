ALTER TABLE "User" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_created_at_idx" ON "User" USING btree ("created_at");