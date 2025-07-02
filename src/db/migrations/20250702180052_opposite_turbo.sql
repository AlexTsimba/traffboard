CREATE TABLE "conversion_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"total_rows" integer DEFAULT 0,
	"processed_rows" integer DEFAULT 0,
	"error_rows" integer DEFAULT 0,
	"errors" jsonb DEFAULT '[]'::jsonb,
	"uploaded_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "chk_conversion_uploads_valid_status" CHECK (
        "conversion_uploads"."status" IN ('pending', 'processing', 'completed', 'failed')
      ),
	CONSTRAINT "chk_conversion_uploads_valid_file_type" CHECK (
        "conversion_uploads"."file_type" IN ('player_data', 'traffic_report')
      ),
	CONSTRAINT "chk_conversion_uploads_positive_file_size" CHECK (
        "conversion_uploads"."file_size" > 0
      ),
	CONSTRAINT "chk_conversion_uploads_positive_rows" CHECK (
        "conversion_uploads"."total_rows" >= 0 AND 
        "conversion_uploads"."processed_rows" >= 0 AND 
        "conversion_uploads"."error_rows" >= 0
      ),
	CONSTRAINT "chk_conversion_uploads_row_logic" CHECK (
        "conversion_uploads"."processed_rows" + "conversion_uploads"."error_rows" <= "conversion_uploads"."total_rows"
      )
);
--> statement-breakpoint
CREATE TABLE "player_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"upload_id" integer NOT NULL,
	"player_id" varchar(50) NOT NULL,
	"original_player_id" varchar(50),
	"sign_up_date" timestamp with time zone,
	"first_deposit_date" timestamp with time zone,
	"partner_id" varchar(50),
	"company_name" varchar(255),
	"partner_tags" varchar(500),
	"campaign_id" varchar(50),
	"campaign_name" varchar(255),
	"promo_id" varchar(50),
	"promo_code" varchar(100),
	"player_country" varchar(10),
	"tag_clickid" varchar(255),
	"tag_os" varchar(100),
	"tag_source" varchar(100),
	"tag_sub2" varchar(100),
	"tag_web_id" varchar(100),
	"date" timestamp with time zone,
	"prequalified" integer DEFAULT 0,
	"duplicate" integer DEFAULT 0,
	"self_excluded" integer DEFAULT 0,
	"disabled" integer DEFAULT 0,
	"currency" varchar(10),
	"ftd_count" integer DEFAULT 0,
	"ftd_sum" numeric(15, 2) DEFAULT '0',
	"deposits_count" integer DEFAULT 0,
	"deposits_sum" numeric(15, 2) DEFAULT '0',
	"cashouts_count" integer DEFAULT 0,
	"cashouts_sum" numeric(15, 2) DEFAULT '0',
	"casino_bets_count" integer DEFAULT 0,
	"casino_real_ngr" numeric(15, 2) DEFAULT '0',
	"fixed_per_player" numeric(15, 2) DEFAULT '0',
	"casino_bets_sum" numeric(15, 2) DEFAULT '0',
	"casino_wins_sum" numeric(15, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "chk_player_data_positive_amounts" CHECK (
        "player_data"."ftd_sum" >= 0 AND 
        "player_data"."deposits_sum" >= 0 AND 
        "player_data"."cashouts_sum" >= 0 AND 
        "player_data"."casino_bets_sum" >= 0 AND 
        "player_data"."casino_wins_sum" >= 0 AND
        "player_data"."casino_real_ngr" >= 0 AND
        "player_data"."fixed_per_player" >= 0
      ),
	CONSTRAINT "chk_player_data_positive_counts" CHECK (
        "player_data"."ftd_count" >= 0 AND 
        "player_data"."deposits_count" >= 0 AND 
        "player_data"."cashouts_count" >= 0 AND 
        "player_data"."casino_bets_count" >= 0
      ),
	CONSTRAINT "chk_player_data_boolean_flags" CHECK (
        "player_data"."prequalified" IN (0, 1) AND 
        "player_data"."duplicate" IN (0, 1) AND 
        "player_data"."self_excluded" IN (0, 1) AND 
        "player_data"."disabled" IN (0, 1)
      )
);
--> statement-breakpoint
CREATE TABLE "traffic_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"upload_id" integer NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"foreign_brand_id" varchar(50),
	"foreign_partner_id" varchar(50),
	"foreign_campaign_id" varchar(50),
	"foreign_landing_id" varchar(50),
	"traffic_source" varchar(100),
	"device_type" varchar(50),
	"user_agent_family" varchar(255),
	"os_family" varchar(100),
	"country" varchar(10),
	"all_clicks" integer DEFAULT 0,
	"unique_clicks" integer DEFAULT 0,
	"registrations_count" integer DEFAULT 0,
	"ftd_count" integer DEFAULT 0,
	"deposits_count" integer DEFAULT 0,
	"cr" numeric(10, 2) DEFAULT '0',
	"cftd" numeric(10, 2) DEFAULT '0',
	"cd" numeric(10, 2) DEFAULT '0',
	"rftd" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "chk_traffic_reports_positive_counts" CHECK (
        "traffic_reports"."all_clicks" >= 0 AND 
        "traffic_reports"."unique_clicks" >= 0 AND 
        "traffic_reports"."registrations_count" >= 0 AND 
        "traffic_reports"."ftd_count" >= 0 AND 
        "traffic_reports"."deposits_count" >= 0
      ),
	CONSTRAINT "chk_traffic_reports_positive_rates" CHECK (
        "traffic_reports"."cr" >= 0 AND 
        "traffic_reports"."cftd" >= 0 AND 
        "traffic_reports"."cd" >= 0 AND 
        "traffic_reports"."rftd" >= 0
      ),
	CONSTRAINT "chk_traffic_reports_device_type" CHECK (
        "traffic_reports"."device_type" IS NULL OR "traffic_reports"."device_type" IN ('Phone', 'Desktop', 'Tablet')
      ),
	CONSTRAINT "chk_traffic_reports_clicks_logic" CHECK (
        "traffic_reports"."unique_clicks" <= "traffic_reports"."all_clicks"
      )
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" text,
	"recovery_codes" text[],
	"notification_preferences" jsonb DEFAULT '{"email":true,"loginAlerts":true,"securityAlerts":true,"systemUpdates":false}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_token" text NOT NULL,
	"user_id" integer NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_token" text NOT NULL,
	"device_info" jsonb DEFAULT '{"type":"unknown","model":null,"vendor":null}'::jsonb,
	"browser_info" jsonb DEFAULT '{"name":"unknown","version":null,"engine":null}'::jsonb,
	"os_info" jsonb DEFAULT '{"name":"unknown","version":null}'::jsonb,
	"ip_address" varchar(45),
	"location" jsonb DEFAULT '{"country":null,"city":null,"region":null}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"first_activity" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"last_activity" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversion_uploads" ADD CONSTRAINT "conversion_uploads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_data" ADD CONSTRAINT "player_data_upload_id_conversion_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."conversion_uploads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_reports" ADD CONSTRAINT "traffic_reports_upload_id_conversion_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."conversion_uploads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_conversion_uploads_user_id" ON "conversion_uploads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_conversion_uploads_status" ON "conversion_uploads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_conversion_uploads_file_type" ON "conversion_uploads" USING btree ("file_type");--> statement-breakpoint
