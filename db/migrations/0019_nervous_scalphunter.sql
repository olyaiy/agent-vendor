DO $$ BEGIN
 CREATE TYPE "public"."transaction_type" AS ENUM('usage', 'purchase', 'refund', 'promotional', 'adjustment');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" numeric(19, 9) NOT NULL,
	"type" "transaction_type" NOT NULL,
	"description" text,
	"message_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "credit_balance" numeric(19, 9) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "lifetime_credits" numeric(19, 9) DEFAULT '0';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_transactions" ADD CONSTRAINT "user_transactions_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_transactions" ADD CONSTRAINT "user_transactions_message_id_Message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."Message"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
