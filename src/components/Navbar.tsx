import React from 'react';
import { UserProfile } from '../types';
import {
  PhoneCall,
  LayoutDashboard,
  Target,
  BarChart3,
  Award,
  Flame,
  UserCheck,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserProfile;
  onOpenAuth: () => void;
  onSignOut: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onSignOut,
  isDarkMode,
  onToggleTheme,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'practice', label: 'Practice Calls', icon: PhoneCall, highlight: true },
    { id: 'drills', label: 'Coach & Drills', icon: Target },
    { id: 'badges', label: 'Badges & Milestones', icon: Award },
    { id: 'analytics', label: 'Performance & Rank', icon: BarChart3 },
  ];

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md transition-colors ${
      isDarkMode
        ? 'bg-[#0A0A0C]/90 border-b border-white/10 text-slate-200'
        : 'bg-white/95 border-b border-slate-200/80 text-slate-800 shadow-xs'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Master Voice Branding & Logo */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 via-indigo-500 to-amber-500 rounded-xl flex items-center justify-center font-extrabold text-white text-xs shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform border border-indigo-400/30">
              <PhoneCall className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className={`font-extrabold text-base tracking-tight flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Master Voice
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                AI Communication Simulator
              </span>
            </div>
          </div>

          {/* Minimal Desktop Nav */}
          <nav className={`hidden md:flex items-center gap-1.5 p-1 rounded-xl border ${
            isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100/90 border-slate-200'
          }`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile & Minimal Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                isDarkMode
                  ? 'bg-white/5 hover:bg-white/10 text-amber-300 border-white/10'
                  : 'bg-amber-50 hover:bg-amber-100/80 text-amber-800 border-amber-200'
              }`}
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              <span className="hidden xl:inline">{isDarkMode ? 'Bright Theme' : 'Dark Theme'}</span>
            </button>

            {/* Auth Profile Trigger */}
            <button
              onClick={onOpenAuth}
              className={`flex items-center gap-2 p-1 pr-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isDarkMode
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200/70 border-slate-200 text-slate-800'
              }`}
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-6 h-6 rounded-md object-cover border border-indigo-500/30"
              />
              <span className={`hidden sm:inline font-medium truncate max-w-[90px] ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {user.name.split(' ')[0]}
              </span>
              <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
            </button>

            {/* Sign Out Button */}
            <button
              onClick={onSignOut}
              className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                isDarkMode
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/20'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
              }`}
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden lg:inline text-[11px]">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Minimal Nav Sub-Bar */}
        <div className={`md:hidden flex items-center justify-around py-2 border-t ${
          isDarkMode ? 'border-white/10' : 'border-slate-200'
        }`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

