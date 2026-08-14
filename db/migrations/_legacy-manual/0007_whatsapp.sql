-- WhatsApp (Meta Cloud API): conversaciones + mensajes asociados al comercio.
-- Aplicado fuera del journal de drizzle (consistente con phase14/15).
DO $$ BEGIN
  CREATE TYPE "public"."whatsapp_mode" AS ENUM('ai', 'human');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."whatsapp_direction" AS ENUM('inbound', 'outbound');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."whatsapp_sender" AS ENUM('customer', 'bot', 'agent', 'system');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whatsapp_conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "catalog_id" uuid,
  "order_id" uuid,
  "customer_phone" text NOT NULL,
  "customer_name" text,
  "mode" "whatsapp_mode" DEFAULT 'ai' NOT NULL,
  "last_message_at" timestamp,
  "last_message_text" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whatsapp_messages" (
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
DO $$ BEGIN
  ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversation_id_whatsapp_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."whatsapp_conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wa_conversations_phone_idx" ON "whatsapp_conversations" USING btree ("customer_phone");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wa_conversations_catalog_idx" ON "whatsapp_conversations" USING btree ("catalog_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wa_conversations_last_msg_idx" ON "whatsapp_conversations" USING btree ("last_message_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wa_messages_conversation_idx" ON "whatsapp_messages" USING btree ("conversation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wa_messages_wa_id_idx" ON "whatsapp_messages" USING btree ("wa_message_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wa_messages_created_at_idx" ON "whatsapp_messages" USING btree ("created_at");
