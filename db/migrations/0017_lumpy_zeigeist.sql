ALTER TABLE "models" RENAME COLUMN "cost_per_million_tokens" TO "cost_per_million_input_tokens";--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "cost_per_million_output_tokens" integer;