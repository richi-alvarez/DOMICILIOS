CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."catalog_type" AS ENUM('products', 'appointments');--> statement-breakpoint
CREATE TYPE "public"."monitoring_alert_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_mode" AS ENUM('ai', 'human');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_sender" AS ENUM('customer', 'bot', 'agent', 'system');--> statement-breakpoint
CREATE TABLE "ai_prompt_guides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_type" varchar(32) NOT NULL,
	"prompt" varchar(500) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_prompt_guides_business_type_unique" UNIQUE("business_type")
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"catalog_id" uuid NOT NULL,
	"customer_json" jsonb DEFAULT '{}'::jsonb,
	"service" text NOT NULL,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp NOT NULL,
	"status" "appointment_status" DEFAULT 'pending' NOT NULL,
	"google_event_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"query_type" varchar(50) DEFAULT 'sales' NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb,
	"columns" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"is_template" boolean DEFAULT false,
	"template_name" varchar(255),
	"archived_at" timestamp,
	"share_token" varchar(64),
	"share_token_expires_at" timestamp,
	CONSTRAINT "custom_reports_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "monitoring_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"severity" "monitoring_alert_severity" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"service" varchar(100) NOT NULL,
	"triggered_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "monitoring_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"endpoint" varchar(255),
	"method" varchar(10),
	"status_code" integer,
	"response_time_ms" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "report_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid,
	"organization_id" uuid NOT NULL,
	"export_format" varchar(10) DEFAULT 'csv' NOT NULL,
	"file_url" varchar(500),
	"file_size" integer,
	"row_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "report_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"frequency" varchar(20) NOT NULL,
	"recipient_email" varchar(255) NOT NULL,
	"export_format" varchar(10) DEFAULT 'csv' NOT NULL,
	"is_active" boolean DEFAULT true,
	"next_run_at" timestamp NOT NULL,
	"last_run_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "whatsapp_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_id" uuid,
	"order_id" uuid,
	"customer_phone" text NOT NULL,
	"customer_name" text,
	"mode" "whatsapp_mode" DEFAULT 'ai' NOT NULL,
	"store_reply_enabled" boolean DEFAULT true NOT NULL,
	"last_message_at" timestamp,
	"last_message_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"wa_message_id" text,
	"direction" "whatsapp_direction" NOT NULL,
	"sender" "whatsapp_sender" NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"status" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "catalogs" ADD COLUMN "type" "catalog_type" DEFAULT 'products' NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_reports" ADD CONSTRAINT "custom_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_reports" ADD CONSTRAINT "custom_reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_report_id_custom_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."custom_reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_report_id_custom_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."custom_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversation_id_whatsapp_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."whatsapp_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_catalog_id_idx" ON "appointments" USING btree ("catalog_id");--> statement-breakpoint
CREATE INDEX "appointments_start_at_idx" ON "appointments" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "appointments_status_idx" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appointments_catalog_start_idx" ON "appointments" USING btree ("catalog_id","start_at");--> statement-breakpoint
CREATE INDEX "custom_reports_organization_idx" ON "custom_reports" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "custom_reports_created_by_idx" ON "custom_reports" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "custom_reports_is_template_idx" ON "custom_reports" USING btree ("is_template");--> statement-breakpoint
CREATE INDEX "custom_reports_query_type_idx" ON "custom_reports" USING btree ("query_type");--> statement-breakpoint
CREATE INDEX "custom_reports_archived_at_idx" ON "custom_reports" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "custom_reports_share_token_idx" ON "custom_reports" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "monitoring_alerts_triggered_at_idx" ON "monitoring_alerts" USING btree ("triggered_at");--> statement-breakpoint
CREATE INDEX "monitoring_alerts_severity_idx" ON "monitoring_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "monitoring_alerts_service_idx" ON "monitoring_alerts" USING btree ("service");--> statement-breakpoint
CREATE INDEX "monitoring_metrics_timestamp_idx" ON "monitoring_metrics" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "monitoring_metrics_type_timestamp_idx" ON "monitoring_metrics" USING btree ("type","timestamp");--> statement-breakpoint
CREATE INDEX "monitoring_metrics_endpoint_idx" ON "monitoring_metrics" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "report_exports_organization_idx" ON "report_exports" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "report_exports_report_id_idx" ON "report_exports" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "report_exports_created_at_idx" ON "report_exports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "report_exports_format_idx" ON "report_exports" USING btree ("export_format");--> statement-breakpoint
CREATE INDEX "report_schedules_report_id_idx" ON "report_schedules" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "report_schedules_org_id_idx" ON "report_schedules" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "report_schedules_next_run_idx" ON "report_schedules" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "report_schedules_is_active_idx" ON "report_schedules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "wa_conversations_phone_idx" ON "whatsapp_conversations" USING btree ("customer_phone");--> statement-breakpoint
CREATE INDEX "wa_conversations_catalog_idx" ON "whatsapp_conversations" USING btree ("catalog_id");--> statement-breakpoint
CREATE INDEX "wa_conversations_last_msg_idx" ON "whatsapp_conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "wa_messages_conversation_idx" ON "whatsapp_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "wa_messages_wa_id_idx" ON "whatsapp_messages" USING btree ("wa_message_id");--> statement-breakpoint
CREATE INDEX "wa_messages_created_at_idx" ON "whatsapp_messages" USING btree ("created_at");