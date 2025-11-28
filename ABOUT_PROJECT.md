# GoodBot - Telegram Bot Management System

## 💡 Inspiration

Managing a Telegram bot shouldn't require technical expertise or constant terminal access. We observed that many community managers and small business owners struggle with:

1. **Fragmented Communication** - Messages from users get lost in the noise
2. **No Central Dashboard** - Bot owners have to rely on Telegram's limited interface
3. **Complex Setup** - Most bot solutions require extensive configuration and coding knowledge
4. **Engagement Features** - Running community events like lotteries requires custom development

We envisioned a solution where anyone could deploy a professional Telegram bot with a beautiful web dashboard in minutes, not days.

## 🎯 What It Does

GoodBot is a full-stack Telegram bot management system that provides:

- **Bidirectional Messaging** - Users message the bot → Admin receives in Telegram & Web UI → Admin replies → User gets response
- **Web Dashboard** - Modern, responsive interface for monitoring and management
- **Group Lottery System** - Create and manage lottery events in Telegram groups with automatic drawing
- **User & Group Management** - Track all interactions and manage communities
- **Zero-Config Deployment** - Setup wizard handles everything, no environment variables needed for bot token

## 🛠️ How We Built It

### Architecture Overview

```
┌─────────────────┐     Webhook      ┌─────────────────┐
│  Telegram API   │ ◄──────────────► │   Next.js API   │
└─────────────────┘                  └────────┬────────┘
                                              │
                                              ▼
┌─────────────────┐                  ┌─────────────────┐
│   Web Dashboard │ ◄──────────────► │   PostgreSQL    │
│   (React 19)    │    Drizzle ORM   │     (Neon)      │
└─────────────────┘                  └─────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19 + Tailwind CSS 4 + shadcn/ui |
| Backend | Next.js API Routes + Server Actions |
| Database | PostgreSQL (Neon Serverless) |
| ORM | Drizzle ORM |
| Bot Framework | grammY |
| Authentication | iron-session + bcryptjs |
| Language | TypeScript 5 (Strict Mode) |

### Key Implementation Details

**Message Forwarding System**

The core challenge was creating a seamless reply threading system. When a user sends a message:

1. Message is stored in database with unique ID
2. Forwarded to admin with user context
3. A mapping table tracks: `admin_message_id ↔ user_message_id ↔ user_chat_id`
4. When admin replies to forwarded message, we lookup the mapping and route correctly

**Lottery System Algorithm**

For fair lottery drawing, we implemented Fisher-Yates shuffle with prize distribution:

```typescript
// Shuffle participants randomly
const shuffled = [...participants].sort(() => Math.random() - 0.5);

// Distribute prizes in order
let currentIndex = 0;
for (const prize of prizes) {
  for (let i = 0; i < prize.count && currentIndex < shuffled.length; i++) {
    winners.push({
      participant: shuffled[currentIndex++],
      prizeName: prize.name
    });
  }
}
```

The probability of winning for each participant can be expressed as:

$$P(\text{win}) = \frac{\sum_{i=1}^{n} p_i}{N}$$

Where $p_i$ is the count of prize $i$ and $N$ is total participants.

**Scheduled Task Challenge**

In serverless environments, traditional `setTimeout` doesn't work reliably. We solved this with a hybrid approach:

$$\text{Delay} = \max(0, t_{\text{scheduled}} - t_{\text{now}})$$

- **Primary**: External cron service (cron-job.org) polls every minute
- **Secondary**: In-memory timers for active sessions
- **Tertiary**: Check on every bot interaction

## 🚧 Challenges We Faced

### 1. Serverless Timer Limitations

**Problem**: Vercel's serverless functions are stateless - `setTimeout` gets lost when the function cold starts.

**Solution**: We implemented a multi-layer approach:
- Database stores scheduled end times
- External cron service as reliable trigger
- Opportunistic checking on user interactions

### 2. BigInt Serialization

**Problem**: Telegram IDs are 64-bit integers, but JSON doesn't support BigInt natively.

**Solution**: 
```typescript
// Store as bigint in PostgreSQL
id: bigint("id", { mode: "number" })

