ALTER TABLE "user_sessions" ALTER COLUMN "device_info" SET DEFAULT '{"type":"unknown"}'::jsonb;--> statement-breakpoint
ALTER TABLE "user_sessions" ALTER COLUMN "browser_info" SET DEFAULT '{"name":"unknown"}'::jsonb;--> statement-breakpoint
ALTER TABLE "user_sessions" ALTER COLUMN "os_info" SET DEFAULT '{"name":"unknown"}'::jsonb;--> statement-breakpoint
ALTER TABLE "user_sessions" ALTER COLUMN "location" SET DEFAULT '{}'::jsonb;