/**
 * Rate Limiter
 * 实现 API 速率限制防止滥用
 * 需求: 6.1, 6.2, 6.3 - 保护 API 端点
 */

interface RateLimitStore {
  count: number
  resetTime: number
}

// 使用 Map 存储速率限制信息（生产环境应使用 Redis）
const store = new Map<string, RateLimitStore>()

export interface RateLimitConfig {
  /**
   * 时间窗口内允许的最大请求数
   */
  maxRequests: number
  /**
   * 时间窗口（毫秒）
   */
  windowMs: number
  /**
   * 是否跳过成功的请求（仅计算失败的请求）
   */
  skipSuccessfulRequests?: boolean
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * 检查速率限制
 * @param identifier 唯一标识符（如 IP 地址或用户 ID）
 * @param config 速率限制配置
 * @returns 速率限制结果
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const key = identifier

  // 获取或创建速率限制记录
  let record = store.get(key)

  // 如果记录不存在或已过期，创建新记录
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + config.windowMs,
    }
    store.set(key, record)
  }

  // 增加请求计数
  record.count++

  // 检查是否超过限制
  const success = record.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - record.count)

  return {
    success,
    limit: config.maxRequests,
    remaining,
    reset: record.resetTime,
  }
}

/**
 * 清理过期的速率限制记录
 * 应该定期调用以防止内存泄漏
 */
export function cleanupExpiredRecords(): void {
  const now = Date.now()
  for (const [key, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(key)
    }
  }
}

/**
 * 重置特定标识符的速率限制
 * @param identifier 唯一标识符
 */
export function resetRateLimit(identifier: string): void {
  store.delete(identifier)
}

// 定期清理过期记录（每小时）
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRecords, 60 * 60 * 1000)
}
