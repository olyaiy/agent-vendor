ALTER TABLE "user_transactions" DROP CONSTRAINT "user_transactions_message_id_Message_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_transactions" ADD CONSTRAINT "user_transactions_message_id_Message_v2_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."Message_v2"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
