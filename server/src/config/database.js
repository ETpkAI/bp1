const { Pool } = require('pg');

// 允许通过 DATABASE_URL 或离散变量配置数据库连接
// 重要：不要在生产环境默认启用 SSL，除非明确设置 DB_SSL=true
const createPool = () => {
  const hasConnectionString = !!process.env.DATABASE_URL;
  const shouldUseSsl = (process.env.DB_SSL || '').toLowerCase() === 'true' || (hasConnectionString && (process.env.DB_SSL || '').toLowerCase() !== 'false');

  if (hasConnectionString) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
    });
  }

  return new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vitallog',
    password: process.env.DB_PASSWORD || 'password',
    port: Number(process.env.DB_PORT || 5432),
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
  });
};

const pool = createPool();

// 测试数据库连接
pool.on('connect', () => {
  console.log('✅ 数据库连接成功');
});

pool.on('error', (err) => {
  console.error('❌ 数据库连接错误:', err);
});

// 数据库查询函数
const db = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};

// 初始化数据库表与扩展
const initDatabase = async () => {
  try {
    // 确保 uuid 相关函数存在（gen_random_uuid 需要 pgcrypto）
    await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    // 创建用户表
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 创建健康记录表
    await db.query(`
      CREATE TABLE IF NOT EXISTS health_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        systolic INTEGER NOT NULL CHECK (systolic >= 70 AND systolic <= 300),
        diastolic INTEGER NOT NULL CHECK (diastolic >= 40 AND diastolic <= 200),
        heart_rate INTEGER NOT NULL CHECK (heart_rate >= 30 AND heart_rate <= 250),
        notes TEXT,
        timestamp TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 创建刷新令牌表
    await db.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 应用配置表（存储站点 URL、端口、AI 密钥等）
    await db.query(`
      CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // 创建索引
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON health_records(user_id);
      CREATE INDEX IF NOT EXISTS idx_health_records_timestamp ON health_records(timestamp);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
    `);

    console.log('✅ 数据库表初始化完成');
  } catch (error) {
    console.error('❌ 数据库表初始化失败:', error);
    throw error;
  }
};

module.exports = {
  db,
  initDatabase
}; 