# Webhook Implementation

## Overview

The webhook handler is implemented at `/api/webhook` and receives POST requests from Telegram servers when messages or events occur.

## Implementation Details

### Files Created

1. **`app/api/webhook/route.ts`** - Main webhook endpoint
2. **`lib/message-service.ts`** - Service for handling message storage
3. **`lib/group-service.ts`** - Service for handling group management

### Features

#### 1. Webhook Security (需求 2.1, 4.1, 5.1)

The webhook validates incoming requests using a secret token:
- Checks `x-telegram-bot-api-secret-token` header
- Compares against `TELEGRAM_WEBHOOK_SECRET` environment variable
- Returns 401 Unauthorized if validation fails

#### 2. Message Type Handling

The webhook distinguishes between different message types:

- **Private Messages**: Messages from individual users
- **Group Messages**: Messages from group chats
- **Supergroup Messages**: Messages from supergroups
- **Bot Join/Leave Events**: When the bot is added to or removed from groups

#### 3. Message Processing (需求 2.1, 2.2)

For incoming messages:
- Extracts message ID, chat ID, chat type
- Captures sender information (ID, username, first name)
- Stores message text and timestamp
- Marks as 'incoming' with 'received' status

#### 4. Group Management (需求 4.1, 5.1)

For group-related events:
- Detects when bot joins a group
- Stores group information (chat ID, title, type)
- Updates group status when bot leaves
- Handles group messages and ensures group info is saved

### API Endpoint

```
POST /api/webhook
```

**Headers:**
- `x-telegram-bot-api-secret-token`: Secret token for validation (optional but recommended)

**Request Body:**
Telegram Update object (JSON)

**Response:**
```json
{
  "ok": true
}
```

### Error Handling

The webhook handles various error scenarios:
- Invalid secret token → 401 Unauthorized
- No bot configuration → 500 Internal Server Error
- Processing errors → 500 with error details logged

### Setting Up the Webhook

To configure Telegram to send updates to this endpoint:

1. Ensure `TELEGRAM_WEBHOOK_SECRET` is set in environment variables
2. Use the Bot Config API to set the webhook URL:
   ```
   POST /api/bot/webhook
   {
     "url": "https://your-domain.vercel.app/api/webhook"
   }
   ```

### Testing

To test the webhook locally:

1. Use ngrok or similar tool to expose local server
2. Set webhook URL to the ngrok URL
3. Send messages to your bot
4. Check database for stored messages

### Database Schema

Messages are stored with the following structure:
- `messageId`: Telegram message ID
- `chatId`: Telegram chat ID
- `chatType`: 'private', 'group', or 'supergroup'
- `senderId`: Telegram user ID
- `senderUsername`: Username (if available)
- `senderFirstName`: First name
- `text`: Message content
- `direction`: 'incoming' or 'outgoing'
- `status`: 'received', 'sent', or 'failed'
- `createdAt`: Timestamp

Groups are stored with:
- `chatId`: Telegram chat ID (unique)
- `title`: Group name
- `type`: 'group' or 'supergroup'
- `memberCount`: Number of members (optional)
- `joinedAt`: When bot joined
- `leftAt`: When bot left (if applicable)
- `isActive`: Whether bot is still in the group

## Requirements Validation

✅ **需求 2.1**: Webhook receives messages and stores to database
✅ **需求 2.2**: Records sender info, content, timestamp, and chat type
✅ **需求 4.1**: Automatically detects and stores group information when bot joins
✅ **需求 5.1**: Receives and stores group messages

## Next Steps

After implementing the webhook:
1. Implement message retrieval APIs (Task 6)
2. Implement group management APIs (Task 7)
3. Create UI for viewing messages (Task 13)
4. Create UI for managing groups (Task 14)
