// API 响应基础类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 用户相关类型
export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRegistration {
  username: string;
  password: string;
  email?: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// 健康记录相关类型
export interface HealthRecord {
  id: string;
  userId: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  notes?: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHealthRecord {
  systolic: number;
  diastolic: number;
  heartRate: number;
  notes?: string;
  timestamp?: string;
}

export interface UpdateHealthRecord {
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  notes?: string;
  timestamp?: string;
}

// API 端点类型
export interface ApiEndpoints {
  // 认证
  auth: {
    register: string;
    login: string;
    logout: string;
    refresh: string;
  };
  // 健康记录
  records: {
    list: string;
    create: string;
    update: (id: string) => string;
    delete: (id: string) => string;
    export: string;
  };
  // 用户
  users: {
    profile: string;
    update: string;
  };
}

// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 错误类型
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// 文件上传响应
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
} 