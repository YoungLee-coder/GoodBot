'use client'

/**
 * 错误边界组件
 * 需求: 7.5 - 优雅处理错误并保持系统稳定
 */

import React from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">出错了</CardTitle>
              <CardDescription>应用程序遇到了一个错误</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-destructive/10 p-4">
                <p className="text-sm text-destructive">
                  {this.state.error?.message || '未知错误'}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={this.handleReset} variant="default">
                重试
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="outline">
                返回首页
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 简单的错误显示组件
 */
interface ErrorDisplayProps {
  error: Error | string
  onRetry?: () => void
  className?: string
}

export function ErrorDisplay({ error, onRetry, className }: ErrorDisplayProps) {
  const message = typeof error === 'string' ? error : error.message

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-destructive">错误</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
      {onRetry && (
        <CardFooter>
          <Button onClick={onRetry} variant="outline" size="sm">
            重试
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
