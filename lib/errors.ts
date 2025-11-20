/**
 * 统一的错误响应格式
 * 需求: 1.3, 3.4, 7.2, 7.5 - 提供明确的错误信息
 */

export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: any
  }
}

export interface SuccessResponse<T = any> {
  success: true
  message?: string
  data?: T
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse

/**
 * 错误代码枚举
 */
export enum ErrorCode {
  // 验证错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // 认证错误
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Bot 配置错误
  INVALID_TOKEN = 'INVALID_TOKEN',
  NO_CONFIG = 'NO_CONFIG',
  WEBHOOK_ERROR = 'WEBHOOK_ERROR',
  
  // 消息错误
  SEND_FAILED = 'SEND_FAILED',
  CHAT_NOT_FOUND = 'CHAT_NOT_FOUND',
  BOT_BLOCKED = 'BOT_BLOCKED',
  RATE_LIMIT = 'RATE_LIMIT',
  
  // 数据库错误
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  
  // 通用错误
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

/**
 * 应用错误类
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }

  toJSON(): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    }
  }
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: any
): ErrorResponse {
  return {
    error: {
      code,
      message,
      details,
    },
  }
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string
): SuccessResponse<T> {
  return {
    success: true,
    message,
    data,
  }
}

/**
 * 检查响应是否为错误
 */
export function isErrorResponse(response: ApiResponse): response is ErrorResponse {
  return 'error' in response
}

/**
 * 获取用户友好的错误消息
 */
export function getUserFriendlyErrorMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    [ErrorCode.VALIDATION_ERROR]: '输入数据无效，请检查后重试',
    [ErrorCode.UNAUTHORIZED]: '未授权访问，请先登录',
    [ErrorCode.FORBIDDEN]: '没有权限执行此操作',
    [ErrorCode.SESSION_EXPIRED]: '会话已过期，请重新登录',
    [ErrorCode.INVALID_TOKEN]: 'Bot Token 无效，请检查后重试',
    [ErrorCode.NO_CONFIG]: 'Bot 未配置，请先配置 Bot Token',
    [ErrorCode.WEBHOOK_ERROR]: 'Webhook 设置失败',
    [ErrorCode.SEND_FAILED]: '消息发送失败',
    [ErrorCode.CHAT_NOT_FOUND]: '聊天不存在或 Bot 已被用户屏蔽',
    [ErrorCode.BOT_BLOCKED]: 'Bot 已被用户屏蔽',
    [ErrorCode.RATE_LIMIT]: '请求过于频繁，请稍后再试',
    [ErrorCode.DATABASE_ERROR]: '数据库操作失败',
    [ErrorCode.CONNECTION_FAILED]: '连接失败，请检查网络',
    [ErrorCode.TRANSACTION_FAILED]: '事务执行失败',
    [ErrorCode.INTERNAL_ERROR]: '服务器内部错误',
    [ErrorCode.NOT_FOUND]: '资源不存在',
    [ErrorCode.NETWORK_ERROR]: '网络错误，请检查连接',
  }

  return messages[code] || '未知错误'
}
