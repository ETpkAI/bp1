# VitalLog (Blood Pressure & Heart Rate Tracker)

VitalLog 是一个简洁易用的血压与心率追踪应用，支持云端账号登录、健康数据记录、导出、AI 智能分析，并提供一键化的 VPS 部署方案。

## 功能特性
- 账号体系：注册 / 登录 / 刷新 Token（JWT）
- 健康记录：新增、分页列表、删除、导出（CSV/JSON）
- OCR 自动录入：拍照或上传血压计读数图片，自动识别并填入 SYS/DIA/PUL（基于 tesseract.js）
- AI 智能分析：调用 Gemini 生成中文分析摘要（通过后端安全代理调用，前端不暴露密钥）
- 用户资料：查看 / 更新邮箱
- 首次运行配置：在未登录时提供配置页面（域名、端口、CORS 等非敏感项），提示将敏感项在服务器 .env 设置
- 生产部署：基于 Docker Compose（db/server/web），Nginx 同源反代 `/api`

## 架构与技术栈
- 前端：React + Vite，Nginx 托管静态资源并反向代理 API
- 后端：Node.js + Express + PostgreSQL
- 鉴权：JWT（访问令牌 + 刷新令牌持久化）
- 部署：Dockerfile（多阶段构建）+ docker-compose + Nginx

## 快速开始（本地）
前置条件：Node.js 18+，Docker 可选

1) 安装依赖
```bash
npm install
```

2) 本地开发（仅前端）
```bash
npm run dev
# 前端默认端口 5173
```
如需本地完整后端与数据库，请使用 docker-compose（见“生产部署”）。

## 生产部署（VPS，一键安装）
推荐使用提供的一键安装脚本在干净的 VPS 上部署：

```bash
# 在 VPS 上执行
cd /root
[ -d bp ] || git clone https://github.com/ETpkAI/bp1.git bp
cd bp
# 可选：预设环境变量
export BP_DOMAIN=bp.llmkc.com
export BP_PORT=18080
export GOOGLE_API_KEY=你的Gemini密钥
bash scripts/install_vps.sh
```
脚本将执行：
- 安装 Docker
- 克隆/更新仓库至 `/root/bp`
- 生成 `.env`（若不存在）：`JWT_SECRET`、`JWT_REFRESH_SECRET`、`CORS_ORIGIN`、`GOOGLE_API_KEY`
- 生成 `docker-compose.override.yml` 将 web 映射到 `${BP_PORT}:80`（默认 18080）
- 构建并启动 `db/server/web`
- 安装并配置宿主 Nginx，将 80 端口反代到容器 `${BP_PORT}`
- 健康检查：`http://127.0.0.1:${BP_PORT}/health`

部署完成后访问：
- `http://bp.llmkc.com/`（需要 DNS 指向服务器）
- 若 DNS 未就绪：`http://<你的服务器IP>:${BP_PORT}/`

## 环境变量说明（.env）
- `JWT_SECRET` / `JWT_REFRESH_SECRET`：JWT 秘钥（强随机）
- `CORS_ORIGIN`：生产环境允许的 Origin（逗号分隔）
- `GOOGLE_API_KEY`：AI 分析使用的 Gemini API Key（仅后端使用；前端不暴露）
- 数据库：默认使用 `docker-compose.yml` 中 Postgres，若使用外部数据库，可设置 `DATABASE_URL` 和 `DB_SSL`

## API 要点
- 健康检查：`GET /health`
- 认证：`POST /api/v1/auth/register|login|logout|refresh`
- 记录：`GET/POST/DELETE /api/v1/records`，`GET /api/v1/records/export`
- 用户：`GET/PUT /api/v1/users/profile`
- AI 分析（中文 JSON）：`POST /api/v1/ai/analyze`
- 首次配置：`GET/POST /api/v1/config`（非敏感）；`POST /api/v1/config/secret`（仅占位，建议在 .env 设置密钥）

## 数据持久化
- Postgres 数据通过命名卷 `bp_db_data` 持久化；重启/重建容器不会影响数据。
- 切勿执行 `docker compose down -v` 或删除卷，除非你确认要清空数据。

## 常见问题
- 访问空白：检查 80/18080 端口是否被占用；确认宿主 Nginx 是否反代到正确端口；查看容器日志。
- AI 分析失败：确认服务器 `.env` 中已设置 `GOOGLE_API_KEY`，并 `docker compose up -d --build`。
- OCR 识别不准：确保图片清晰、正对血压计读数，必要时手动校正后保存。

## 版本
- 1.0.0：生产部署改造、后端 AI 安全代理、刷新令牌持久化、一键安装脚本
- 1.1.0：新增 OCR 自动录入、首次运行配置页、README 重写
