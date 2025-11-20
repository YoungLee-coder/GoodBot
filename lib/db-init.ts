/**
 * 数据库自动初始化工具
 * 在首次部署时自动检测并初始化数据库
 */

import { prisma } from './prisma'
import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { join } from 'path'
import { hashPassword } from './password'

let isInitialized = false
let isInitializing = false

/**
 * 检查数据库是否已初始化
 */
async function isDatabaseInitialized(): Promise<boolean> {
  try {
    // 尝试查询 User 表，如果表不存在会抛出错误
    await prisma.user.findFirst()
    return true
  } catch (error: any) {
    // 如果是表不存在的错误，返回 false
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return false
    }
    // 其他错误也认为未初始化
    console.error('Database check error:', error)
    return false
  }
}

/**
 * 运行数据库迁移 SQL
 */
async function runMigrationSQL(): Promise<void> {
  const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
  
  if (!directUrl) {
    throw new Error('No database URL configured')
  }

  const pool = new Pool({ connectionString: directUrl })
  
  try {
    // 读取迁移 SQL 文件
    const sqlPath = join(process.cwd(), 'prisma', 'migration.sql')
    const sql = readFileSync(sqlPath, 'utf-8')
    
    // 移除注释并分割语句
    const statements = sql
      .split('\n')
      .filter((line) => !line.trim().startsWith('--') && line.trim())
      .join('\n')
      .split(';')
      .filter((stmt) => stmt.trim())
    
    console.log(`Running ${statements.length} SQL statements...`)
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement)
      }
    }
    
    console.log('✅ Database tables created successfully')
  } catch (error: any) {
    // 如果表已存在，忽略错误
    if (error.code === '42P07') {
      console.log('ℹ️  Tables already exist, skipping creation')
    } else {
      throw error
    }
  } finally {
    await pool.end()
  }
}

/**
 * 创建默认管理员用户
 */
async function createDefaultAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com'
  const password = process.env.ADMIN_PASSWORD || 'admin123456'
  
  // 检查是否已存在管理员
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })
  
  if (existingUser) {
    console.log('ℹ️  Admin user already exists')
    return
  }
  
  // 创建管理员用户
  const hashedPassword = await hashPassword(password)
  
  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Admin',
    },
  })
  
  console.log('✅ Admin user created successfully')
  console.log(`   Email: ${email}`)
}

/**
 * 初始化数据库
 */
export async function initializeDatabase(): Promise<void> {
  // 如果已经初始化或正在初始化，直接返回
  if (isInitialized || isInitializing) {
    return
  }
  
  isInitializing = true
  
  try {
    console.log('🔍 Checking database initialization status...')
    
    const initialized = await isDatabaseInitialized()
    
    if (initialized) {
      console.log('✅ Database already initialized')
      isInitialized = true
      return
    }
    
    console.log('🚀 Starting database initialization...')
    
    // 运行迁移
    await runMigrationSQL()
    
    // 创建管理员用户
    await createDefaultAdmin()
    
    console.log('✅ Database initialization completed!')
    isInitialized = true
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  } finally {
    isInitializing = false
  }
}

/**
 * 确保数据库已初始化（用于 API 路由）
 */
export async function ensureDatabaseInitialized(): Promise<void> {
  if (!isInitialized) {
    await initializeDatabase()
  }
}
