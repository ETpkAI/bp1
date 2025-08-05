import { useState, useEffect, useCallback } from 'react';
import { User, UserRegistration, UserLogin, AuthResponse } from '../types/api.ts';
import ApiClient from '../services/api.ts';
import { useToast } from '../components/ToastManager.tsx';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { showToast } = useToast();

  // 检查是否有有效的 token
  const checkAuthStatus = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        return true;
      } catch (error) {
        // 清除无效的用户数据
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    }
    
    setUser(null);
    setIsAuthenticated(false);
    return false;
  }, []);

  // 注册
  const register = useCallback(async (userData: UserRegistration) => {
    setIsLoading(true);

    try {
      const response = await ApiClient.register(userData);

      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        showToast('注册成功！', 'success');
        return response.data;
      } else {
        throw new Error(response.message || '注册失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '注册失败';
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // 登录
  const login = useCallback(async (credentials: UserLogin) => {
    setIsLoading(true);

    try {
      const response = await ApiClient.login(credentials);

      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        showToast('登录成功！', 'success');
        return response.data;
      } else {
        throw new Error(response.message || '登录失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // 登出
  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      await ApiClient.logout();
    } catch (error) {
      // 即使 API 调用失败，也要清除本地数据
      console.warn('登出 API 调用失败，但已清除本地数据:', error);
    } finally {
      // 清除本地存储
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      
      setUser(null);
      setIsAuthenticated(false);
      showToast('已登出', 'info');
      setIsLoading(false);
    }
  }, [showToast]);

  // 刷新 token
  const refreshToken = useCallback(async () => {
    try {
      const response = await ApiClient.refreshToken();
      
      if (response.success && response.data) {
        setUser(response.data.user);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        return response.data;
      } else {
        throw new Error(response.message || 'Token 刷新失败');
      }
    } catch (error) {
      // Token 刷新失败，清除认证状态
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  }, []);

  // 初始化时检查认证状态
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    user,
    isLoading,
    isAuthenticated,
    register,
    login,
    logout,
    refreshToken,
    checkAuthStatus,
  };
}; 