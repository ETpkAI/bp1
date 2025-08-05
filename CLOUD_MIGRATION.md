# VitalLog 云端存储迁移指南

## 概述

本文档详细说明了如何将 VitalLog 从本地存储迁移到云端存储，包括后端 API 服务器、数据库设计和部署配置。

## 🏗️ 架构设计

### 前端架构
```
VitalLog Frontend (React + TypeScript)
├── API Client (services/api.ts)
├── Authentication Hook (hooks/useAuth.ts)
├── Cloud Data Hook (hooks/useCloudHealthData.ts)
└── UI Components
```

### 后端架构
```
VitalLog API Server (Node.js + Express)
├── Authentication Routes (/auth)
├── Health Records Routes (/records)
├── User Management Routes (/users)
├── Database (PostgreSQL)
└── Security Middleware
```

## 📁 新增文件结构

### 前端文件
```
src/
├── types/
│   └── api.ts                    # API 类型定义
├── config/
│   └── api.ts                    # API 配置
├── services/
│   └── api.ts                    # API 客户端
├── hooks/
│   ├── useAuth.ts                # 认证管理 Hook
│   └── useCloudHealthData.ts     # 云端数据管理 Hook
└── components/                   # 现有组件保持不变
```

### 后端文件
```
server/
├── package.json                  # 依赖配置
├── src/
│   ├── index.js                  # 服务器入口
│   ├── config/
│   │   └── database.js           # 数据库配置
│   ├── middleware/
│   │   ├── auth.js               # 认证中间件
│   │   └── errorHandler.js       # 错误处理
│   └── routes/
│       ├── auth.js               # 认证路由
│       ├── records.js            # 健康记录路由
│       └── users.js              # 用户路由
└── env.example                   # 环境变量示例
```

## 🗄️ 数据库设计

### 用户表 (users)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 健康记录表 (health_records)
```sql
CREATE TABLE health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  systolic INTEGER NOT NULL CHECK (systolic >= 70 AND systolic <= 300),
  diastolic INTEGER NOT NULL CHECK (diastolic >= 40 AND diastolic <= 200),
  heart_rate INTEGER NOT NULL CHECK (heart_rate >= 30 AND heart_rate <= 250),
  notes TEXT,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 刷新令牌表 (refresh_tokens)
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 安全特性

### 认证与授权
- **JWT Token**: 24小时有效期
- **Refresh Token**: 7天有效期
- **密码加密**: bcrypt 哈希
- **Token 验证**: 中间件自动验证

### 数据安全
- **输入验证**: express-validator
- **SQL 注入防护**: 参数化查询
- **CORS 配置**: 跨域请求控制
- **速率限制**: 防止暴力攻击

### API 安全
- **Helmet**: 安全头设置
- **速率限制**: 15分钟内最多100个请求
- **错误处理**: 不暴露敏感信息

## 🚀 部署步骤

### 1. 环境准备

#### 前端环境变量
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:3001
VITE_GEMINI_API_KEY=your_gemini_api_key
```

#### 后端环境变量
```bash
# .env
PORT=3001
NODE_ENV=production
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=vitallog
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### 2. 数据库设置

#### 安装 PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
```

#### 创建数据库
```sql
CREATE DATABASE vitallog;
CREATE USER vitallog_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE vitallog TO vitallog_user;
```

### 3. 后端部署

#### 安装依赖
```bash
cd server
npm install
```

#### 初始化数据库
```bash
# 数据库表会自动创建
npm run dev
```

#### 生产部署
```bash
npm run build
npm start
```

### 4. 前端部署

#### 构建生产版本
```bash
npm run build
```

#### 部署到静态服务器
```bash
# 使用 nginx 或其他静态文件服务器
cp -r dist/* /var/www/html/
```

## 🔄 数据迁移

### 从本地存储迁移到云端

#### 1. 导出本地数据
```javascript
// 在浏览器控制台执行
const localRecords = JSON.parse(localStorage.getItem('vital-log-records-currentUser') || '[]');
const localUsers = JSON.parse(localStorage.getItem('vital-log-users') || '{}');

console.log('Records:', localRecords);
console.log('Users:', localUsers);
```

#### 2. 导入到云端
```javascript
// 使用 API 导入数据
const importData = async (records) => {
  for (const record of records) {
    await fetch('/api/v1/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        systolic: record.systolic,
        diastolic: record.diastolic,
        heartRate: record.heartRate,
        notes: record.notes,
        timestamp: record.timestamp
      })
    });
  }
};
```

## 📊 API 端点

### 认证端点
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/logout` - 用户登出

### 健康记录端点
- `GET /api/v1/records` - 获取记录列表
- `POST /api/v1/records` - 创建新记录
- `PUT /api/v1/records/:id` - 更新记录
- `DELETE /api/v1/records/:id` - 删除记录
- `GET /api/v1/records/export` - 导出记录

### 用户端点
- `GET /api/v1/users/profile` - 获取用户资料
- `PUT /api/v1/users/profile` - 更新用户资料

## 🔧 开发指南

### 本地开发

#### 启动后端服务器
```bash
cd server
npm install
cp env.example .env
# 编辑 .env 文件配置数据库
npm run dev
```

#### 启动前端开发服务器
```bash
npm install
npm run dev
```

### 测试 API

#### 使用 curl 测试
```bash
# 注册用户
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# 登录
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# 创建记录
curl -X POST http://localhost:3001/api/v1/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"systolic":120,"diastolic":80,"heartRate":72}'
```

## 🚨 注意事项

### 安全警告
1. **生产环境**: 必须使用 HTTPS
2. **数据库**: 定期备份数据
3. **密钥管理**: 使用环境变量存储敏感信息
4. **监控**: 设置日志监控和错误报警

### 性能优化
1. **数据库索引**: 已自动创建必要的索引
2. **连接池**: 使用 PostgreSQL 连接池
3. **缓存**: 考虑添加 Redis 缓存
4. **CDN**: 静态资源使用 CDN

### 扩展性
1. **负载均衡**: 使用 nginx 或云负载均衡器
2. **数据库分片**: 考虑数据分片策略
3. **微服务**: 可拆分为多个微服务
4. **容器化**: 使用 Docker 部署

## 🎉 迁移完成

完成以上步骤后，VitalLog 将成功从本地存储迁移到云端存储，具备以下优势：

- ✅ **数据安全**: 云端存储，自动备份
- ✅ **多设备同步**: 随时随地访问数据
- ✅ **用户管理**: 真正的多用户系统
- ✅ **数据共享**: 可与医生或家人共享
- ✅ **扩展性**: 支持大量用户和数据
- ✅ **安全性**: 企业级安全保护

## 📞 技术支持

如果在迁移过程中遇到问题，请检查：

1. **网络连接**: 确保前后端可以正常通信
2. **数据库连接**: 检查数据库配置和权限
3. **环境变量**: 确认所有必要的环境变量已设置
4. **日志文件**: 查看服务器日志获取错误信息 