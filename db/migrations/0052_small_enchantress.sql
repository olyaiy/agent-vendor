CREATE INDEX IF NOT EXISTS "credit_balance_idx" ON "user_credits" USING btree ("user_id","credit_balance");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_transactions_user_created_idx" ON "user_transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_amount_type_idx" ON "user_transactions" USING btree ("amount","type");