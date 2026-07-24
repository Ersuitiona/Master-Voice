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
    <header className="sticky top-0 z-40 bg-[#0A0A0C]/90 backdrop-blur-md border-b border-white/10 text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Minimalist Logo */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              ES
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-sm text-white tracking-tight">
                Employee Support
              </span>
              <span className="text-[10px] text-indigo-400 font-medium">
                AI Voice Trainer
              </span>
            </div>
          </div>

          {/* Minimal Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
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
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Auth Profile Trigger */}
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 p-1 pr-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-6 h-6 rounded-md object-cover border border-indigo-500/30"
              />
              <span className="hidden sm:inline font-medium text-slate-200 truncate max-w-[90px]">
                {user.name.split(' ')[0]}
              </span>
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            </button>

            {/* Sign Out Button */}
            <button
              onClick={onSignOut}
              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/20 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden lg:inline text-[11px]">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Minimal Nav Sub-Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-white/10">
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
                    : 'text-slate-400 hover:text-slate-200'
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

