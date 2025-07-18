
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HealthRecord, Translations } from './types.ts';
import { USERS_STORAGE_KEY, RECORDS_STORAGE_KEY_PREFIX, translations } from './constants.tsx';
import HomePage from './pages/HomePage.tsx';
import HistoryPage from './pages/HistoryPage.tsx';
import Header from './components/Header.tsx';
import LoginPage from './pages/LoginPage.tsx';

// Securely hash a password using SHA-256
async function digestPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

const App: React.FC = () => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [language, setLanguage] = useState<'en' | 'zh'>('en');
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Helper to get user-specific storage key
  const getRecordsKey = (user: string) => `${RECORDS_STORAGE_KEY_PREFIX}-${user}`;

  // Check for session and browser language on initial load
  useEffect(() => {
    const loggedInUser = sessionStorage.getItem('currentUser');
    if (loggedInUser) {
      setCurrentUser(loggedInUser);
    }

    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'zh') {
      setLanguage('zh');
    }
  }, []);
  
  // Load records when user logs in
  useEffect(() => {
    if (!currentUser) {
      setRecords([]);
      return;
    }
    try {
      const storedRecords = localStorage.getItem(getRecordsKey(currentUser));
      if (storedRecords) {
        setRecords(JSON.parse(storedRecords));
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error("Failed to load records from localStorage", error);
      setRecords([]);
    }
  }, [currentUser]);

  // Save records whenever they change
  useEffect(() => {
    if (!currentUser || !records) return;
    try {
      localStorage.setItem(getRecordsKey(currentUser), JSON.stringify(records));
    } catch (error) {
      console.error("Failed to save records to localStorage", error);
    }
  }, [records, currentUser]);

  const handleRegister = async (username: string, password: string): Promise<{success: boolean, message: string}> => {
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '{}');
    if (users[username]) {
      return { success: false, message: 'User already exists.' };
    }
    const hashedPassword = await digestPassword(password);
    users[username] = hashedPassword;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return { success: true, message: 'Registration successful.' };
  };

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '{}');
    const hashedPassword = await digestPassword(password);
    if (users[username] && users[username] === hashedPassword) {
      setCurrentUser(username);
      sessionStorage.setItem('currentUser', username);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
  };

  const addRecord = (record: Omit<HealthRecord, 'id' | 'timestamp'>) => {
    const newRecord: HealthRecord = {
      ...record,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setRecords(prevRecords => [...prevRecords, newRecord].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const deleteRecord = (id: string) => {
    setRecords(prevRecords => prevRecords.filter(r => r.id !== id));
  };
  
  const clearAllRecords = () => {
    setRecords([]);
  }

  const importRecords = (newRecords: HealthRecord[]) => {
      const existingTimestamps = new Set(records.map(r => r.timestamp));
      const uniqueNewRecords = newRecords.filter(r => !existingTimestamps.has(r.timestamp));
      
      setRecords(prev => [...prev, ...uniqueNewRecords].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      
      return {
          importedCount: uniqueNewRecords.length,
          duplicateCount: newRecords.length - uniqueNewRecords.length,
      };
  };

  const t = useMemo(() => translations[language] as Translations, [language]);
  
  if (!currentUser) {
      return <LoginPage onLogin={handleLogin} onRegister={handleRegister} t={t} />;
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50 text-text-primary font-sans">
        <Header t={t} currentUser={currentUser} onLogout={handleLogout} />
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Routes>
            <Route
              path="/"
              element={<HomePage records={records} addRecord={addRecord} importRecords={importRecords} deleteRecord={deleteRecord} t={t} language={language} />}
            />
            <Route
              path="/history"
              element={<HistoryPage records={records} deleteRecord={deleteRecord} clearAllRecords={clearAllRecords} t={t} language={language} />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
