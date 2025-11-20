/**
 * Security Implementation Tests
 * 验证安全措施的基本功能
 * 需求: 6.1, 6.2, 6.3
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, resetRateLimit } from '../rate-limiter'
import {
  validateBotToken,
  validateChatId,
  sanitizeString,
  botConfigSchema,
  sendMessageSchema,
  groupIdSchema,
} from '../validation'

describe('Rate Limiter', () => {
  beforeEach(() => {
    // 清理速率限制记录
    resetRateLimit('test-client')
  })

  it('should allow requests within limit', () => {
    const config = { maxRequests: 5, windowMs: 60000 }
    
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit('test-client', config)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(5 - i - 1)
    }
  })

  it('should block requests exceeding limit', () => {
    const config = { maxRequests: 3, windowMs: 60000 }
    
    // 前 3 个请求应该成功
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit('test-client', config)
      expect(result.success).toBe(true)
    }
    
    // 第 4 个请求应该失败
    const result = checkRateLimit('test-client', config)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should reset after time window', () => {
    const config = { maxRequests: 2, windowMs: 100 } // 100ms 窗口
    
    // 使用完限额
    checkRateLimit('test-client', config)
    checkRateLimit('test-client', config)
    
    const blocked = checkRateLimit('test-client', config)
    expect(blocked.success).toBe(false)
    
    // 等待窗口过期
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const result = checkRateLimit('test-client', config)
        expect(result.success).toBe(true)
        resolve()
      }, 150)
    })
  })
})

describe('Input Validation', () => {
  describe('Bot Token Validation', () => {
    it('should accept valid bot tokens', () => {
      expect(validateBotToken('123456789:ABCdefGHIjklMNOpqrsTUVwxyz-_123')).toBe(true)
      expect(validateBotToken('987654321:XYZ123abc-_')).toBe(true)
    })

    it('should reject invalid bot tokens', () => {
      expect(validateBotToken('invalid')).toBe(false)
      expect(validateBotToken('123456789')).toBe(false)
      expect(validateBotToken(':ABCdef')).toBe(false)
      expect(validateBotToken('123:ABC def')).toBe(false) // 空格
      expect(validateBotToken('abc:123')).toBe(false) // 非数字前缀
    })
  })

  describe('Chat ID Validation', () => {
    it('should accept valid chat IDs', () => {
      expect(() => validateChatId('123456789')).not.toThrow()
      expect(() => validateChatId('-987654321')).not.toThrow()
      expect(() => validateChatId(123456789)).not.toThrow()
      expect(() => validateChatId(-987654321)).not.toThrow()
    })

    it('should reject invalid chat IDs', () => {
      expect(() => validateChatId('abc')).toThrow()
      expect(() => validateChatId('123abc')).toThrow()
      expect(() => validateChatId('12.34')).toThrow()
      expect(() => validateChatId('')).toThrow()
    })
  })

  describe('String Sanitization', () => {
    it('should remove control characters', () => {
      const input = 'Hello\x00World\x08Test'
      const result = sanitizeString(input)
      expect(result).toBe('HelloWorldTest')
    })

    it('should trim whitespace', () => {
      const input = '  Hello World  '
      const result = sanitizeString(input)
      expect(result).toBe('Hello World')
    })

    it('should limit length', () => {
      const input = 'a'.repeat(20000)
      const result = sanitizeString(input)
      expect(result.length).toBeLessThanOrEqual(10000)
    })
  })

  describe('Schema Validation', () => {
    it('should validate bot config schema', () => {
      const valid = { token: '123456789:ABCdefGHI' }
      const result = botConfigSchema.safeParse(valid)
      expect(result.success).toBe(true)

      const invalid = { token: 'invalid' }
      const result2 = botConfigSchema.safeParse(invalid)
      expect(result2.success).toBe(false)
    })

    it('should validate send message schema', () => {
      const valid = { chatId: '123456789', text: 'Hello' }
      const result = sendMessageSchema.safeParse(valid)
      expect(result.success).toBe(true)

      const tooLong = { chatId: '123', text: 'a'.repeat(5000) }
      const result2 = sendMessageSchema.safeParse(tooLong)
      expect(result2.success).toBe(false)

      const empty = { chatId: '123', text: '' }
      const result3 = sendMessageSchema.safeParse(empty)
      expect(result3.success).toBe(false)
    })

    it('should validate group ID schema', () => {
      const valid = { id: '-987654321' }
      const result = groupIdSchema.safeParse(valid)
      expect(result.success).toBe(true)

      const invalid = { id: 'abc' }
      const result2 = groupIdSchema.safeParse(invalid)
      expect(result2.success).toBe(false)
    })
  })
})

describe('Security Integration', () => {
  it('should enforce rate limiting on multiple clients', () => {
    const config = { maxRequests: 2, windowMs: 60000 }
    
    // Client 1
    expect(checkRateLimit('client-1', config).success).toBe(true)
    expect(checkRateLimit('client-1', config).success).toBe(true)
    expect(checkRateLimit('client-1', config).success).toBe(false)
    
    // Client 2 应该有独立的限额
    expect(checkRateLimit('client-2', config).success).toBe(true)
    expect(checkRateLimit('client-2', config).success).toBe(true)
    expect(checkRateLimit('client-2', config).success).toBe(false)
  })

  it('should validate and sanitize user input', () => {
    const userInput = {
      chatId: '123456789',
      text: '  Hello\x00World  ',
    }
    
    // 验证
    const validated = sendMessageSchema.parse(userInput)
    
    // chatId 应该保持不变
    expect(validated.chatId).toBe('123456789')
    // text 应该被 trim
    expect(validated.text).toBe('Hello\x00World')
    
    // 清理控制字符
    const sanitized = sanitizeString(validated.text)
    expect(sanitized).toBe('HelloWorld')
  })
})
