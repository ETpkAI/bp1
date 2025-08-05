import { useState, useEffect, useCallback } from 'react';
import { HealthRecord, CreateHealthRecord, UpdateHealthRecord, PaginationParams } from '../types/api.ts';
import ApiClient from '../services/api.ts';
import { useToast } from '../components/ToastManager.tsx';

export const useCloudHealthData = () => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const { showToast } = useToast();

  // 加载记录
  const loadRecords = useCallback(async (params?: PaginationParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ApiClient.getRecords({
        page: params?.page || 1,
        limit: params?.limit || 20,
        sortBy: 'timestamp',
        sortOrder: 'desc',
        ...params,
      });

      if (response.success && response.data) {
        setRecords(response.data.data);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.message || '加载记录失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载记录失败';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // 添加记录
  const addRecord = useCallback(async (record: Omit<CreateHealthRecord, 'timestamp'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ApiClient.createRecord({
        ...record,
        timestamp: new Date().toISOString(),
      });

      if (response.success && response.data) {
        setRecords(prev => [response.data!, ...prev]);
        showToast('记录添加成功！', 'success');
        return response.data;
      } else {
        throw new Error(response.message || '添加记录失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '添加记录失败';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // 更新记录
  const updateRecord = useCallback(async (id: string, updates: UpdateHealthRecord) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ApiClient.updateRecord(id, updates);

      if (response.success && response.data) {
        setRecords(prev => 
          prev.map(record => 
            record.id === id ? response.data! : record
          )
        );
        showToast('记录更新成功！', 'success');
        return response.data;
      } else {
        throw new Error(response.message || '更新记录失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新记录失败';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // 删除记录
  const deleteRecord = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ApiClient.deleteRecord(id);

      if (response.success) {
        setRecords(prev => prev.filter(record => record.id !== id));
        showToast('记录删除成功！', 'success');
      } else {
        throw new Error(response.message || '删除记录失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除记录失败';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // 清除所有记录
  const clearAllRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 批量删除所有记录
      const deletePromises = records.map(record => ApiClient.deleteRecord(record.id));
      await Promise.all(deletePromises);

      setRecords([]);
      setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }));
      showToast('所有记录已清除！', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '清除记录失败';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [records, showToast]);

  // 导入记录
  const importRecords = useCallback(async (newRecords: Omit<HealthRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const importPromises = newRecords.map(record => 
        ApiClient.createRecord({
          systolic: record.systolic,
          diastolic: record.diastolic,
          heartRate: record.heartRate,
          notes: record.notes,
          timestamp: record.timestamp,
        })
      );

      const results = await Promise.allSettled(importPromises);
      
      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');

      if (successful.length > 0) {
        // 重新加载记录以获取最新数据
        await loadRecords();
        showToast(`成功导入 ${successful.length} 条记录`, 'success');
      }

      if (failed.length > 0) {
        showToast(`${failed.length} 条记录导入失败`, 'warning');
      }

      return {
        importedCount: successful.length,
        failedCount: failed.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导入记录失败';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadRecords, showToast]);

  // 导出记录
  const exportRecords = useCallback(async (format: 'csv' | 'json' = 'csv') => {
    try {
      const blob = await ApiClient.exportRecords(format);
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vital-log-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('数据导出成功！', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导出失败';
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [showToast]);

  // 初始加载
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return {
    records,
    isLoading,
    error,
    pagination,
    loadRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    clearAllRecords,
    importRecords,
    exportRecords,
    setError,
  };
}; 