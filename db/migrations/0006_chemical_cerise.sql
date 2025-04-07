DO $$ BEGIN
 CREATE TYPE "public"."model_type" AS ENUM('text-large', 'text-small', 'reasoning', 'image', 'search');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "model_type" "model_type" DEFAULT 'text-small';