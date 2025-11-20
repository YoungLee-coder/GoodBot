# Cursor-Based Pagination Implementation

## Overview

This document describes the cursor-based pagination implementation for the GoodBot system, which optimizes query performance for large datasets.

## Database Indexes

The following indexes have been created to optimize pagination queries:

### Message Table
- **Composite Index**: `(chatId, createdAt)` - Optimizes queries filtering by chat and ordering by time
- **Single Index**: `(direction)` - Optimizes queries filtering by message direction

### Group Table
- **Single Index**: `(isActive)` - Optimizes queries filtering active groups

These indexes are defined in `prisma/schema.prisma` and applied via migrations.

## Pagination Strategy

The system supports **two pagination methods**:

### 1. Offset-Based Pagination (Traditional)
- Uses `page` and `limit` parameters
- Suitable for small to medium datasets
- Backward compatible with existing implementations
- Example: `?page=2&limit=50`

### 2. Cursor-Based Pagination (Optimized)
- Uses `cursor` and `limit` parameters
- More efficient for large datasets
- Avoids performance degradation with deep pagination
- Example: `?cursor=clxyz123&limit=50`

## API Usage

### Messages List API

**Endpoint**: `GET /api/messages`

**Offset-based pagination**:
```
GET /api/messages?page=1&limit=50&chatId=123
```

**Cursor-based pagination**:
```
GET /api/messages?cursor=clxyz123&limit=50&chatId=123
```

**Response**:
```json
{
  "success": true,
  "data": {
    "messages": [...],
    "total": 1000,
    "page": 1,
    "limit": 50,
    "hasMore": true,
    "nextCursor": "clxyz456",
    "prevCursor": "clxyz123"
  }
}
```

### Conversation API

**Endpoint**: `GET /api/messages/[chatId]`

**Offset-based pagination**:
```
GET /api/messages/123?page=1&limit=50
```

**Cursor-based pagination**:
```
GET /api/messages/123?cursor=clxyz123&limit=50
```

### Group Messages API

**Endpoint**: `GET /api/groups/[id]/messages`

**Offset-based pagination**:
```
GET /api/groups/abc123/messages?page=1&limit=50
```

**Cursor-based pagination**:
```
GET /api/groups/abc123/messages?cursor=clxyz123&limit=50
```

## Implementation Details

### Service Layer

The `MessageService` class has been updated to support both pagination methods:

```typescript
async getMessages(
  filters: MessageFilters = {},
  pagination: Pagination = {}
): Promise<PaginatedMessages>
```

**Cursor-based logic**:
- When `cursor` is provided, uses Prisma's cursor-based pagination
- Skips the cursor record itself (`skip: 1`)
- Returns `nextCursor` for the next page
- More efficient for large datasets as it doesn't count all records

**Offset-based logic**:
- When `page` is provided (no cursor), uses traditional skip/take
- Calculates `skip = (page - 1) * limit`
- Counts total records for pagination metadata

### Performance Benefits

**Offset-based pagination**:
- Query time increases with page number
- `OFFSET 10000 LIMIT 50` scans 10,050 rows

**Cursor-based pagination**:
- Consistent query time regardless of position
- Uses index to jump directly to cursor position
- Only scans the required number of rows

### Migration Path

1. **Current state**: All APIs support both methods
2. **Backward compatibility**: Existing clients using `page` parameter continue to work
3. **Optimization**: New clients can use `cursor` parameter for better performance
4. **Future**: Consider deprecating offset-based pagination for large datasets

## Query Optimization

### Index Usage

The composite index `(chatId, createdAt)` enables efficient queries:

```sql
-- Optimized by index
SELECT * FROM "Message" 
WHERE "chatId" = '123' 
ORDER BY "createdAt" DESC 
LIMIT 50;

-- Cursor-based query (also optimized)
SELECT * FROM "Message" 
WHERE "chatId" = '123' AND "id" > 'cursor_id'
ORDER BY "createdAt" DESC 
LIMIT 50;
```

### Transaction Usage

All pagination queries use Prisma transactions to ensure data consistency:

```typescript
const result = await prisma.$transaction(async (tx) => {
  const total = await tx.message.count({ where })
  const messages = await tx.message.findMany({ where, orderBy, cursor, skip, take })
  return { messages, total }
})
```

## Best Practices

1. **Use cursor pagination for**:
   - Large datasets (>1000 records)
   - Real-time feeds
   - Infinite scroll implementations

2. **Use offset pagination for**:
   - Small datasets (<1000 records)
   - When total count is needed
   - When jumping to specific pages

3. **Limit validation**:
   - Maximum limit: 100 records per request
   - Default limit: 50 records
   - Prevents excessive memory usage

4. **Error handling**:
   - Invalid cursor returns 400 error
   - Missing required parameters return 400 error
   - Database errors return 500 error

## Testing

To test cursor-based pagination:

1. Create test data with many messages
2. Query first page: `GET /api/messages?limit=10`
3. Use `nextCursor` from response for next page: `GET /api/messages?cursor=<nextCursor>&limit=10`
4. Verify consistent performance across pages

## Requirements Validation

This implementation satisfies:
- **Requirement 7.4**: "WHEN 查询历史消息 THEN GoodBot系统 SHALL 使用索引优化查询性能"
- Composite indexes on frequently queried columns
- Cursor-based pagination for large datasets
- Efficient query execution plans
