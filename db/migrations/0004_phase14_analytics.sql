CREATE TABLE "custom_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"query_type" varchar(50) NOT NULL DEFAULT 'sales',
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"columns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"template_name" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "report_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid,
	"organization_id" uuid NOT NULL,
	"export_format" varchar(10) NOT NULL DEFAULT 'csv',
	"file_url" varchar(500),
	"file_size" integer,
	"row_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custom_reports" ADD CONSTRAINT "custom_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "custom_reports" ADD CONSTRAINT "custom_reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_report_id_custom_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."custom_reports"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "custom_reports_organization_idx" ON "custom_reports" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "custom_reports_created_by_idx" ON "custom_reports" USING btree ("created_by");
--> statement-breakpoint
CREATE INDEX "custom_reports_is_template_idx" ON "custom_reports" USING btree ("is_template");
--> statement-breakpoint
CREATE INDEX "custom_reports_query_type_idx" ON "custom_reports" USING btree ("query_type");
--> statement-breakpoint
CREATE INDEX "report_exports_organization_idx" ON "report_exports" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "report_exports_report_id_idx" ON "report_exports" USING btree ("report_id");
--> statement-breakpoint
CREATE INDEX "report_exports_created_at_idx" ON "report_exports" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "report_exports_format_idx" ON "report_exports" USING btree ("export_format");
--> statement-breakpoint
CREATE INDEX "transactions_created_at_idx" ON "transactions" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "transactions_organization_status_idx" ON "transactions" USING btree ("organization_id","status","created_at");
--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "orders_organization_created_idx" ON "orders" USING btree ("organization_id","created_at","status");
