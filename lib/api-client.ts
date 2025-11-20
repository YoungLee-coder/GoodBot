/**
 * API 客户端工具
 * 提供统一的 API 调用接口和错误处理
 * 需求: 1.3, 3.4, 7.2, 7.5
 */

import { ApiResponse, ErrorCode, createErrorResponse } from './errors'

export interface FetchOptions extends RequestInit {
  timeout?: number
}

/**
 * 统一的 API 调用函数
 */
export async function apiClient<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { timeout = 30000, ...fetchOptions } = options

  try {
    // 创建超时控制器
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    })

    clearTimeout(timeoutId)

    // 检查响应内容类型
    const contentType = response.headers.get('content-type')
    
    // 如果不是 JSON，可能是 HTML 错误页面
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Non-JSON response from:', url)
      console.error('Status:', response.status)
      console.error('Content-Type:', contentType)
      console.error('Response preview:', text.substring(0, 200))
      
      // 如果是 401/403，可能是认证问题
      if (response.status === 401 || response.status === 403) {
        return createErrorResponse(
          ErrorCode.UNAUTHORIZED,
          '未授权访问，请重新登录'
        )
      }
      
      return createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        `服务器返回了非 JSON 响应 (${response.status})`
      )
    }

    // 解析响应
    let data: any
    try {
      data = await response.json()
    } catch (jsonError) {
      console.error('JSON parse error for:', url)
      console.error('Response status:', response.status)
      return createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        'JSON 解析失败'
      )
    }

    // 如果响应不是 2xx，返回错误
    if (!response.ok) {
      return data as ApiResponse<T>
    }

    return data as ApiResponse<T>
  } catch (error) {
    console.error('API Client Error:', error)

    // 处理超时错误
    if (error instanceof Error && error.name === 'AbortError') {
      return createErrorResponse(
        ErrorCode.NETWORK_ERROR,
        '请求超时，请检查网络连接'
      )
    }

    // 处理网络错误
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return createErrorResponse(
        ErrorCode.NETWORK_ERROR,
        '网络连接失败，请检查网络'
      )
    }

    // 其他错误
    return createErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : '未知错误'
    )
  }
}

/**
 * GET 请求
 */
export async function get<T = any>(
  url: string,
  options?: FetchOptions
): Promise<ApiResponse<T>> {
  return apiClient<T>(url, { ...options, method: 'GET' })
}

/**
 * POST 请求
 */
export async function post<T = any>(
  url: string,
  data?: any,
  options?: FetchOptions
): Promise<ApiResponse<T>> {
  return apiClient<T>(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PUT 请求
 */
export async function put<T = any>(
  url: string,
  data?: any,
  options?: FetchOptions
): Promise<ApiResponse<T>> {
  return apiClient<T>(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * DELETE 请求
 */
export async function del<T = any>(
  url: string,
  options?: FetchOptions
): Promise<ApiResponse<T>> {
  return apiClient<T>(url, { ...options, method: 'DELETE' })
}

/**
 * PATCH 请求
 */
export async function patch<T = any>(
  url: string,
  data?: any,
  options?: FetchOptions
): Promise<ApiResponse<T>> {
  return apiClient<T>(url, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  })
}
