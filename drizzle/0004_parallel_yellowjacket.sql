ALTER TABLE "transaction" DROP CONSTRAINT "transaction_message_id_Message_id_fk";
--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_message_id_Message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."Message"("id") ON DELETE set null ON UPDATE no action;