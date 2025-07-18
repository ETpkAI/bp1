
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Translations } from '../types.ts';
import { HeartIcon, LogoutIcon } from './Icons.tsx';

interface HeaderProps {
  t: Translations;
  currentUser: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ t, currentUser, onLogout }) => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-brand-primary text-white' : 'text-text-secondary hover:bg-gray-200 hover:text-text-primary'
    }`;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <HeartIcon className="h-8 w-8 text-red-500" />
            <h1 className="text-xl font-bold text-text-primary ml-2">{t.title as string}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hidden sm:block text-sm text-text-secondary">
                {(t.welcomeUser as (name: string) => string)(currentUser)}
            </span>
            <nav className="flex items-center space-x-4">
              <NavLink to="/" className={navLinkClass}>
                {t.dashboard as string}
              </NavLink>
              <NavLink to="/history" className={navLinkClass}>
                {t.history as string}
              </NavLink>
            </nav>
            <button onClick={onLogout} title={t.logout as string} className="p-2 rounded-full text-text-secondary hover:bg-gray-200 hover:text-text-primary transition-colors">
              <LogoutIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;