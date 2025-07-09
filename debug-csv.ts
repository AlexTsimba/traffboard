// Simple test script to debug CSV processing
import { processCSVByUploadId } from "@/lib/data/csv-processing";

async function testCSVProcessing() {
  try {
    console.log("Testing CSV processing...");

    // Use the last upload ID from the logs: cmcrj7qyx000311r9r9j98mck
    const uploadId = "cmcrj7qyx000311r9r9j98mck";

    console.log("Processing upload ID:", uploadId);
    const result = await processCSVByUploadId(uploadId);

    console.log("Result:", result);
  } catch (error) {
    console.error("Error:", error);
    console.error("Stack:", error instanceof Error ? error.stack : "No stack");
  }
}

testCSVProcessing();
