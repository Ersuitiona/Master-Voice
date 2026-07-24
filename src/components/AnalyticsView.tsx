import React from 'react';
import { UserProfile } from '../types';
import { BarChart3, TrendingUp, Clock, AlertTriangle, Zap, Sparkles } from 'lucide-react';
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
}

export const AnalyticsView: React.FC<Props> = ({ user }) => {
  const wpmTrendData = [
    { call: 'Call 1', wpm: 165, fillers: 8 },
    { call: 'Call 2', wpm: 155, fillers: 6 },
    { call: 'Call 3', wpm: 148, fillers: 5 },
    { call: 'Call 4', wpm: 142, fillers: 4 },
    { call: 'Call 5', wpm: 138, fillers: 3 },
    { call: 'Call 6', wpm: 135, fillers: 2 },
  ];

  const fillerData = [
    { word: 'Umm', count: 12, fill: '#f43f5e' },
    { word: 'Ahh', count: 8, fill: '#fb7185' },
    { word: 'Like', count: 6, fill: '#f59e0b' },
    { word: 'You know', count: 4, fill: '#eab308' },
    { word: 'Basically', count: 2, fill: '#10b981' },
  ];

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
            Monitor speaking speed (WPM), filler word elimination progress, pause durations, and soft skill improvements across call center sessions.
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

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={wpmTrendData}>
                <XAxis dataKey="call" stroke="#64748b" fontSize={11} />
                <YAxis domain={[100, 180]} stroke="#64748b" fontSize={11} />
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

          <div className="h-64 w-full">
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
          </div>
        </div>
      </div>
    </div>
  );
};
