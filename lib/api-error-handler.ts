/**
 * API 错误处理中间件
 * 需求: 7.2, 7.5 - 优雅处理错误并保持系统稳定
 */

import { NextResponse } from 'next/server'
import { AppError, ErrorCode, createErrorResponse } from './errors'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'

/**
 * 处理 API 错误并返回统一格式的响应
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  // 处理自定义应用错误
  if (error instanceof AppError) {
    return NextResponse.json(error.toJSON(), { status: error.statusCode })
  }

  // 处理 Zod 验证错误
  if (error instanceof ZodError) {
    return NextResponse.json(
      createErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Invalid input data',
        error.issues
      ),
      { status: 400 }
    )
  }

  // 处理 Prisma 错误
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error)
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      createErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Database validation error',
        error.message
      ),
      { status: 400 }
    )
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      createErrorResponse(
        ErrorCode.CONNECTION_FAILED,
        'Database connection failed',
        error.message
      ),
      { status: 503 }
    )
  }

  // 处理标准 Error
  if (error instanceof Error) {
    // 检查特定错误消息模式
    const message = error.message.toLowerCase()

    if (message.includes('invalid bot token') || message.includes('unauthorized')) {
      return NextResponse.json(
        createErrorResponse(ErrorCode.INVALID_TOKEN, error.message),
        { status: 401 }
      )
    }

    if (message.includes('not found')) {
      return NextResponse.json(
        createErrorResponse(ErrorCode.NOT_FOUND, error.message),
        { status: 404 }
      )
    }

    if (message.includes('timeout') || message.includes('network')) {
      return NextResponse.json(
        createErrorResponse(ErrorCode.NETWORK_ERROR, error.message),
        { status: 504 }
      )
    }

    if (message.includes('rate limit')) {
      return NextResponse.json(
        createErrorResponse(ErrorCode.RATE_LIMIT, error.message),
        { status: 429 }
      )
    }

    // 通用错误
    return NextResponse.json(
      createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message),
      { status: 500 }
    )
  }

  // 未知错误
  return NextResponse.json(
    createErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      'An unexpected error occurred',
      String(error)
    ),
    { status: 500 }
  )
}

/**
 * 处理 Prisma 特定错误
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): NextResponse {
  switch (error.code) {
    case 'P2002':
      // 唯一约束冲突
      return NextResponse.json(
        createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'A record with this value already exists',
          { field: error.meta?.target }
        ),
        { status: 409 }
      )

    case 'P2025':
      // 记录不存在
      return NextResponse.json(
        createErrorResponse(
          ErrorCode.NOT_FOUND,
          'Record not found',
          error.meta
        ),
        { status: 404 }
      )

    case 'P2003':
      // 外键约束失败
      return NextResponse.json(
        createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Foreign key constraint failed',
          error.meta
        ),
        { status: 400 }
      )

    case 'P2024':
      // 连接超时
      return NextResponse.json(
        createErrorResponse(
          ErrorCode.CONNECTION_FAILED,
          'Database connection timeout',
          error.meta
        ),
        { status: 504 }
      )

    default:
      // 其他 Prisma 错误
      return NextResponse.json(
        createErrorResponse(
          ErrorCode.DATABASE_ERROR,
          'Database operation failed',
          { code: error.code, meta: error.meta }
        ),
        { status: 500 }
      )
  }
}

/**
 * API 路由包装器，自动处理错误
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
