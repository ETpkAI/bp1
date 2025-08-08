# ----------
# Frontend build stage
# ----------
FROM node:18-alpine AS build
WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# 拷贝源代码并构建
COPY . .
RUN npm run build

# ----------
# Nginx runtime stage
# ----------
FROM nginx:alpine

# Remove the default Nginx welcome page configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx configuration file to the container
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 拷贝构建产物
COPY --from=build /app/dist/ /usr/share/nginx/html

# Expose port 80 to the outside world (Nginx default port)
EXPOSE 80

# The command to run when the container starts, keeping Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]