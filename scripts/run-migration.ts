import { config } from "dotenv";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables
config({ path: ".env.local" });

const directUrl = process.env.DIRECT_URL;

if (!directUrl) {
  console.error("DIRECT_URL is not set in .env.local");
  process.exit(1);
}

async function runMigration() {
  const pool = new Pool({ connectionString: directUrl });
  
  try {
    // Read the migration SQL file
    const sqlPath = join(__dirname, "../prisma/migration.sql");
    const sql = readFileSync(sqlPath, "utf-8");
    
    // Remove comments and split by semicolon
    const statements = sql
      .split("\n")
      .filter((line) => !line.trim().startsWith("--") && line.trim())
      .join("\n")
      .split(";")
      .filter((stmt) => stmt.trim());
    
    console.log(`Running ${statements.length} SQL statements...`);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }
    
    console.log("✅ Migration completed successfully!");
  } catch (error: any) {
    if (error.code === "42P07") {
      console.log("ℹ️  Tables already exist, skipping migration");
    } else {
      console.error("❌ Migration failed:", error.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

runMigration();
