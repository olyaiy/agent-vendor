CREATE TABLE IF NOT EXISTS "user_credits" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"credit_balance" numeric(19, 9) DEFAULT '0',
	"lifetime_credits" numeric(19, 9) DEFAULT '0'
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "credit_balance";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "lifetime_credits";