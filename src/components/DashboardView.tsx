import React from 'react';
import { UserProfile, CallSession, Scenario } from '../types';
import {
  Clock,
  PhoneCall,
  Award,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Play,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  SlidersHorizontal,
  Download,
  Volume2,
  Target,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { getDailyMilestones } from '../utils/badgeEngine';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface Props {
  user: UserProfile;
  recentSessions: CallSession[];
  allScenarios: Scenario[];
  onStartCall: (scenario: Scenario) => void;
  onSelectSession: (session: CallSession) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<Props> = ({
  user,
  recentSessions,
  allScenarios,
  onStartCall,
  onSelectSession,
  onNavigateTab,
}) => {
  // Calculate real metrics from sessions
  const totalCallsDone = recentSessions.length;
  const totalPracticeMins = Math.round(
    recentSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / 60
  );
  
  const sessionsWithScores = recentSessions.filter((s) => s.evaluation?.overallScore);
  const realAvgScore = sessionsWithScores.length > 0
    ? Math.round(
        sessionsWithScores.reduce((acc, s) => acc + (s.evaluation?.overallScore || 0), 0) /
          sessionsWithScores.length
      )
    : user.avgScore || 0;

  // CSV Export Handler
  const handleExportCSV = () => {
    if (recentSessions.length === 0) return;

    const headers = [
      'Session ID',
      'Scenario Title',
      'Category',
      'Industry',
      'Duration (Seconds)',
      'Overall Score',
      'Grammar Score',
      'Fluency Score',
      'CSAT Score',
      'Audio Recorded',
      'Date',
    ];

    const rows = recentSessions.map((s) => [
      s.id,
      `"${s.scenario.title.replace(/"/g, '""')}"`,
      `"${s.scenario.category}"`,
      `"${s.scenario.industry}"`,
      s.durationSeconds,
      s.evaluation?.overallScore ?? 'N/A',
      s.evaluation?.grammarScore ?? 'N/A',
      s.evaluation?.fluencyScore ?? 'N/A',
      s.evaluation?.csatScore ?? 'N/A',
      s.audioUrl ? 'Yes' : 'No',
      new Date(s.startTime).toLocaleString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Call_Sessions_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Truthful 7-day trend calculations based strictly on completed sessions
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = d.toISOString().slice(0, 10);
    return { dayName, dateStr };
  });

  const trendData = last7Days.map(({ dayName, dateStr }) => {
    const daySessions = recentSessions.filter((s) => {
      if (!s.startTime) return false;
      const sessionDate = new Date(s.startTime).toISOString().slice(0, 10);
      return sessionDate === dateStr;
    });

    if (daySessions.length === 0) {
      return { day: dayName, score: 0, fluency: 0, wpm: 0 };
    }

    const avgScoreDay = Math.round(
      daySessions.reduce((acc, s) => acc + (s.evaluation?.overallScore || 0), 0) / daySessions.length
    );
    const avgFluencyDay = Math.round(
      daySessions.reduce((acc, s) => acc + (s.evaluation?.fluencyScore || 0), 0) / daySessions.length
    );
    const avgWpmDay = Math.round(
      daySessions.reduce((acc, s) => acc + (s.evaluation?.wpm || 0), 0) / daySessions.length
    );

    return {
      day: dayName,
      score: avgScoreDay,
      fluency: avgFluencyDay,
      wpm: avgWpmDay,
    };
  });

  // Dynamic soft skill radar derived from analyzed call sessions
  const hasAnalyzedCalls = sessionsWithScores.length > 0;
  const computedFluency = hasAnalyzedCalls
    ? Math.round(sessionsWithScores.reduce((acc, s) => acc + (s.evaluation?.fluencyScore || 0), 0) / sessionsWithScores.length)
    : 0;
  const computedGrammar = hasAnalyzedCalls
    ? Math.round(sessionsWithScores.reduce((acc, s) => acc + (s.evaluation?.grammarScore || 0), 0) / sessionsWithScores.length)
    : 0;
  const computedConfidence = hasAnalyzedCalls
    ? Math.round(sessionsWithScores.reduce((acc, s) => acc + (s.evaluation?.confidenceScore || 0), 0) / sessionsWithScores.length)
    : 0;
  const computedListening = hasAnalyzedCalls
    ? Math.round(sessionsWithScores.reduce((acc, s) => acc + (s.evaluation?.listeningScore || 0), 0) / sessionsWithScores.length)
    : 0;
  const computedPronunciation = hasAnalyzedCalls
    ? Math.round(sessionsWithScores.reduce((acc, s) => acc + (s.evaluation?.pronunciationScore || 0), 0) / sessionsWithScores.length)
    : 0;
  const computedCallControl = hasAnalyzedCalls
    ? Math.round(sessionsWithScores.reduce((acc, s) => acc + (s.evaluation?.callControlScore || 0), 0) / sessionsWithScores.length)
    : 0;

  const radarData = [
    { skill: 'Fluency', score: computedFluency },
    { skill: 'Pronunciation', score: computedPronunciation },
    { skill: 'Confidence', score: computedConfidence },
    { skill: 'Grammar', score: computedGrammar },
    { skill: 'Listening', score: computedListening },
    { skill: 'Call Control', score: computedCallControl },
  ];

  const featuredSupportScenarios = allScenarios.slice(0, 3);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-r dark:from-[#16161D] dark:via-[#1A1A24] dark:to-[#12121A] p-6 md:p-8 border border-slate-200/80 dark:border-indigo-500/20 shadow-lg dark:shadow-2xl transition-all">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Employee Support Communication Simulator</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back, <span className="text-indigo-600 dark:text-indigo-400">{user.name}</span>! 👋
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Master spoken English, active listening, paraphrasing, empathy statements, and identity verification with AI-driven outbound & inbound support call simulations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('practice')}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-indigo-600/30 hover:scale-105 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              Support Trainer Mode
            </button>
            <button
              onClick={() => onNavigateTab('practice')}
              className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white font-semibold text-sm border border-slate-200 dark:border-white/10 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Custom Call Simulator
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid - Real Metrics Only */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#16161D] dark:to-[#0E0E12] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="uppercase text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400">Practice Time</span>
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalPracticeMins} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">mins</span></div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
            Recorded in session history
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#16161D] dark:to-[#0E0E12] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="uppercase text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400">Completed Calls</span>
            <PhoneCall className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalCallsDone}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Verified mock calls</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#16161D] dark:to-[#0E0E12] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="uppercase text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400">Average Score</span>
            <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{realAvgScore}/100</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Based on QA evaluations
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#16161D] dark:to-[#0E0E12] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="uppercase text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400">Fluency</span>
            <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{user.scores.fluency}%</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Speech flow rating</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#16161D] dark:to-[#0E0E12] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="uppercase text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400">Target Pace</span>
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{user.wpm} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">WPM</span></div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Ideal Range (120-150 WPM)</div>
        </div>
      </div>

      {/* Analytics Charts & Skill Radar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Improvement Trend */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#16161D] dark:to-[#0E0E12] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                7-Day Fluency & Score Progress
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Weekly evaluation trend across customer service calls</p>
            </div>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              Full Analytics <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fluencyColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  name="Overall Score"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#scoreColor)"
                />
                <Area
                  type="monotone"
                  dataKey="fluency"
                  name="Fluency %"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#fluencyColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Soft Skills Radar Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#16161D] dark:to-[#0E0E12] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Call Center Skill Breakdown</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {hasAnalyzedCalls
                ? 'Derived from analyzed call evaluations'
                : 'Requires completed & analyzed call sessions'}
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {hasAnalyzedCalls ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis dataKey="skill" stroke="#475569" fontSize={10} />
                  <PolarRadiusAxis domain={[0, 100]} stroke="#94a3b8" fontSize={9} />
                  <Radar name="User Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center space-y-3 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 max-w-sm">
                <Award className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto" />
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Skill breakdown generates automatically after analyzing your call sessions.
                </p>
                <button
                  onClick={() => onNavigateTab('practice')}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
                >
                  Start First Call Session
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weak & Strong Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#16161D] dark:to-[#0E0E12] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm font-bold">
            <AlertTriangle className="w-4 h-4" />
            Target Focus Areas (Weaknesses Detected)
          </div>
          <div className="flex flex-wrap gap-2">
            {user.weakAreas && user.weakAreas.length > 0 ? (
              user.weakAreas.map((area, i) => (
                <div
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center justify-between gap-2 w-full sm:w-auto"
                >
                  <span>{area}</span>
                  <button
                    onClick={() => onNavigateTab('drills')}
                    className="text-[10px] bg-rose-600 hover:bg-rose-500 text-white font-bold px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    Practice
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                No weak areas detected yet. Complete call simulations to receive AI diagnostic feedback.
              </p>
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#16161D] dark:to-[#0E0E12] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
            <CheckCircle2 className="w-4 h-4" />
            Mastered Soft Skills
          </div>
          <div className="flex flex-wrap gap-2">
            {user.strongAreas && user.strongAreas.length > 0 ? (
              user.strongAreas.map((area, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium"
                >
                  ✨ {area}
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                No mastered soft skills recorded yet. Complete call sessions to analyze strengths.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Badges & Daily Milestones Hub Card */}
      {(() => {
        const milestones = getDailyMilestones(recentSessions, user);
        const completedCount = milestones.filter((m) => m.completed).length;
        const unlockedBadgesCount = (user.badges || []).filter((b) => b.unlockedAt || (b.progress || 0) >= 100).length;

        return (
          <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-[#16161D] dark:via-[#1A1A24] dark:to-[#12121A] border border-amber-300 dark:border-amber-500/30 shadow-md dark:shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                  <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Daily Milestones & Verified Badges</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  Daily Voice Training Progress
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {completedCount} of {milestones.length} daily milestones completed today • {unlockedBadgesCount} badges earned
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('badges')}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <span>View Badges & Daily Milestones</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Badges Preview Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
              {(user.badges || []).slice(0, 6).map((b) => (
                <div
                  key={b.id}
                  onClick={() => onNavigateTab('badges')}
                  className={`p-3 rounded-xl border text-center space-y-1 cursor-pointer transition-all hover:scale-105 ${
                    b.unlockedAt
                      ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-slate-900 dark:text-white'
                      : 'bg-slate-100 dark:bg-black/40 border-slate-200 dark:border-white/5 opacity-60'
                  }`}
                >
                  <div className="text-2xl">{b.icon}</div>
                  <div className="text-[11px] font-bold truncate text-slate-800 dark:text-slate-200">{b.title}</div>
                  <div className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
                    {b.unlockedAt ? 'Unlocked' : `${b.progress || 0}%`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Featured Employee Support Scenarios Hub */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Employee Support & HR Scenarios
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Practice maternity leave, medical accommodation, attendance correction, and workplace policy inquiries
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('practice')}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            View All Scenarios →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredSupportScenarios.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#16161D] dark:to-[#0E0E12] border border-slate-200/80 dark:border-white/10 hover:border-indigo-400 transition-all flex flex-col justify-between group shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 text-[10px] font-bold uppercase">
                    {s.category}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{s.difficulty}</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                  {s.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {s.description}
                </p>
                <div className="pt-2 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <p><span className="text-slate-500">Caller:</span> {s.customerName} ({s.personality})</p>
                  <p><span className="text-slate-500">Accent:</span> {s.accent}</p>
                </div>
              </div>

              <button
                onClick={() => onStartCall(s)}
                className="mt-5 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Start Mock Call
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Call Sessions History & Export */}
      {recentSessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Recent Mock Call Recordings & Reports</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Review evaluation scores or download call records</p>
            </div>
            <button
              onClick={handleExportCSV}
              className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Export CSV File
            </button>
          </div>

          <div className="space-y-3">
            {recentSessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className="p-4 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#16161D] dark:to-[#0E0E12] border border-slate-200/80 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/30 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{session.scenario.title}</span>
                    {session.isTrainerMode && (
                      <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-[10px] font-bold">
                        Trainer Mode
                      </span>
                    )}
                    {session.audioUrl && (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                        <Volume2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Audio Recorded
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                    <span>{session.scenario.industry}</span>
                    <span>•</span>
                    <span>{Math.ceil(session.durationSeconds / 60)} mins</span>
                    <span>•</span>
                    <span>{new Date(session.startTime).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {session.evaluation && (
                    <div className="text-right">
                      <div className="text-base font-black text-indigo-600 dark:text-indigo-400">
                        {session.evaluation.overallScore}/100
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Grammar: {session.evaluation.grammarScore}%
                      </div>
                    </div>
                  )}
                  <button className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-white/10">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Review Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
