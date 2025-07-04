import * as fs from "fs";
import * as path from "path";
import { processPlayerDataCSV, processTrafficDataCSV } from "./data-transformers";

export async function processDemoPlayerData() {
  try {
    const csvPath = path.join(process.cwd(), "src/data/demo/overall_players_demo.csv");
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    
    console.log("🔄 Processing demo player data...");
    const result = processPlayerDataCSV(csvContent);
    
    console.log(`✅ Player data processing complete:`);
    console.log(`- Processed: ${result.processedCount} records`);
    console.log(`- Errors: ${result.errorCount}`);
    
    if (result.errors.length > 0) {
      console.log("❌ Errors found:");
      result.errors.forEach(error => console.log(`  - ${error}`));
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
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    
    console.log("🔄 Processing demo traffic data...");
    const result = processTrafficDataCSV(csvContent);
    
    console.log(`✅ Traffic data processing complete:`);
    console.log(`- Processed: ${result.processedCount} records`);
    console.log(`- Errors: ${result.errorCount}`);
    
    if (result.errors.length > 0) {
      console.log("❌ Errors found:");
      result.errors.forEach(error => console.log(`  - ${error}`));
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