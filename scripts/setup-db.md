# Database Setup Guide

This guide will help you set up your Neon PostgreSQL database for GoodBot.

## Step 1: Create Neon Database

1. Go to https://neon.tech and sign up/login
2. Click "Create Project"
3. Choose a project name (e.g., "goodbot")
4. Select a region close to your users
5. Click "Create Project"

## Step 2: Get Connection String

1. In your Neon dashboard, go to your project
2. Click on "Connection Details"
3. Copy the connection string (it should look like):
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

## Step 3: Configure Environment

1. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and update `DATABASE_URL` with your Neon connection string

## Step 4: Initialize Database

Run these commands in order:

```bash
# Generate Prisma Client
pnpm prisma:generate

# Create and apply initial migration
pnpm prisma:migrate
```

When prompted for a migration name, enter: `init`

## Step 5: Verify Setup

Open Prisma Studio to verify your database tables were created:

```bash
pnpm prisma:studio
```

You should see 4 tables:
- BotConfig
- Message
- Group
- User

## Troubleshooting

### Error: "Can't reach database server"

- Check your internet connection
- Verify the DATABASE_URL is correct
- Ensure your Neon project is active (not suspended)

### Error: "Migration failed"

- Make sure you have a valid DATABASE_URL
- Check that the database is empty (for initial migration)
- Try running `pnpm prisma migrate reset` to start fresh (⚠️ deletes all data)

### Error: "Environment variable not found: DATABASE_URL"

- Make sure you created the `.env` file
- Verify DATABASE_URL is set in `.env`
- Restart your terminal/IDE after creating `.env`

## Next Steps

After database setup is complete:
1. Configure your Telegram Bot Token
2. Set up NextAuth credentials
3. Run the development server: `pnpm dev`
