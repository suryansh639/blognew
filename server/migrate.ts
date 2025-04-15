import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db } from "./db";

// This simple script will push the database schema to the database
async function main() {
  try {
    console.log("Starting database push...");
    
    // This will push all schema definitions to the database
    await migrate(db, { migrationsFolder: "./drizzle" });
    
    console.log("Database push completed successfully!");
  } catch (error) {
    console.error("Error pushing database schema:", error);
    process.exit(1);
  }
}

main();