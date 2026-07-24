import React, { useState } from 'react';
import { UserProfile, CallSession, Badge, DailyMilestone } from '../types';
import {
  Award,
  Flame,
  CheckCircle2,
  Clock,
  Target,
  Search,
  Filter,
  Sparkles,
  Lock,
  ChevronRight,
  X,
  PhoneCall,
  Zap,
  ShieldCheck,
  Star,
  Info,
  RotateCcw,
} from 'lucide-react';
import { getDailyMilestones, getTodayDateKey } from '../utils/badgeEngine';

interface Props {
  user: UserProfile;
  recentSessions: CallSession[];
  onNavigateTab: (tab: string) => void;
  onResetProfile?: () => void;
}

export const BadgesAndMilestonesView: React.FC<Props> = ({
  user,
  recentSessions,
  onNavigateTab,
  onResetProfile,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalBadge, setActiveModalBadge] = useState<Badge | null>(null);

  const [resetMilestoneIds, setResetMilestoneIds] = useState<Set<string>>(new Set());

  // Daily Milestones computed for today
  const rawDailyMilestones = getDailyMilestones(recentSessions, user);
  const dailyMilestones = rawDailyMilestones.map((m) => {
    if (resetMilestoneIds.has(m.id)) {
      return { ...m, current: 0, completed: false };
    }
    return m;
  });

  const handleResetSingleMilestone = (id: string) => {
    setResetMilestoneIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleResetAllMilestones = () => {
    setResetMilestoneIds(new Set(rawDailyMilestones.map((m) => m.id)));
  };
  const completedMilestonesCount = dailyMilestones.filter((m) => m.completed).length;
  const totalDailyXP = dailyMilestones
    .filter((m) => m.completed)
    .reduce((acc, m) => acc + m.rewardPoints, 0);

  // Badge statistics
  const userBadges = user.badges || [];
  const unlockedBadges = userBadges.filter((b) => b.unlockedAt || (b.progress || 0) >= 100);
  const inProgressBadges = userBadges.filter((b) => !b.unlockedAt && (b.progress || 0) < 100);

  // Filtered badges list
  const filteredBadges = userBadges.filter((badge) => {
    // Category Filter
    if (selectedCategory === 'Unlocked' && !badge.unlockedAt) return false;
    if (selectedCategory === 'In Progress' && badge.unlockedAt) return false;
    if (
      selectedCategory !== 'All' &&
      selectedCategory !== 'Unlocked' &&
      selectedCategory !== 'In Progress' &&
      badge.category !== selectedCategory
    ) {
      return false;
    }

    // Tier Filter
    if (selectedTier !== 'All' && badge.tier !== selectedTier) {
      return false;
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = badge.title.toLowerCase().includes(q);
      const matchDesc = badge.description.toLowerCase().includes(q);
      const matchCategory = badge.category?.toLowerCase().includes(q) ?? false;
      if (!matchTitle && !matchDesc && !matchCategory) return false;
    }

    return true;
  });

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'Platinum':
        return 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30';
      case 'Gold':
        return 'text-amber-300 bg-amber-500/10 border-amber-500/30';
      case 'Silver':
        return 'text-slate-200 bg-slate-500/10 border-slate-400/30';
      case 'Bronze':
      default:
        return 'text-orange-300 bg-orange-500/10 border-orange-500/30';
    }
  };

  const getTierBadgeStyle = (tier?: string) => {
    switch (tier) {
      case 'Platinum':
        return 'from-cyan-900/40 to-cyan-950/80 border-cyan-500/40 shadow-cyan-500/10';
      case 'Gold':
        return 'from-amber-900/40 to-amber-950/80 border-amber-500/40 shadow-amber-500/10';
      case 'Silver':
        return 'from-slate-800/60 to-slate-900/90 border-slate-400/30 shadow-slate-400/10';
      case 'Bronze':
      default:
        return 'from-orange-950/40 to-slate-900/90 border-orange-500/30 shadow-orange-500/10';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Banner Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[#16161D] via-[#1A1A24] to-[#12121A] border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Voice Training Milestones & Verified Badges</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Updated Daily • {todayFormatted}</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              Badges, Achievements & Daily Milestones
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed mt-1">
              Earn verified skill badges, complete daily training challenges, and track your voice support mastery progression in real time.
            </p>
          </div>

          {/* Quick Stat Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-0.5">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3 h-3 text-amber-400" /> Badges Unlocked
              </div>
              <div className="text-xl font-black text-white">
                {unlockedBadges.length}{' '}
                <span className="text-xs text-slate-500 font-normal">/ {userBadges.length}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-0.5">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-orange-400" /> Practice Streak
              </div>
              <div className="text-xl font-black text-orange-400">
                {user.streakDays || 1} <span className="text-xs font-normal text-slate-400">Days</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-0.5">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3 h-3 text-indigo-400" /> Daily Milestones
              </div>
              <div className="text-xl font-black text-indigo-400">
                {completedMilestonesCount}{' '}
                <span className="text-xs font-normal text-slate-400">/ {dailyMilestones.length}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-0.5">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-emerald-400" /> Daily Earned XP
              </div>
              <div className="text-xl font-black text-emerald-400">
                +{totalDailyXP} <span className="text-xs font-normal text-slate-400">XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Updating Milestones Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-400" />
                Today's Daily Milestones
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold">
                Auto-Resets Daily
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Complete these daily challenges in mock calls to boost your daily XP and unlock badges!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {onResetProfile && (
              <button
                onClick={() => {
                  handleResetAllMilestones();
                  onResetProfile();
                }}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
                title="Reset profile stats, call history and badges to start completely fresh"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>Reset Profile & Fresh UI</span>
              </button>
            )}

            <button
              onClick={handleResetAllMilestones}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
              title="Reset progress on all daily missions and start fresh"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset All Missions</span>
            </button>

            <button
              onClick={() => onNavigateTab('practice')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Complete Daily Calls
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dailyMilestones.map((m) => {
            const pct = Math.min(100, Math.round((m.current / m.target) * 100));
            return (
              <div
                key={m.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  m.completed
                    ? 'bg-gradient-to-b from-[#16161D] to-[#0E0E12] border-emerald-500/40 shadow-emerald-500/5'
                    : 'bg-gradient-to-b from-[#16161D] to-[#0E0E12] border-white/10'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 text-[10px] font-bold uppercase">
                      {m.category}
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      +{m.rewardPoints} XP
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm">{m.title}</h3>
                  <p className="text-xs text-slate-400 leading-snug">{m.description}</p>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 text-[11px]">
                      Progress: <strong className="text-slate-200">{m.current}</strong> / {m.target} {m.unit}
                    </span>
                    <span className="font-bold text-indigo-400 text-[11px]">{pct}%</span>
                  </div>

                  <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        m.completed ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="pt-1 flex items-center justify-between text-xs">
                    {m.completed ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Completed
                      </span>
                    ) : (
                      <span
                        className="text-indigo-400 hover:underline cursor-pointer text-[11px] font-medium"
                        onClick={() => onNavigateTab('practice')}
                      >
                        Start →
                      </span>
                    )}

                    <button
                      onClick={() => handleResetSingleMilestone(m.id)}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-amber-300 text-[10px] font-bold flex items-center gap-1 border border-white/10 transition-all hover:scale-105"
                      title="Reset progress on this mission to do it again"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      <span>Reset Mission</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges & Achievements Section */}
      <div className="space-y-6 pt-4 border-t border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Verified Skill Badges & Trophies
            </h2>
            <p className="text-xs text-slate-400">
              Complete specific soft-skill, compliance, and volume metrics to unlock permanent badges
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search badges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#16161D] p-3 rounded-2xl border border-white/10 text-xs">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {['All', 'Unlocked', 'In Progress', 'Streak', 'Soft Skills', 'Quality', 'Volume', 'Compliance'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tier Select */}
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Tier:</span>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-slate-200 text-xs font-semibold focus:outline-none"
            >
              <option value="All">All Tiers</option>
              <option value="Bronze">Bronze Tier</option>
              <option value="Silver">Silver Tier</option>
              <option value="Gold">Gold Tier</option>
              <option value="Platinum">Platinum Tier</option>
            </select>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBadges.map((badge) => {
            const isUnlocked = Boolean(badge.unlockedAt || (badge.progress || 0) >= 100);
            const progress = badge.progress || 0;
            const tierStyle = getTierBadgeStyle(badge.tier);
            const tierColor = getTierColor(badge.tier);

            return (
              <div
                key={badge.id}
                onClick={() => setActiveModalBadge(badge)}
                className={`p-5 rounded-2xl border bg-gradient-to-b cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between space-y-4 group relative overflow-hidden ${
                  isUnlocked
                    ? `${tierStyle} border-amber-500/30`
                    : 'from-[#121217] to-[#0A0A0E] border-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                {/* Badge Top Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${tierColor}`}>
                      {badge.tier || 'Bronze'} Tier
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {badge.category}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                      isUnlocked
                        ? 'bg-amber-500/10 border-amber-500/30 shadow-md shadow-amber-500/10'
                        : 'bg-black/50 border-white/10 text-slate-600 grayscale'
                    }`}>
                      {badge.icon}
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                        {badge.title}
                        {isUnlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-tight line-clamp-2">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress & Unlock Footer */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-medium">
                      {isUnlocked
                        ? `Unlocked on ${badge.unlockedAt || 'Recently'}`
                        : `${badge.currentCount ?? 0} / ${badge.maxProgress ?? 1} Target`}
                    </span>
                    <span className={`font-bold ${isUnlocked ? 'text-emerald-400' : 'text-indigo-400'}`}>
                      {progress}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnlocked ? 'bg-emerald-400' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                    <span className="text-indigo-400 font-semibold group-hover:underline flex items-center gap-1">
                      <Info className="w-3 h-3" /> View Criteria
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredBadges.length === 0 && (
          <div className="p-8 text-center bg-[#16161D] rounded-2xl border border-white/10 space-y-2">
            <Award className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm text-slate-300 font-bold">No badges match your selected filter.</p>
            <p className="text-xs text-slate-500">Try changing your search keywords or tier selections.</p>
          </div>
        )}
      </div>

      {/* Badge Details Modal */}
      {activeModalBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#16161D] border border-white/15 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-5 relative overflow-hidden">
            <button
              onClick={() => setActiveModalBadge(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Icon */}
            <div className="text-center space-y-3 pt-2">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-b from-amber-500/20 to-amber-950/40 border border-amber-500/40 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/10">
                {activeModalBadge.icon}
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
                  {activeModalBadge.tier || 'Bronze'} Tier • {activeModalBadge.category}
                </div>
                <h3 className="text-xl font-black text-white">{activeModalBadge.title}</h3>
                <p className="text-xs text-slate-300 mt-1">{activeModalBadge.description}</p>
              </div>
            </div>

            {/* How to Earn Box */}
            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2 text-xs">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400" /> Requirements to Unlock
              </div>
              <p className="text-slate-300 leading-relaxed">
                {activeModalBadge.howToEarn || activeModalBadge.description}
              </p>
            </div>

            {/* Progress Status */}
            <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Current Progress:</span>
                <span className="font-bold text-white">
                  {activeModalBadge.currentCount ?? 0} / {activeModalBadge.maxProgress ?? 1}
                </span>
              </div>

              <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full ${
                    activeModalBadge.unlockedAt ? 'bg-emerald-400' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${activeModalBadge.progress || 0}%` }}
                />
              </div>

              <div className="text-center pt-1">
                {activeModalBadge.unlockedAt ? (
                  <span className="text-emerald-400 font-bold text-xs flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlocked on {activeModalBadge.unlockedAt}
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs">
                    {(100 - (activeModalBadge.progress || 0))}% remaining to unlock this trophy
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setActiveModalBadge(null);
                  onNavigateTab('practice');
                }}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
              >
                <PhoneCall className="w-4 h-4" /> Start Practice Call Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
