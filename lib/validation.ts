/**
 * Input Validation Utilities
 * 验证所有用户输入
 * 需求: 6.1, 6.2, 6.3 - 确保输入安全性
 */

import { z } from 'zod'

/**
 * Bot 配置验证 Schema
 */
export const botConfigSchema = z.object({
  token: z
    .string()
    .min(1, 'Bot Token is required')
    .regex(/^\d+:[A-Za-z0-9_-]+$/, 'Invalid Bot Token format'),
})

/**
 * 消息发送验证 Schema
 */
export const sendMessageSchema = z.object({
  chatId: z
    .string()
    .min(1, 'Chat ID is required')
    .regex(/^-?\d+$/, 'Chat ID must be a valid number'),
  text: z
    .string()
    .min(1, 'Message text is required')
    .max(4096, 'Message text must not exceed 4096 characters')
    .trim(),
})

/**
 * 群组 ID 验证 Schema
 */
export const groupIdSchema = z.object({
  id: z
    .string()
    .min(1, 'Group ID is required')
    .regex(/^-?\d+$/, 'Group ID must be a valid number'),
})

/**
 * 分页参数验证 Schema
 */
export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must not exceed 100')
    .default(50),
})

/**
 * 消息过滤器验证 Schema
 */
export const messageFiltersSchema = z.object({
  chatId: z.string().optional(),
  direction: z.enum(['incoming', 'outgoing']).optional(),
  chatType: z.enum(['private', 'group', 'supergroup']).optional(),
})

/**
 * 登录凭证验证 Schema
 */
export const loginCredentialsSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email is too long'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long'),
})

/**
 * Webhook 更新验证 Schema
 * 验证 Telegram Update 对象的基本结构
 */
export const webhookUpdateSchema = z.object({
  update_id: z.number(),
  message: z
    .object({
      message_id: z.number(),
      chat: z.object({
        id: z.number(),
        type: z.enum(['private', 'group', 'supergroup', 'channel']),
      }),
      from: z
        .object({
          id: z.number(),
          is_bot: z.boolean().optional(),
          first_name: z.string(),
          username: z.string().optional(),
        })
        .optional(),
      text: z.string().optional(),
      date: z.number(),
    })
    .optional(),
  my_chat_member: z
    .object({
      chat: z.object({
        id: z.number(),
        type: z.enum(['private', 'group', 'supergroup', 'channel']),
        title: z.string().optional(),
      }),
      new_chat_member: z.object({
        status: z.enum([
          'creator',
          'administrator',
          'member',
          'restricted',
          'left',
          'kicked',
        ]),
      }),
    })
    .optional(),
  chat_member: z.any().optional(),
})

/**
 * 清理和规范化字符串输入
 * 防止 XSS 和注入攻击
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // 移除控制字符
    .slice(0, 10000) // 限制最大长度
}

/**
 * 验证和清理 Chat ID
 */
export function validateChatId(chatId: string | number): string {
  const id = typeof chatId === 'number' ? chatId.toString() : chatId
  const result = z.string().regex(/^-?\d+$/).safeParse(id)
  
  if (!result.success) {
    throw new Error('Invalid chat ID format')
  }
  
  return result.data
}

/**
 * 验证 Telegram Bot Token 格式
 */
export function validateBotToken(token: string): boolean {
  return /^\d+:[A-Za-z0-9_-]+$/.test(token)
}

/**
 * 通用验证函数
 * 使用 Zod schema 验证数据并返回类型安全的结果
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return { success: false, errors: result.error }
}

/**
 * 格式化 Zod 验证错误为用户友好的消息
 */
export function formatValidationErrors(error: z.ZodError): string[] {
  return error.issues.map((err) => {
    const path = err.path.join('.')
    return path ? `${path}: ${err.message}` : err.message
  })
}
