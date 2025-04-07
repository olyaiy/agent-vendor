DO $$ BEGIN
 CREATE TYPE "public"."token_type" AS ENUM('input', 'output');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "user_transactions" ADD COLUMN "token_amount" integer;--> statement-breakpoint
ALTER TABLE "user_transactions" ADD COLUMN "token_type" "token_type";--> statement-breakpoint
ALTER TABLE "Message" DROP COLUMN IF EXISTS "token_usage";