ALTER TABLE "tags" DROP CONSTRAINT "tags_slug_unique";--> statement-breakpoint
ALTER TABLE "agent_tags" DROP CONSTRAINT "agent_tags_created_by_User_id_fk";
--> statement-breakpoint
ALTER TABLE "tags" DROP CONSTRAINT "tags_category_id_tag_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "tags" DROP CONSTRAINT "tags_creator_id_User_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "tags_slug_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "tags_category_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "tags_creator_id_idx";--> statement-breakpoint
ALTER TABLE "agent_tags" DROP COLUMN IF EXISTS "created_by";--> statement-breakpoint
ALTER TABLE "tags" DROP COLUMN IF EXISTS "slug";--> statement-breakpoint
ALTER TABLE "tags" DROP COLUMN IF EXISTS "description";--> statement-breakpoint
ALTER TABLE "tags" DROP COLUMN IF EXISTS "category_id";--> statement-breakpoint
ALTER TABLE "tags" DROP COLUMN IF EXISTS "creator_id";--> statement-breakpoint
ALTER TABLE "tags" DROP COLUMN IF EXISTS "source";--> statement-breakpoint
ALTER TABLE "tags" DROP COLUMN IF EXISTS "is_public";--> statement-breakpoint
ALTER TABLE "tags" DROP COLUMN IF EXISTS "usage_count";