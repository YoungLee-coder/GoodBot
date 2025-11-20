/**
 * Rate Limit Middleware
 * 为 API 路由提供速率限制中间件
 * 需求: 6.1, 6.2, 6.3 - 保护 API 端点免受滥用
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, RateLimitConfig } from './rate-limiter'

/**
 * 从请求中获取客户端标识符
 * 优先使用认证用户 ID，否则使用 IP 地址
 */
function getClientIdentifier(request: NextRequest): string {
  // 尝试从请求头获取 IP 地址
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  // 使用第一个可用的标识符
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIp) {
    return realIp
  }
  
  // 回退到默认值
  return 'unknown'
}

/**
 * 创建速率限制中间件
 * @param config 速率限制配置
 * @returns 中间件函数
 */
export function withRateLimit(config: RateLimitConfig) {
  return async function rateLimitMiddleware<T>(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<T>
  ): Promise<T | NextResponse> {
    const identifier = getClientIdentifier(request)
    const result = checkRateLimit(identifier, config)

    // 添加速率限制响应头
    const headers = new Headers()
    headers.set('X-RateLimit-Limit', result.limit.toString())
    headers.set('X-RateLimit-Remaining', result.remaining.toString())
    headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString())

    // 如果超过限制，返回 429 错误
    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
      headers.set('Retry-After', retryAfter.toString())

      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
            retryAfter,
          },
        },
        {
          status: 429,
          headers,
        }
      )
    }

    // 执行实际的处理器
    const response = await handler(request)

    // 如果响应是 NextResponse，添加速率限制头
    if (response instanceof NextResponse) {
      for (const [key, value] of headers.entries()) {
        response.headers.set(key, value)
      }
    }

    return response
  }
}

/**
 * 预定义的速率限制配置
 */
export const rateLimitConfigs = {
  // 严格限制：用于敏感操作（如登录、发送消息）
  strict: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 分钟
  },
  // 中等限制：用于一般 API 操作
  moderate: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 分钟
  },
  // 宽松限制：用于读取操作
  lenient: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 分钟
  },
  // Webhook 限制：防止 Webhook 滥用
  webhook: {
    maxRequests: 100,
    windowMs: 10 * 1000, // 10 秒
  },
} as const
