import React from 'react';
import { UserProfile, CallSession } from '../types';
import { Award, ShieldCheck, PhoneCall, Clock, CheckCircle2, Target, Flame, Zap } from 'lucide-react';
import { getDailyMilestones } from '../utils/badgeEngine';

interface Props {
  user: UserProfile;
  recentSessions?: CallSession[];
}

export const LeaderboardView: React.FC<Props> = ({ user, recentSessions = [] }) => {
  const totalCalls = recentSessions.length;
  const totalMins = Math.round(recentSessions.reduce((a, b) => a + (b.durationSeconds || 0), 0) / 60);
  const avgScore = recentSessions.length > 0
    ? Math.round(recentSessions.reduce((a, b) => a + (b.evaluation?.overallScore || 0), 0) / recentSessions.length)
    : user.avgScore || 0;

  // Real daily milestones from badge engine
  const dailyMilestones = getDailyMilestones(recentSessions, user);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#16161D] via-[#1A1A24] to-[#12121A] border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Personal Skill Milestones & Verified Badges</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            Performance Milestones & Badges
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Track your verified call completion stats, support policy compliance, and skill badges earned directly from your completed mock sessions.
          </p>
        </div>
      </div>

      {/* User Session Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#16161D] to-[#0E0E12] border border-white/10 space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-indigo-400" /> Total Verified Calls
          </div>
          <div className="text-3xl font-black text-white">{totalCalls}</div>
          <p className="text-[10px] text-slate-400">Completed in simulator</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#16161D] to-[#0E0E12] border border-white/10 space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" /> Practice Time
          </div>
          <div className="text-3xl font-black text-white">{totalMins} <span className="text-sm font-normal text-slate-400">mins</span></div>
          <p className="text-[10px] text-slate-400">Total speaking duration</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#16161D] to-[#0E0E12] border border-white/10 space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" /> QA Rubric Score
          </div>
          <div className="text-3xl font-black text-indigo-400">{avgScore}/100</div>
          <p className="text-[10px] text-slate-400">Average evaluation score</p>
        </div>
      </div>

      {/* Real Daily Milestones Tracker */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            Daily Practice Milestones
          </h2>
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Resets Daily
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dailyMilestones.map((m) => {
            const percentage = Math.min(100, Math.round((m.current / m.target) * 100));
            return (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-gradient-to-b from-[#16161D] to-[#0E0E12] border border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{m.title}</span>
                  <span className="text-xs font-bold text-amber-300">+{m.rewardPoints} XP</span>
                </div>
                <p className="text-xs text-slate-400">{m.description}</p>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-400">
                    <span>Progress: {m.current} / {m.target} {m.unit}</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${m.completed ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {m.completed && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Daily Milestone Achieved
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Unlocked Badges Gallery */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Skill Badges & Achievements Gallery
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(user.badges || []).map((b) => {
            const isUnlocked = Boolean(b.unlockedAt || (b.progress || 0) >= 100);
            return (
              <div
                key={b.id}
                className={`p-4 rounded-2xl border text-center space-y-2 transition-all ${
                  isUnlocked
                    ? 'bg-gradient-to-b from-[#16161D] to-[#0E0E12] border-amber-500/40 shadow-md'
                    : 'bg-black/30 border-white/5 opacity-50'
                }`}
              >
                <div className="text-3xl">{b.icon}</div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-white text-xs">{b.title}</h4>
                  <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">{b.description}</p>
                </div>
                <div>
                  {isUnlocked ? (
                    <span className="inline-block text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Unlocked {b.unlockedAt ? `(${b.unlockedAt})` : ''}
                    </span>
                  ) : (
                    <span className="inline-block text-[9px] text-slate-400 font-medium bg-black/50 px-2 py-0.5 rounded-full border border-white/5">
                      {b.progress || 0}% Complete
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

