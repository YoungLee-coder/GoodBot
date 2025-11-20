'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export default function SetupPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'initializing' | 'success' | 'error'>('checking')
  const [message, setMessage] = useState('正在检查数据库状态...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeDatabase()
  }, [])

  const initializeDatabase = async () => {
    try {
      setStatus('checking')
      setMessage('正在检查数据库状态...')
      
      // 调用初始化 API
      const response = await fetch('/api/init')
      const data = await response.json()
      
      if (data.success) {
        setStatus('success')
        setMessage('数据库初始化成功！')
        
        // 3 秒后跳转到登录页
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setStatus('error')
        setError(data.error || '初始化失败')
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : '未知错误')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>GoodBot 初始化</CardTitle>
          <CardDescription>
            首次部署设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'checking' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Spinner size="lg" />
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          )}

          {status === 'initializing' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Spinner size="lg" />
              <p className="text-sm text-gray-600">{message}</p>
              <p className="text-xs text-gray-500">这可能需要几秒钟...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">{message}</p>
                <p className="text-sm text-gray-600 mt-2">
                  正在跳转到登录页面...
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-green-600 h-2 animate-progress" />
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-red-900">初始化失败</p>
                <p className="text-sm text-red-600 mt-2">{error}</p>
              </div>
              <Button onClick={initializeDatabase} variant="outline">
                重试
              </Button>
            </div>
          )}

          {status === 'success' && (
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                默认管理员账号：
                <br />
                邮箱: {process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@example.com'}
                <br />
                密码: 请查看环境变量 ADMIN_PASSWORD
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .animate-progress {
          animation: progress 3s linear;
        }
      `}</style>
    </div>
  )
}