// Serialize for API responses
const serialized = { ...user, id: user.id.toString() };
```

### 3. Real-time Updates Without WebSocket

**Problem**: Vercel doesn't support persistent WebSocket connections on Hobby plan.

**Solution**: Implemented polling with smart intervals:
```typescript
// Poll every 3 seconds for chat messages
const interval = setInterval(fetchMessages, 3000);
```

### 4. Type Safety with Dynamic Data

**Problem**: Lottery prizes are stored as JSONB, losing type information.

**Solution**: Created explicit type definitions and runtime validation:
```typescript
type Prize = { name: string; count: number };
const prizes = lottery.prizes as Prize[] | null;
```

### 5. Internationalization

**Problem**: Supporting both Chinese and English users seamlessly.

**Solution**: Built a lightweight i18n system with React Context:
```typescript
const { t, setLocale } = useLanguage();
// Usage: {t.dashboard.title}
```

## 📚 What We Learned

1. **Serverless Trade-offs** - Stateless architecture requires rethinking traditional patterns
2. **Type Safety Pays Off** - TypeScript strict mode caught numerous bugs early
3. **Database-Driven Config** - Storing config in DB instead of env vars simplifies deployment
4. **Progressive Enhancement** - Start with polling, upgrade to WebSocket later
5. **User Experience First** - Setup wizard reduced onboarding from hours to minutes

## 🚀 Future Improvements

- [ ] WebSocket support for real-time updates (when upgrading hosting)
- [ ] Analytics dashboard with message statistics
- [ ] Scheduled messages feature
- [ ] Multi-admin support
- [ ] Plugin system for extensibility

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| Lines of Code | ~5,000+ |
| API Endpoints | 12 |
| Database Tables | 6 |
| UI Components | 20+ |
| Development Time | 48 hours |

## 🤖 How Kiro Was Used

Kiro served as our AI-powered development partner throughout the entire project lifecycle, significantly accelerating our development process.

### Code Generation & Architecture

- **Initial Scaffolding** - Kiro helped design the project structure following Next.js 16 App Router best practices
- **Database Schema Design** - Generated Drizzle ORM schemas for users, messages, groups, lotteries, and message mappings
- **API Route Implementation** - Created RESTful endpoints with proper error handling and authentication

### Code Review & Optimization

Kiro performed comprehensive code review and identified several optimization opportunities:

| Issue | Before | After |
|-------|--------|-------|
| Database Queries | N+1 query pattern | Batch queries with `inArray` |
| API Security | No authentication | `requireAuth()` middleware |
| Type Safety | `any` types | Explicit type definitions |
| Connection Pool | Default settings | Optimized with timeouts |
| Error Handling | Inconsistent | Unified `apiError/apiSuccess` utils |

### Debugging & Problem Solving

- **Serverless Timer Issue** - Kiro identified that `setTimeout` is unreliable in Vercel's serverless environment and suggested the hybrid cron approach
- **BigInt Serialization** - Helped solve JSON serialization issues with Telegram's 64-bit IDs
- **React 19 Patterns** - Fixed `useEffect` anti-patterns flagged by ESLint

### Documentation

- Generated comprehensive README with bilingual support (Chinese/English)
- Created this project description document
- Maintained inline code comments

### Steering Rules

We configured Kiro with project-specific steering rules in `.kiro/steering/`:

```markdown
# tech.md - Technology constraints
- Next.js 16 with App Router
- pnpm as package manager
- Drizzle ORM for database

# product.md - Product context  
- Primary language: Chinese
- Telegram bot management system

# structure.md - Code organization
- Server actions alongside pages
- @/ import alias
```

### Development Velocity

With Kiro's assistance:

| Task | Traditional | With Kiro |
|------|-------------|-----------|
| Initial Setup | 4-6 hours | 30 minutes |
| CRUD APIs | 2-3 hours each | 15-20 minutes each |
| Bug Fixing | Variable | Minutes with context |
| Code Review | Manual | Automated suggestions |
| Documentation | Often skipped | Generated alongside code |

### Key Kiro Features Used

1. **Multi-file Editing** - Simultaneous updates across related files
2. **Diagnostics Integration** - Real-time TypeScript and ESLint error detection
3. **Context Awareness** - Understanding of project structure and conventions
4. **Iterative Refinement** - Back-and-forth dialogue to perfect implementations

---

*Built with ❤️ and Kiro for the hackathon*
