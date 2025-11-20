'use client'

/**
 * Toast 通知工具 Hook
 * 需求: 1.3, 3.4 - 显示操作结果和错误信息
 */

import { toast as sonnerToast } from 'sonner'
import { ErrorCode, getUserFriendlyErrorMessage, isErrorResponse, type ApiResponse } from './errors'

export interface ToastOptions {
  title?: string
  description?: string
  duration?: number
}

/**
 * Toast 工具函数
 */
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(options?.title || '成功', {
      description: message,
      duration: options?.duration,
    })
  },

  error: (message: string, options?: ToastOptions) => {
    sonnerToast.error(options?.title || '错误', {
      description: message,
      duration: options?.duration,
    })
  },

  warning: (message: string, options?: ToastOptions) => {
    sonnerToast.warning(options?.title || '警告', {
      description: message,
      duration: options?.duration,
    })
  },

  info: (message: string, options?: ToastOptions) => {
    sonnerToast.info(options?.title || '提示', {
      description: message,
      duration: options?.duration,
    })
  },

  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(options?.title || '加载中', {
      description: message,
      duration: options?.duration,
    })
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    })
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId)
  },
}

/**
 * 处理 API 响应并显示相应的 Toast
 */
export function handleApiResponse<T>(
  response: ApiResponse<T>,
  options?: {
    successMessage?: string
    errorTitle?: string
    showSuccess?: boolean
  }
): T | null {
  if (isErrorResponse(response)) {
    const errorMessage = response.error.message || getUserFriendlyErrorMessage(response.error.code as ErrorCode)
    toast.error(errorMessage, { title: options?.errorTitle })
    return null
  }

  if (options?.showSuccess !== false && options?.successMessage) {
    toast.success(options.successMessage)
  }

  return response.data || null
}

/**
 * 处理 API 错误并显示 Toast
 */
export function handleApiError(error: unknown, customMessage?: string) {
  console.error('API Error:', error)

  let message = customMessage || '操作失败，请稍后重试'

  if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  }

  toast.error(message)
}
