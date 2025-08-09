const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const recordsRoutes = require('./routes/records');
const usersRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');
const { initDatabase, db } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet());

// 识别反向代理的真实 IP（用于速率限制等中间件）
app.set('trust proxy', 1);

// CORS 配置（生产环境通过 CORS_ORIGIN 环境变量配置，逗号分隔；开发环境允许本地调试域名）
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : [])
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// 全局速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  }
});
app.use('/api/', limiter);

// AI 接口单独限流（更严格）
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'AI 请求过于频繁，请稍后再试' }
});

// 解析 JSON
app.use(express.json({ limit: '10mb' }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'VitalLog API Server is running',
    timestamp: new Date().toISOString()
  });
});

// API 路由
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/records', authenticateToken, recordsRoutes);
app.use('/api/v1/users', authenticateToken, usersRoutes);
app.use('/api/v1/ai', authenticateToken, aiLimiter, aiRoutes);

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API 端点不存在'
  });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器并初始化数据库
initDatabase()
  .catch((err) => {
    console.error('数据库初始化失败，程序退出', err);
    process.exit(1);
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`🚀 VitalLog API Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });

    // 定期清理过期刷新令牌（每小时）
    setInterval(async () => {
      try {
        await db.query('DELETE FROM refresh_tokens WHERE expires_at <= NOW()');
      } catch (e) {
        console.error('清理过期刷新令牌失败:', e);
      }
    }, 60 * 60 * 1000);
  });

module.exports = app; 