CREATE TYPE "public"."quality_alert_type" AS ENUM('score_drop', 'low_score', 'dimension_drop', 'critical_issue');--> statement-breakpoint
CREATE TABLE "quality_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_id" uuid NOT NULL,
	"type" "quality_alert_type" NOT NULL,
	"severity" varchar(32) DEFAULT 'medium' NOT NULL,
	"previous_score" integer,
	"current_score" integer,
	"score_drop" integer,
	"affected_dimension" text,
	"message" text NOT NULL,
	"email_sent" boolean DEFAULT false NOT NULL,
	"dismissed" boolean DEFAULT false NOT NULL,
	"dismissed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_id" uuid NOT NULL,
	"catalog_score" integer NOT NULL,
	"completeness_score" integer NOT NULL,
	"seo_score" integer NOT NULL,
	"consistency_score" integer NOT NULL,
	"sellability_score" integer NOT NULL,
	"strengths" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"improvements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"product_analysis" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"actionable_recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quality_alerts" ADD CONSTRAINT "quality_alerts_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_history" ADD CONSTRAINT "quality_history_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quality_alerts_catalog_id_idx" ON "quality_alerts" USING btree ("catalog_id");--> statement-breakpoint
CREATE INDEX "quality_alerts_dismissed_idx" ON "quality_alerts" USING btree ("dismissed");--> statement-breakpoint
CREATE INDEX "quality_history_catalog_id_idx" ON "quality_history" USING btree ("catalog_id");