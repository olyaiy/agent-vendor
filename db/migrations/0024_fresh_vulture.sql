CREATE TABLE IF NOT EXISTS "customer" (
	"id" uuid PRIMARY KEY NOT NULL,
	"stripe_customer_id" varchar(100),
	"email" varchar(64)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer" ADD CONSTRAINT "customer_id_User_id_fk" FOREIGN KEY ("id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
