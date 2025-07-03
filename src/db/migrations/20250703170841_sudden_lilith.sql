ALTER TABLE "traffic_reports" DROP CONSTRAINT "chk_traffic_device_type";--> statement-breakpoint
ALTER TABLE "traffic_reports" ADD CONSTRAINT "chk_traffic_device_type" CHECK (
        "traffic_reports"."device_type" IS NULL OR 
        "traffic_reports"."device_type" IN ('Phone', 'Desktop', 'Tablet', 'Computer')
      );