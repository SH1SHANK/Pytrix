import { getInternalClient } from "../src/lib/ai/internalTestClient";

async function runInternalCheck() {
  console.log("Starting internal LLM check...");

  if (process.env.NODE_ENV !== "development") {
    console.error("This script must be run in development mode.");
    process.exit(1);
  }

  const client = await getInternalClient();
  if (!client) {
    console.log("No internal client available (missing key?). Skipping check.");
    process.exit(0);
  }

  try {
    console.log("Generating test question (Strings)...");
    const result = await client.generateContent(
      "question-generation",
      "Generate a simple Python question about string reversal.",
      (text) => text // raw text
    );

    if (result.success) {
      console.log("✅ Question generation successful!");
      console.log("Preview:", String(result.data).substring(0, 100) + "...");
    } else {
      console.error("❌ Question generation failed:", result.message);
      process.exit(1);
    }

    // Verify blocking in production (simulated)
    // We cannot simulate process.env change easily here without reload,
    // but the logic in modelRouter is present.
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

runInternalCheck();
