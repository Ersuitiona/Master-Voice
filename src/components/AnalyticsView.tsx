import React from 'react';
import { UserProfile, CallSession } from '../types';
import { BarChart3, Clock, AlertTriangle, PhoneCall } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface Props {
  user: UserProfile;
  recentSessions?: CallSession[];
}

export const AnalyticsView: React.FC<Props> = ({ user, recentSessions = [] }) => {
  // Build truthful WPM trend data from actual sessions
  const chronologicalSessions = [...recentSessions].reverse();
  const wpmTrendData = chronologicalSessions.map((session, idx) => ({
    call: `Call ${idx + 1}`,
    wpm: session.evaluation?.wpm || 0,
    fillers: session.evaluation?.fillerWordsTotal || 0,
    score: session.evaluation?.overallScore || 0,
  }));

  // Aggregate truthful filler word frequency from actual analyzed sessions
  const fillerCounts: Record<string, number> = {
    'Umm / Uh': 0,
    'Like': 0,
    'You know': 0,
    'Basically': 0,
    'So / Well': 0,
  };

  recentSessions.forEach((s) => {
    const breakdown = s.evaluation?.fillerWordsBreakdown || {};
    Object.entries(breakdown).forEach(([word, count]) => {
      const lower = word.toLowerCase();
      const num = Number(count) || 0;
      if (lower.includes('um') || lower.includes('uh')) {
        fillerCounts['Umm / Uh'] += num;
      } else if (lower.includes('like')) {
        fillerCounts['Like'] += num;
      } else if (lower.includes('know')) {
        fillerCounts['You know'] += num;
      } else if (lower.includes('basically')) {
        fillerCounts['Basically'] += num;
      } else {
        fillerCounts['So / Well'] += num;
      }
    });
  });

  const fillerColors = ['#f43f5e', '#fb7185', '#f59e0b', '#eab308', '#10b981'];
  const fillerData = Object.entries(fillerCounts)
    .filter(([_, count]) => count > 0)
    .map(([word, count], i) => ({
      word,
      count,
      fill: fillerColors[i % fillerColors.length],
    }));

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Voice & Speech Analytics Dashboard</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            Speech Analytics & Audio Intelligence
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Monitor speaking speed (WPM), filler word elimination progress, pause durations, and soft skill improvements across verified call center sessions.
          </p>
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Speaking Speed WPM Trend */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Speaking Speed Progression (WPM)
            </h3>
            <p className="text-xs text-slate-400">Target range: 120 - 150 Words Per Minute</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {wpmTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wpmTrendData}>
                  <XAxis dataKey="call" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[60, 200]} stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="wpm"
                    name="Words Per Min"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-6 bg-slate-950/60 rounded-2xl border border-slate-800/80 max-w-sm space-y-2">
                <PhoneCall className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-xs text-slate-300 font-medium">
                  No WPM trend data recorded yet.
                </p>
                <p className="text-[11px] text-slate-500">
                  Complete your first mock call simulation to track your real speaking pace!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Filler Word Breakdown Bar Chart */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Filler Word Frequency Breakdown
            </h3>
            <p className="text-xs text-slate-400">Total detected across recent call simulations</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {fillerData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fillerData}>
                  <XAxis dataKey="word" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                    }}
                  />
                  <Bar dataKey="count" name="Times Detected" radius={[8, 8, 0, 0]}>
                    {fillerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-6 bg-slate-950/60 rounded-2xl border border-slate-800/80 max-w-sm space-y-2">
                <AlertTriangle className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs text-slate-300 font-medium">
                  No filler words detected yet.
                </p>
                <p className="text-[11px] text-slate-500">
                  {recentSessions.length === 0
                    ? 'Start a call session to detect and track filler words.'
                    : 'Great job! Zero filler words detected across your recent call sessions.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
