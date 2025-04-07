ALTER TYPE "transaction_type" ADD VALUE 'self_usage';--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "updated_at" timestamp;