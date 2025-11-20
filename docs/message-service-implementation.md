# Message Service Implementation

## Overview
Implemented the complete MessageService class with all required functionality for handling Telegram messages.

## Implementation Date
Task 6 from GoodBot implementation plan

## Requirements Addressed
- **2.1, 2.2**: Receive and store messages with complete information
- **2.3**: Display messages in reverse chronological order
- **2.4**: Implement pagination (50 messages per page)
- **3.2**: Send messages through Telegram Bot API
- **3.3**: Store sent messages to database
- **3.5**: Display conversation history in chronological order
- **7.3**: Use database transactions for data integrity

## Implemented Methods

### 1. saveIncomingMessage(update: Update)
- Extracts message data from Telegram Update object
- Stores incoming messages with all metadata
- Returns the saved Message or null if no message in update

### 2. getMessages(filters, pagination)
- Retrieves messages with optional filtering by:
  - chatId
  - chatType
  - direction (incoming/outgoing)
  - status
- Supports pagination with configurable page size (default 50)
- Returns messages in **descending order** by createdAt (newest first)
- Uses transaction for data consistency
- Returns PaginatedMessages with total count and hasMore flag

### 3. getConversation(chatId, pagination)
- Retrieves all messages for a specific chat
- Returns messages in **ascending order** by createdAt (chronological)
- Supports pagination
- Uses transaction for data consistency
- Perfect for displaying conversation history

### 4. sendMessage(chatId, text)
- Sends message via Telegram Bot API
- Stores sent message to database with status 'sent'
- Uses transaction to ensure atomicity (send + store)
- On failure: stores message with status 'failed' and throws error
- Returns the saved Message object

### 5. saveMessage(params)
- Internal method for saving messages
- Uses transaction to ensure data integrity
- Supports both incoming and outgoing messages

## Key Features

### Transaction Support
All database operations use `prisma.$transaction()` to ensure:
- Data integrity (Requirement 7.3)
- Atomic operations (especially for send + store)
- Consistency between read operations (count + fetch)

### Error Handling
- Bot not configured: throws clear error
- Send failure: stores failed message and throws descriptive error
- All errors include original error messages

### Pagination
- Default: 50 messages per page
- Configurable limit
- Returns hasMore flag for UI
- Calculates total count for pagination controls

### Message Direction
- **incoming**: Messages received from users
- **outgoing**: Messages sent by the bot

### Message Status
- **received**: Successfully received from Telegram
- **sent**: Successfully sent to Telegram
- **failed**: Send attempt failed

## Data Flow

### Receiving Messages
```
Telegram → Webhook → saveIncomingMessage() → Database
```

### Sending Messages
```
UI → sendMessage() → Telegram API → Database
                   ↓ (on failure)
                   Database (status: failed)
```

### Querying Messages
```
UI → getMessages() / getConversation() → Database → UI
```

## Integration Points

### With BotConfigService
- Uses `botConfigService.createBotInstance()` to get Bot for sending
- Ensures bot is configured before sending messages

### With Webhook Handler
- Webhook calls `saveIncomingMessage()` for all incoming messages
- Handles both private and group messages

### With Database
- All operations use Prisma ORM
- Leverages indexes on (chatId, createdAt) for performance
- Uses transactions for data integrity

## Testing Considerations

### Unit Tests (Optional - Task 6.1-6.4)
The following optional test tasks are defined:
- 6.1: Property test for message list sorting
- 6.2: Property test for conversation history sorting
- 6.3: Property test for message send and store
- 6.4: Property test for transaction integrity

### Manual Testing
To test the implementation:
1. Send a message to the bot → verify it's stored
2. Call getMessages() → verify pagination and sorting
3. Call getConversation() → verify chronological order
4. Call sendMessage() → verify it sends and stores

## Files Modified
- `lib/message-service.ts` - Complete implementation

## Dependencies
- `@prisma/client` - Database ORM
- `grammy` - Telegram Bot SDK
- `lib/bot-config-service` - Bot instance management
- `lib/prisma` - Database client

## Next Steps
The service is ready for use in API routes:
- GET /api/messages - List messages
- GET /api/messages/[chatId] - Get conversation
- POST /api/messages/send - Send message
