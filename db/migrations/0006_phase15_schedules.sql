CREATE TABLE "report_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"frequency" varchar(20) NOT NULL,
	"recipient_email" varchar(255) NOT NULL,
	"export_format" varchar(10) DEFAULT 'csv' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"next_run_at" timestamp NOT NULL,
	"last_run_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "report_schedules_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "custom_reports"("id") ON DELETE cascade,
	CONSTRAINT "report_schedules_org_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade,
	CONSTRAINT "report_schedules_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX "report_schedules_report_id_idx" ON "report_schedules" USING btree ("report_id");
--> statement-breakpoint
CREATE INDEX "report_schedules_org_id_idx" ON "report_schedules" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "report_schedules_next_run_idx" ON "report_schedules" USING btree ("next_run_at");
--> statement-breakpoint
CREATE INDEX "report_schedules_is_active_idx" ON "report_schedules" USING btree ("is_active");
