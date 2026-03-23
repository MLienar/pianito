CREATE TABLE "user_preference" (
	"user_id" text PRIMARY KEY NOT NULL,
	"notation" text DEFAULT 'letter' NOT NULL,
	"theme" text DEFAULT 'default' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;