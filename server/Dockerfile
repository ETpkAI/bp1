FROM node:18-alpine

WORKDIR /app

# 仅安装生产依赖
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund

# 拷贝源码
COPY src/ ./src/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "src/index.js"]


