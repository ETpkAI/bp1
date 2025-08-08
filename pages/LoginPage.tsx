
import React, { useState } from 'react';
import { Translations } from '../types.ts';
import { HeartIcon, UserIcon, LockIcon } from '../components/Icons.tsx';
import { useToast } from '../components/ToastManager.tsx';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onRegister: (username: string, password: string) => Promise<{success: boolean, message: string}>;
  t: Translations;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister, t }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      showToast('请输入用户名和密码', 'error');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isRegister) {
        const result = await onRegister(username, password);
        if (result.success) {
          setSuccessMessage(t.registrationSuccess as string);
          showToast(t.registrationSuccess as string, 'success');
          setIsRegister(false); // Switch to login form
          setUsername('');
          setPassword('');
        } else {
          setError(t.userExists as string);
          showToast(t.userExists as string, 'error');
        }
      } else {
        const success = await onLogin(username, password);
        if (!success) {
          setError(t.invalidCredentials as string);
          showToast(t.invalidCredentials as string, 'error');
        } else {
          showToast('登录成功！', 'success');
        }
        // On success, App component will switch the view
      }
    } catch (error) {
      const errorMsg = '操作失败，请重试';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm";
  const iconClass = "h-5 w-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <HeartIcon className="mx-auto h-12 w-auto text-red-500" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
            {isRegister ? t.registerTitle as string : t.loginTitle as string}
          </h2>
        </div>
        <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg" onSubmit={handleSubmit}>
          <p className="text-sm text-text-secondary text-center">
            {isRegister ? (t.registrationHint as string) : (t.loginHint as string)}
          </p>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="relative">
              <UserIcon className={iconClass} />
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className={inputClass}
                placeholder={t.username as string}
              />
            </div>
            <div className="relative pt-4">
               <LockIcon className={iconClass} />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputClass}
                placeholder={t.password as string}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          {successMessage && <p className="text-sm text-green-600 text-center">{successMessage}</p>}
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (isRegister ? t.registering as string : t.loggingIn as string) : (isRegister ? t.register as string : t.login as string)}
            </button>
          </div>
        </form>
         <div className="text-sm text-center">
            <span className="text-text-secondary">
                {isRegister ? t.loginPrompt as string : t.registerPrompt as string}{' '}
            </span>
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                setSuccessMessage('');
                setUsername('');
                setPassword('');
              }}
              className="font-medium text-brand-primary hover:text-brand-accent"
            >
              {isRegister ? t.login as string : t.register as string}
            </button>
          </div>
      </div>
    </div>
  );
};

export default LoginPage;