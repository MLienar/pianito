ALTER TABLE "grid" ADD COLUMN "metronome" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "grid" ADD COLUMN "style" text;--> statement-breakpoint
ALTER TABLE "grid" ADD COLUMN "swing" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "grid" ADD COLUMN "chords_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "grid" ADD COLUMN "bass_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "grid" ADD COLUMN "drums_enabled" boolean DEFAULT true NOT NULL;
