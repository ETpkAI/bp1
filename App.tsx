
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Translations } from './types.ts';
import { translations } from './constants.tsx';
import HomePage from './pages/HomePage.tsx';
import HistoryPage from './pages/HistoryPage.tsx';
import Header from './components/Header.tsx';
import LoginPage from './pages/LoginPage.tsx';
import { ToastManager } from './components/ToastManager.tsx';
import { useCloudHealthData } from './hooks/useCloudHealthData.ts';
import { useAuth } from './hooks/useAuth.ts';

const App: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'zh'>('en');

  // Use cloud-based authentication and health data management
  const {
    user,
    isLoading: authLoading,
    isAuthenticated,
    register,
    login,
    logout,
  } = useAuth();

  const {
    records,
    isLoading: recordsLoading,
    error: recordsError,
    addRecord,
    deleteRecord,
    clearAllRecords,
    importRecords,
    updateRecord,
    exportRecords,
    setError: setRecordsError,
  } = useCloudHealthData();

  // Check browser language on initial load
  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'zh') {
      setLanguage('zh');
    }
  }, []);

  const handleRegister = async (username: string, password: string): Promise<{success: boolean, message: string}> => {
    try {
      await register({ username, password });
      return { success: true, message: 'Registration successful.' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Registration failed.' };
    }
  };

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      await login({ username, password });
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleLogout = () => {
    logout();
  };



  const t = useMemo(() => translations[language] as Translations, [language]);
  
  // 显示加载状态
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <ToastManager>
        <LoginPage onLogin={handleLogin} onRegister={handleRegister} t={t} />
      </ToastManager>
    );
  }

  return (
    <ToastManager>
      <HashRouter>
        <div className="min-h-screen bg-gray-50 text-text-primary font-sans">
          <Header t={t} currentUser={user.username} onLogout={handleLogout} />
          <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <Routes>
              <Route
                path="/"
                element={
                  <HomePage 
                    records={records} 
                    addRecord={addRecord} 
                    importRecords={importRecords} 
                    deleteRecord={deleteRecord}
                    exportRecords={exportRecords}
                    t={t} 
                    language={language} 
                  />
                }
              />
              <Route
                path="/history"
                element={
                  <HistoryPage 
                    records={records} 
                    deleteRecord={deleteRecord} 
                    clearAllRecords={clearAllRecords} 
                    t={t} 
                    language={language} 
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </ToastManager>
  );
};

export default App;
