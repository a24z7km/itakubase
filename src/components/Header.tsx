import React from 'react';
import { ShieldCheck, User, Users, RefreshCw } from 'lucide-react';
import { Role } from '../types';

interface HeaderProps {
  activeRole: Role;
  onChangeRole: (role: Role) => void;
  onGoHome: () => void;
  resetDemoData: () => void;
}

export default function Header({ activeRole, onChangeRole, onGoHome, resetDemoData }: HeaderProps) {
  return (
    <header className="bg-[#1E293B] border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <button
            type="button"
            onClick={onGoHome}
            aria-label="ホームに戻る"
            className="flex items-center space-x-3 rounded-lg text-left transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <div className="p-2 bg-blue-600 text-white rounded flex items-center justify-center shadow-lg shadow-blue-500/10">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-sans font-bold text-xl tracking-tight text-white">
                ITAKU BASE
              </span>
              <span className="ml-2 text-xs bg-slate-800 text-blue-400 font-semibold px-2 py-0.5 rounded border border-slate-700">
                プロトタイプ
              </span>
            </div>
          </button>

          {/* Role Switcher */}
          <div className="flex items-center space-x-4">
            <div className="bg-slate-800 p-1 rounded-full flex space-x-1 border border-slate-700 shadow-inner">
              <button
                id="role-toggle-client"
                onClick={() => onChangeRole('client')}
                className={`flex items-center px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 ${
                  activeRole === 'client'
                    ? 'bg-white text-slate-900 shadow-md font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Users className="w-4 h-4 mr-1.5" />
                委託元（Z社）
              </button>
              <button
                id="role-toggle-vendor"
                onClick={() => onChangeRole('vendor')}
                className={`flex items-center px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 ${
                  activeRole === 'vendor'
                    ? 'bg-white text-slate-900 shadow-md font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <User className="w-4 h-4 mr-1.5" />
                委託先（A社）
              </button>
            </div>

            {/* Reset Tooltip Button */}
            <button
              onClick={resetDemoData}
              title="デモ状態をリセット"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700 bg-transparent flex items-center space-x-1 text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">リセット</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
