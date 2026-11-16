CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"type" text NOT NULL,
	"path" text NOT NULL,
	"visitor" text NOT NULL,
	"user_id" uuid,
	"product_id" text,
	"label" text,
	"value" integer,
	"referrer" text,
	"source" text,
	"device" text,
	"country" text
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_at_idx" ON "events" USING btree ("at");--> statement-breakpoint
CREATE INDEX "events_type_at_idx" ON "events" USING btree ("type","at");--> statement-breakpoint
CREATE INDEX "events_user_at_idx" ON "events" USING btree ("user_id","at");