# Prisma Database Setup

## Prerequisites

1. Create a Neon PostgreSQL database at https://neon.tech
2. Copy the connection string from your Neon dashboard

## Setup Steps

### 1. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the `DATABASE_URL` in `.env` with your Neon PostgreSQL connection string:

```
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

### 2. Generate Prisma Client

```bash
pnpm prisma:generate
```

### 3. Create Initial Migration

Run the migration to create all database tables:

```bash
pnpm prisma:migrate
```

When prompted, name the migration something like `init` or `initial_schema`.

### 4. Verify Setup

You can open Prisma Studio to view your database:

```bash
pnpm prisma:studio
```

## Database Models

The schema includes the following models:

- **BotConfig**: Stores Telegram Bot configuration and tokens
- **Message**: Stores all incoming and outgoing messages
- **Group**: Stores information about Telegram groups the bot has joined
- **User**: Stores admin user credentials for authentication

## Production Deployment

For Vercel deployment, make sure to:

1. Add `DATABASE_URL` to your Vercel environment variables
2. The build command automatically runs `prisma generate`
3. Migrations are applied using `prisma migrate deploy` in production

## Troubleshooting

### Connection Issues

If you encounter connection issues:
- Ensure your Neon database is active
- Check that the connection string includes `?sslmode=require`
- Verify your IP is allowed (Neon allows all IPs by default)

### Migration Issues

If migrations fail:
- Check your database connection
- Ensure you have write permissions
- Try resetting the database: `pnpm prisma migrate reset` (⚠️ This will delete all data)
