# Project Structure

## Directory Organization

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── bot/          # Telegram webhook handler
│   │   ├── chats/        # Chat & message endpoints
│   │   └── setup-webhook/ # Webhook configuration
│   ├── chat/             # Chat interface page
│   ├── groups/           # Group management page
│   ├── settings/         # Settings page + server actions
│   ├── setup/            # Initial setup wizard + actions
│   ├── layout.tsx        # Root layout with sidebar
│   ├── page.tsx          # Dashboard (main page)
│   └── globals.css       # Global styles
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── chat/             # Chat-specific components
│   └── app-sidebar.tsx   # Main navigation sidebar
├── lib/
│   ├── bot/              # Telegram bot instance & logic
│   ├── db/               # Database config & schema
│   │   ├── index.ts     # Drizzle client
│   │   └── schema.ts    # Table definitions
│   ├── settings.ts       # Settings helper functions
│   └── utils.ts          # Utility functions (cn, etc.)
└── hooks/                # React hooks
```

## Key Patterns

### Database Schema

Tables defined in `src/lib/db/schema.ts`:
- `settings` - Key-value config store
- `users` - Telegram users (bigint IDs)
- `groups` - Telegram groups/channels
- `messages` - All messages (with raw JSON)
- `messageMaps` - Maps admin messages to user messages for reply threading

### Server Actions

Server actions live alongside their pages:
- `src/app/setup/actions.ts` - Setup wizard actions
- `src/app/settings/actions.ts` - Settings management actions

### Bot Initialization

Bot instance is lazily initialized via `getBot()` in `src/lib/bot/index.ts`. Token is fetched from database, not environment variables.

### Conditional Layout

Root layout (`src/app/layout.tsx`) conditionally renders sidebar based on initialization status. Uninitialized apps show minimal layout and redirect to `/setup`.

## Conventions

- Use `@/` import alias for all src imports
- Server components by default (use `"use client"` when needed)
- Database operations use Drizzle ORM with prepared statements
- Telegram IDs stored as `bigint` with `{ mode: "number" }`
- All timestamps use `timestamp().defaultNow()`
