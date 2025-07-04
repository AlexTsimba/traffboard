import fs from "node:fs";
import path from "node:path";

import { processPlayerDataCSV, processTrafficDataCSV } from "./data-transformers";
import { prisma } from "./prisma";

export async function processDemoPlayerData() {
  try {
    const csvPath = path.join(process.cwd(), "src/data/demo/overall_players_demo.csv");
    const csvContent = fs.readFileSync(csvPath, "utf8");

    console.log("🔄 Processing demo player data...");
    const result = processPlayerDataCSV(csvContent);

    if (result.success && result.data.length > 0) {
      console.log(`📝 Writing ${result.data.length} player records to database...`);
      await prisma.playerData.createMany({
        data: result.data,
        skipDuplicates: true,
      });
      console.log("...Done.");
    }

    console.log(`✅ Player data processing complete:`);
    console.log(`- Processed: ${result.processedCount} records`);
    console.log(`- Errors: ${result.errorCount}`);

    if (result.errors.length > 0) {
      console.log("❌ Errors found:");
      for (const error of result.errors) {
        console.log(`  - ${error}`);
      }
    }

    return result;
  } catch (error) {
    console.error("❌ Failed to process demo player data:", error);
    throw error;
  }
}

export async function processDemoTrafficData() {
  try {
    const csvPath = path.join(process.cwd(), "src/data/demo/traffic_report_demo.csv");
    const csvContent = fs.readFileSync(csvPath, "utf8");

    console.log("🔄 Processing demo traffic data...");
    const result = processTrafficDataCSV(csvContent);

    if (result.success && result.data.length > 0) {
      console.log(`📝 Writing ${result.data.length} traffic records to database...`);
      await prisma.trafficReport.createMany({
        data: result.data,
        skipDuplicates: true,
      });
      console.log("...Done.");
    }

    console.log(`✅ Traffic data processing complete:`);
    console.log(`- Processed: ${result.processedCount} records`);
    console.log(`- Errors: ${result.errorCount}`);

    if (result.errors.length > 0) {
      console.log("❌ Errors found:");
      for (const error of result.errors) {
        console.log(`  - ${error}`);
      }
    }

    return result;
  } catch (error) {
    console.error("❌ Failed to process demo traffic data:", error);
    throw error;
  }
}

export async function testDemoDataProcessing() {
  try {
    console.log("🚀 Starting demo data processing test...\n");

    const playerResult = await processDemoPlayerData();
    console.log("");
    const trafficResult = await processDemoTrafficData();

    console.log("\n📊 Summary:");
    console.log(`- Player records processed: ${playerResult.processedCount}`);
    console.log(`- Traffic records processed: ${trafficResult.processedCount}`);
    console.log(`- Total errors: ${playerResult.errorCount + trafficResult.errorCount}`);

    return {
      playerResult,
      trafficResult,
      totalProcessed: playerResult.processedCount + trafficResult.processedCount,
      totalErrors: playerResult.errorCount + trafficResult.errorCount,
    };
  } catch (error) {
    console.error("❌ Demo data processing test failed:", error);
    throw error;
  }
}
