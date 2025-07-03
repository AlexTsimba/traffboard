CREATE TABLE "traffic_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"foreign_brand_id" integer,
	"foreign_partner_id" integer,
	"foreign_campaign_id" integer,
	"foreign_landing_id" integer,
	"traffic_source" varchar(100),
	"device_type" varchar(50),
	"user_agent_family" varchar(255),
	"os_family" varchar(100),
	"country" varchar(3),
	"all_clicks" integer DEFAULT 0 NOT NULL,
	"unique_clicks" integer DEFAULT 0 NOT NULL,
	"registrations_count" integer DEFAULT 0 NOT NULL,
	"ftd_count" integer DEFAULT 0 NOT NULL,
	"deposits_count" integer DEFAULT 0 NOT NULL,
	"cr" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"cftd" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"cd" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"rftd" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "chk_traffic_positive_metrics" CHECK (
        "traffic_reports"."all_clicks" >= 0 AND 
        "traffic_reports"."unique_clicks" >= 0 AND 
        "traffic_reports"."registrations_count" >= 0 AND 
        "traffic_reports"."ftd_count" >= 0 AND 
        "traffic_reports"."deposits_count" >= 0
      ),
	CONSTRAINT "chk_traffic_rate_bounds" CHECK (
        "traffic_reports"."cr" >= 0 AND "traffic_reports"."cr" <= 100 AND
        "traffic_reports"."cftd" >= 0 AND "traffic_reports"."cftd" <= 100 AND
        "traffic_reports"."cd" >= 0 AND "traffic_reports"."cd" <= 100 AND
        "traffic_reports"."rftd" >= 0 AND "traffic_reports"."rftd" <= 100
      ),
	CONSTRAINT "chk_traffic_click_logic" CHECK ("traffic_reports"."unique_clicks" <= "traffic_reports"."all_clicks"),
	CONSTRAINT "chk_traffic_device_type" CHECK (
        "traffic_reports"."device_type" IS NULL OR 
        "traffic_reports"."device_type" IN ('Phone', 'Desktop', 'Tablet')
      )
);
--> statement-breakpoint
CREATE TABLE "player_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" varchar(50) NOT NULL,
	"original_player_id" varchar(50),
	"sign_up_date" timestamp with time zone,
	"first_deposit_date" timestamp with time zone,
	"partner_id" integer,
	"company_name" varchar(255),
	"partner_tags" varchar(500),
	"campaign_id" integer,
	"campaign_name" varchar(255),
	"promo_id" integer,
	"promo_code" varchar(100),
	"player_country" varchar(3),
	"currency" varchar(3),
	"tag_clickid" varchar(255),
	"tag_os" varchar(100),
	"tag_source" varchar(100),
	"tag_sub2" varchar(100),
	"tag_web_id" varchar(100),
	"date" timestamp with time zone NOT NULL,
	"prequalified" integer DEFAULT 0 NOT NULL,
	"duplicate" integer DEFAULT 0 NOT NULL,
	"self_excluded" integer DEFAULT 0 NOT NULL,
	"disabled" integer DEFAULT 0 NOT NULL,
	"ftd_count" integer DEFAULT 0 NOT NULL,
	"ftd_sum" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"deposits_count" integer DEFAULT 0 NOT NULL,
	"deposits_sum" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"cashouts_count" integer DEFAULT 0 NOT NULL,
	"cashouts_sum" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"casino_bets_count" integer DEFAULT 0 NOT NULL,
	"casino_bets_sum" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"casino_wins_sum" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"casino_real_ngr" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"fixed_per_player" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "chk_player_positive_amounts" CHECK (
        "player_data"."ftd_sum" >= 0 AND 
        "player_data"."deposits_sum" >= 0 AND 
        "player_data"."cashouts_sum" >= 0 AND 
        "player_data"."casino_bets_sum" >= 0 AND 
        "player_data"."casino_wins_sum" >= 0 AND
        "player_data"."fixed_per_player" >= 0
      ),
	CONSTRAINT "chk_player_positive_counts" CHECK (
        "player_data"."ftd_count" >= 0 AND 
        "player_data"."deposits_count" >= 0 AND 
        "player_data"."cashouts_count" >= 0 AND 
        "player_data"."casino_bets_count" >= 0
      ),
	CONSTRAINT "chk_player_boolean_flags" CHECK (
        "player_data"."prequalified" IN (0, 1) AND 
        "player_data"."duplicate" IN (0, 1) AND 
        "player_data"."self_excluded" IN (0, 1) AND 
        "player_data"."disabled" IN (0, 1)
      )
);
--> statement-breakpoint
CREATE INDEX "idx_traffic_reports_date" ON "traffic_reports" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_traffic_reports_date_partner" ON "traffic_reports" USING btree ("date","foreign_partner_id");--> statement-breakpoint
CREATE INDEX "idx_traffic_reports_date_campaign" ON "traffic_reports" USING btree ("date","foreign_campaign_id");--> statement-breakpoint
CREATE INDEX "idx_traffic_reports_partner" ON "traffic_reports" USING btree ("foreign_partner_id");--> statement-breakpoint
CREATE INDEX "idx_traffic_reports_campaign" ON "traffic_reports" USING btree ("foreign_campaign_id");--> statement-breakpoint
CREATE INDEX "idx_traffic_reports_country" ON "traffic_reports" USING btree ("country");--> statement-breakpoint
CREATE INDEX "idx_traffic_reports_device" ON "traffic_reports" USING btree ("device_type");--> statement-breakpoint
CREATE INDEX "idx_traffic_reports_source" ON "traffic_reports" USING btree ("traffic_source");--> statement-breakpoint
CREATE INDEX "idx_traffic_analytics" ON "traffic_reports" USING btree ("date","foreign_partner_id","foreign_campaign_id","device_type","country");--> statement-breakpoint
CREATE INDEX "idx_player_data_date" ON "player_data" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_player_data_date_player" ON "player_data" USING btree ("date","player_id");--> statement-breakpoint
CREATE INDEX "idx_player_data_date_partner" ON "player_data" USING btree ("date","partner_id");--> statement-breakpoint
CREATE INDEX "idx_player_data_date_campaign" ON "player_data" USING btree ("date","campaign_id");--> statement-breakpoint
CREATE INDEX "idx_player_data_player_id" ON "player_data" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_player_data_player_lifecycle" ON "player_data" USING btree ("player_id","sign_up_date","first_deposit_date");--> statement-breakpoint
CREATE INDEX "idx_player_data_partner" ON "player_data" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_player_data_campaign" ON "player_data" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_player_data_partner_campaign" ON "player_data" USING btree ("partner_id","campaign_id");--> statement-breakpoint
CREATE INDEX "idx_player_data_country" ON "player_data" USING btree ("player_country");--> statement-breakpoint
CREATE INDEX "idx_player_data_currency" ON "player_data" USING btree ("currency");--> statement-breakpoint
CREATE INDEX "idx_player_data_ngr" ON "player_data" USING btree ("date","casino_real_ngr");--> statement-breakpoint
CREATE INDEX "idx_player_analytics" ON "player_data" USING btree ("date","partner_id","campaign_id","player_country","currency");