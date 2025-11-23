# Technology Stack

## Framework & Runtime

- **Next.js 16** with App Router (React 19)
- **TypeScript 5** with strict mode enabled
- **Node.js 18+** required

## Frontend

- **Tailwind CSS 4** for styling
- **shadcn/ui** component library (Radix UI primitives)
- **Lucide React** for icons
- **React Hook Form** + Zod for form validation
- Custom fonts: Geist Sans & Geist Mono

## Backend & Database

- **Drizzle ORM** for database operations
- **PostgreSQL** via Neon (serverless Postgres)
- **grammY** framework for Telegram bot
- **bcryptjs** for password hashing

## Package Manager

- **pnpm** is the required package manager

## Common Commands

```bash
# Development
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Database
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Drizzle Studio (database GUI)
```

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string (Neon format with SSL)

## Path Aliases

- `@/*` maps to `./src/*` (configured in tsconfig.json)
