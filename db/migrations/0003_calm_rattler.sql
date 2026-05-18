CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "analytics_type_idx" ON "analytics_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "analytics_catalog_ts_idx" ON "analytics_events" USING btree ("catalog_id","ts");--> statement-breakpoint
CREATE INDEX "catalogs_org_status_idx" ON "catalogs" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "categories_parent_id_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "categories_active_idx" ON "categories" USING btree ("active");--> statement-breakpoint
CREATE INDEX "memberships_user_id_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "memberships_org_id_idx" ON "memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "memberships_user_org_idx" ON "memberships" USING btree ("user_id","organization_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_catalog_status_idx" ON "orders" USING btree ("catalog_id","status");--> statement-breakpoint
CREATE INDEX "products_category_id_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_active_idx" ON "products" USING btree ("active");--> statement-breakpoint
CREATE INDEX "products_catalog_active_idx" ON "products" USING btree ("catalog_id","active");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");