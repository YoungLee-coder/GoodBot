import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter: adapter as any });

async function main() {
  // 设置一个默认的 username，用户可以稍后在 dashboard 中修改
  const username = "GoodBot";
  
  await prisma.botConfig.updateMany({
    where: { isActive: true },
    data: { username },
  });
  
  console.log(`✅ Bot username set to: @${username}`);
  console.log("You can change it later in the dashboard");
  
  await prisma.$disconnect();
  await pool.end();
}

main();
