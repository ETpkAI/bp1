import { useState, useEffect, useCallback } from 'react';
import { HealthRecord } from '../types.ts';
import { RECORDS_STORAGE_KEY_PREFIX } from '../constants.tsx';

export const useHealthData = (currentUser: string | null) => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to get user-specific storage key
  const getRecordsKey = useCallback((user: string) => `${RECORDS_STORAGE_KEY_PREFIX}-${user}`, []);

  // Load records when user logs in
  useEffect(() => {
    if (!currentUser) {
      setRecords([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const storedRecords = localStorage.getItem(getRecordsKey(currentUser));
      if (storedRecords) {
        const parsedRecords = JSON.parse(storedRecords);
        // Validate that parsed data is an array
        if (Array.isArray(parsedRecords)) {
          setRecords(parsedRecords);
        } else {
          console.warn('Invalid records format in localStorage');
          setRecords([]);
        }
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error("Failed to load records from localStorage", error);
      setError('加载记录失败');
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, getRecordsKey]);

  // Save records whenever they change
  useEffect(() => {
    if (!currentUser || !records) return;

    try {
      localStorage.setItem(getRecordsKey(currentUser), JSON.stringify(records));
    } catch (error) {
      console.error("Failed to save records to localStorage", error);
      setError('保存记录失败');
    }
  }, [records, currentUser, getRecordsKey]);

  const addRecord = useCallback((record: Omit<HealthRecord, 'id' | 'timestamp'>) => {
    const newRecord: HealthRecord = {
      ...record,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    
    setRecords(prevRecords => 
      [...prevRecords, newRecord].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    );
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setRecords(prevRecords => prevRecords.filter(r => r.id !== id));
  }, []);

  const clearAllRecords = useCallback(() => {
    setRecords([]);
  }, []);

  const importRecords = useCallback((newRecords: HealthRecord[]) => {
    const existingTimestamps = new Set(records.map(r => r.timestamp));
    const uniqueNewRecords = newRecords.filter(r => !existingTimestamps.has(r.timestamp));
    
    setRecords(prev => 
      [...prev, ...uniqueNewRecords].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    );
    
    return {
      importedCount: uniqueNewRecords.length,
      duplicateCount: newRecords.length - uniqueNewRecords.length,
    };
  }, [records]);

  const updateRecord = useCallback((id: string, updates: Partial<Omit<HealthRecord, 'id' | 'timestamp'>>) => {
    setRecords(prevRecords => 
      prevRecords.map(record => 
        record.id === id 
          ? { ...record, ...updates }
          : record
      )
    );
  }, []);

  return {
    records,
    isLoading,
    error,
    addRecord,
    deleteRecord,
    clearAllRecords,
    importRecords,
    updateRecord,
    setError,
  };
}; 