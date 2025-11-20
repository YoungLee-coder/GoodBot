'use client'

/**
 * Toast 通知组件
 * 需求: 1.3, 3.4 - 显示操作结果和错误信息
 */

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          error: 'group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive',
          success: 'group-[.toaster]:bg-green-600 group-[.toaster]:text-white group-[.toaster]:border-green-600',
          warning: 'group-[.toaster]:bg-yellow-600 group-[.toaster]:text-white group-[.toaster]:border-yellow-600',
          info: 'group-[.toaster]:bg-blue-600 group-[.toaster]:text-white group-[.toaster]:border-blue-600',
        },
      }}
    />
  )
}
