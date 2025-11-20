import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Load environment variables
config({ path: ".env.local" });

const directUrl = process.env.DIRECT_URL;

if (!directUrl) {
  console.error("DIRECT_URL is not set in .env.local");
  process.exit(1);
}

const pool = new Pool({ connectionString: directUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter: adapter as any });

async function main() {
  // 提示用户输入 bot username
  console.log("Please enter your bot username (without @):");
  console.log("You can find it in @BotFather or by searching for your bot in Telegram");
  console.log("\nExample: my_awesome_bot");
  console.log("\nOr press Enter to skip and use 'goodbot' as default");
  
  // 在 Node.js 中读取用户输入
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('\nBot username: ', async (username: string) => {
    readline.close();
    
    const botUsername = username.trim() || 'goodbot';
    
    try {
      const config = await prisma.botConfig.findFirst({
        where: { isActive: true },
      });
      
      if (!config) {
        console.error("No active bot configuration found. Please run init-bot-manual.ts first.");
        process.exit(1);
      }
      
      await prisma.botConfig.update({
        where: { id: config.id },
        data: { username: botUsername },
      });
      
      console.log(`\n✅ Bot username updated to: @${botUsername}`);
      console.log("\nRefresh your dashboard to see the changes!");
    } catch (error: any) {
      console.error("❌ Failed to update username:", error.message);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
      await pool.end();
    }
  });
}

main();
