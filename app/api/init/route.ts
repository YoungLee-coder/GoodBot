import { NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db-init'

/**
 * GET /api/init
 * 数据库初始化端点
 * 首次部署时访问此端点自动初始化数据库
 */
export async function GET() {
  try {
    await initializeDatabase()
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
    })
  } catch (error) {
    console.error('Initialization error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
