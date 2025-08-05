import { 
  ApiResponse, 
  AuthResponse, 
  UserRegistration, 
  UserLogin, 
  HealthRecord, 
  CreateHealthRecord, 
  UpdateHealthRecord,
  PaginationParams,
  PaginatedResponse
} from '../types/api.ts';

// API 基础配置
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.vitallog.com' 
  : 'http://localhost:3001';

// 获取默认请求头
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// 处理 API 响应
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
};

// API 客户端
export class ApiClient {
  // 认证相关
  static async register(userData: UserRegistration): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });

    const result = await handleResponse<ApiResponse<AuthResponse>>(response);
    
    if (result.success && result.data) {
      localStorage.setItem('auth_token', result.data.token);
      if (result.data.refreshToken) {
        localStorage.setItem('refresh_token', result.data.refreshToken);
      }
    }

    return result;
  }

  static async login(credentials: UserLogin): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials),
    });

    const result = await handleResponse<ApiResponse<AuthResponse>>(response);
    
    if (result.success && result.data) {
      localStorage.setItem('auth_token', result.data.token);
      if (result.data.refreshToken) {
        localStorage.setItem('refresh_token', result.data.refreshToken);
      }
    }

    return result;
  }

  static async logout(): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
    });

    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');

    return handleResponse<ApiResponse<void>>(response);
  }

  static async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('刷新令牌不存在');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ refreshToken }),
    });

    const result = await handleResponse<ApiResponse<AuthResponse>>(response);
    
    if (result.success && result.data) {
      localStorage.setItem('auth_token', result.data.token);
      if (result.data.refreshToken) {
        localStorage.setItem('refresh_token', result.data.refreshToken);
      }
    }

    return result;
  }

  // 健康记录相关
  static async getRecords(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<HealthRecord>>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    }

    const url = `${API_BASE_URL}/api/v1/records${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    return handleResponse<ApiResponse<PaginatedResponse<HealthRecord>>>(response);
  }

  static async createRecord(record: CreateHealthRecord): Promise<ApiResponse<HealthRecord>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/records`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(record),
    });

    return handleResponse<ApiResponse<HealthRecord>>(response);
  }

  static async updateRecord(id: string, updates: UpdateHealthRecord): Promise<ApiResponse<HealthRecord>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/records/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });

    return handleResponse<ApiResponse<HealthRecord>>(response);
  }

  static async deleteRecord(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/records/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    return handleResponse<ApiResponse<void>>(response);
  }

  static async exportRecords(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/v1/records/export?format=${format}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('导出失败');
    }

    return response.blob();
  }
}

export default ApiClient; 