CREATE INDEX "idx_conversion_uploads_uploaded_at" ON "conversion_uploads" USING btree ("uploaded_at");--> statement-breakpoint
CREATE INDEX "idx_conversion_uploads_user_status" ON "conversion_uploads" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_conversion_uploads_user_type" ON "conversion_uploads" USING btree ("user_id","file_type");--> statement-breakpoint
CREATE INDEX "idx_player_data_upload_id" ON "player_data" USING btree ("upload_id");--> statement-breakpoint
CREATE INDEX "idx_player_data_date" ON "player_data" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_player_data_partner_campaign" ON "player_data" USING btree ("partner_id","campaign_id");--> statement-breakpoint
CREATE INDEX "idx_player_data_date_partner" ON "player_data" USING btree ("date","partner_id");--> statement-breakpoint
CREATE INDEX "idx_player_data_player_id" ON "player_data" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_player_data_country" ON "player_data" USING btree ("player_country");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_player_per_upload" ON "player_data" USING btree ("upload_id","player_id");--> statement-breakpoint
CREATE INDEX "idx_traffic_reports_upload_id" ON "traffic_reports" USING btree ("upload_id");--> statement-breakpoint
CREATE INDEX "idx_traffic_reports_date" ON "traffic_reports" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_traffic_reports_date_partner" ON "traffic_reports" USING btree ("date","foreign_partner_id");--> statement-breakpoint
CREATE INDEX "idx_traffic_reports_date_campaign" ON "traffic_reports" USING btree ("date","foreign_campaign_id");--> statement-breakpoint
CREATE INDEX "idx_traffic_reports_source_device" ON "traffic_reports" USING btree ("traffic_source","device_type");--> statement-breakpoint
CREATE INDEX "idx_traffic_reports_country" ON "traffic_reports" USING btree ("country");--> statement-breakpoint
CREATE INDEX "idx_traffic_reports_analytics" ON "traffic_reports" USING btree ("date","foreign_partner_id","foreign_campaign_id","device_type");