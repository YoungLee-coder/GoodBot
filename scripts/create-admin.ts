import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hashPassword } from "../lib/password";

// Load environment variables
config({ path: ".env.local" });

const directUrl = process.env.DIRECT_URL;

if (!directUrl) {
  console.error("DIRECT_URL is not set in .env.local");
  console.error("Please check your .env.local file");
  process.exit(1);
}

// Use standard PostgreSQL adapter for scripts
const pool = new Pool({ connectionString: directUrl });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter: adapter as any,
});

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "admin123456";
  const name = "Admin";

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`User with email ${email} already exists.`);
    return;
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  console.log(`Admin user created successfully:`);
  console.log(`Email: ${user.email}`);
  console.log(`Name: ${user.name}`);
  console.log(`ID: ${user.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
