import { ApiEndpoints } from '../types/api.ts';

// API 基础配置
export const API_CONFIG = {
  // 生产使用同源（由 Nginx 反代 /api 到后端），避免跨域与证书问题
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? '' 
    : 'http://localhost:3001',
  
  // API 版本
  VERSION: 'v1',
  
  // 超时时间 (毫秒)
  TIMEOUT: 10000,
  
  // 重试次数
  RETRY_ATTEMPTS: 3,
  
  // 重试延迟 (毫秒)
  RETRY_DELAY: 1000,
};

// API 端点配置
export const API_ENDPOINTS: ApiEndpoints = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
  },
  records: {
    list: '/records',
    create: '/records',
    update: (id: string) => `/records/${id}`,
    delete: (id: string) => `/records/${id}`,
    export: '/records/export',
  },
  users: {
    profile: '/users/profile',
    update: '/users/profile',
  },
};

// 获取完整的 API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}/api/${API_CONFIG.VERSION}${endpoint}`;
};

// 默认请求头
export const getDefaultHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // 添加认证 token
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// 错误码映射
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
} as const;

// 错误消息映射
export const ERROR_MESSAGES = {
  [ERROR_CODES.UNAUTHORIZED]: '请先登录',
  [ERROR_CODES.FORBIDDEN]: '没有权限访问',
  [ERROR_CODES.NOT_FOUND]: '资源不存在',
  [ERROR_CODES.VALIDATION_ERROR]: '数据验证失败',
  [ERROR_CODES.INTERNAL_ERROR]: '服务器内部错误',
  [ERROR_CODES.NETWORK_ERROR]: '网络连接错误',
  [ERROR_CODES.TIMEOUT_ERROR]: '请求超时',
} as const; 