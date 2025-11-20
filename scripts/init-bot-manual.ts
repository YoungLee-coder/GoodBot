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

async function main() {
  try {
    // 从 token 中提取 bot ID (token 格式: botId:hash)
    const botId = botToken.split(':')[0];
    
    if (!botId || isNaN(Number(botId))) {
      throw new Error("Invalid bot token format. Expected format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz");
    }
    
    console.log(`Bot ID from token: ${botId}`);
    console.log("\nPlease provide the following information:");
    console.log("(You can get this by messaging @userinfobot or @BotFather)");
    
    // 使用默认值，用户可以稍后在 dashboard 中更新
    const username = "your_bot_username"; // 用户需要手动替换
    
    // Check if bot config already exists
    const existing = await prisma.botConfig.findFirst({
      where: { botId },
    });
    
    if (existing) {
      console.log("\nBot configuration already exists, updating token...");
      await prisma.botConfig.update({
        where: { id: existing.id },
        data: {
          token: botToken,
          isActive: true,
        },
      });
      console.log("✅ Bot configuration updated successfully!");
    } else {
      console.log("\nCreating new bot configuration...");
      await prisma.botConfig.create({
        data: {
          token: botToken,
          username: username,
          botId: botId,
          isActive: true,
        },
      });
      console.log("✅ Bot configuration created successfully!");
      console.log("\n⚠️  Please update the bot username in the dashboard");
    }
    
    console.log("\nNext steps:");
    console.log("1. Refresh your dashboard to see the bot");
    console.log("2. Update bot username if needed");
    console.log("3. Set up webhook URL");
  } catch (error: any) {
    console.error("❌ Failed to initialize bot:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
