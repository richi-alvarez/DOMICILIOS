ALTER TABLE "custom_reports" ADD COLUMN "archived_at" timestamp;
--> statement-breakpoint
ALTER TABLE "custom_reports" ADD COLUMN "share_token" text UNIQUE;
--> statement-breakpoint
ALTER TABLE "custom_reports" ADD COLUMN "share_token_expires_at" timestamp;
--> statement-breakpoint
CREATE INDEX "custom_reports_archived_at_idx" ON "custom_reports" USING btree ("archived_at");
--> statement-breakpoint
CREATE INDEX "custom_reports_share_token_idx" ON "custom_reports" USING btree ("share_token");
