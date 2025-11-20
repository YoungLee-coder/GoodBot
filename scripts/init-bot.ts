import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Load environment variables
config({ path: ".env.local" });

const directUrl = process.env.DIRECT_URL;
const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!directUrl) {
  console.error("DIRECT_URL is not set in .env.local");
  process.exit(1);
}

if (!botToken) {
  console.error("TELEGRAM_BOT_TOKEN is not set in .env.local");
  process.exit(1);
}

const pool = new Pool({ connectionString: directUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter: adapter as any });

async function getBotInfo(token: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }
    
    return data.result;
  } catch (error: any) {
    if (error.cause) {
      throw new Error(`Network error: ${error.cause.message || error.message}`);
    }
    throw error;
  }
}

async function main() {
  try {
    console.log("Fetching bot information from Telegram...");
    const botInfo = await getBotInfo(botToken);
    
    console.log(`Bot found: @${botInfo.username} (${botInfo.first_name})`);
    
    // Check if bot config already exists
    const existing = await prisma.botConfig.findFirst({
      where: { botId: botInfo.id.toString() },
    });
    
    if (existing) {
      console.log("Bot configuration already exists, updating...");
      await prisma.botConfig.update({
        where: { id: existing.id },
        data: {
          token: botToken,
          username: botInfo.username,
          isActive: true,
        },
      });
      console.log("✅ Bot configuration updated successfully!");
    } else {
      console.log("Creating new bot configuration...");
      await prisma.botConfig.create({
        data: {
          token: botToken,
          username: botInfo.username,
          botId: botInfo.id.toString(),
          isActive: true,
        },
      });
      console.log("✅ Bot configuration created successfully!");
    }
    
    console.log("\nBot Details:");
    console.log(`- Username: @${botInfo.username}`);
    console.log(`- Name: ${botInfo.first_name}`);
    console.log(`- ID: ${botInfo.id}`);
    console.log(`- Can join groups: ${botInfo.can_join_groups}`);
    console.log(`- Can read all messages: ${botInfo.can_read_all_group_messages}`);
  } catch (error: any) {
    console.error("❌ Failed to initialize bot:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
