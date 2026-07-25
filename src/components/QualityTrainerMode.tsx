import React, { useState } from 'react';
import { Scenario } from '../types';
import { ShieldAlert, Play, BookOpen, CheckCircle, FileCheck, UserCheck } from 'lucide-react';

interface Props {
  scenarios: Scenario[];
  onStartCall: (scenario: Scenario, isTrainerMode: boolean) => void;
}

export const QualityTrainerMode: React.FC<Props> = ({ scenarios, onStartCall }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(scenarios.map((s) => s.category)))];

  const filteredScenarios =
    selectedCategory === 'All'
      ? scenarios
      : scenarios.filter((s) => s.category === selectedCategory);

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="rounded-2xl bg-white dark:bg-gradient-to-r dark:from-[#16161D] dark:via-[#1A1A24] dark:to-[#12121A] border border-slate-200/80 dark:border-indigo-500/20 p-6 md:p-8 shadow-lg dark:shadow-2xl relative overflow-hidden transition-all">
        <div className="space-y-3 relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-500/20 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Employee Support Communication Trainer</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Employee Support & HR Call Center Trainer Mode
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Simulate realistic outbound & inbound employee support calls. Evaluates your communication against comprehensive QA rubrics: Identity Verification, Purpose Statement, Active Listening, Paraphrasing, Empathy, Workplace Policy Explanation, and Professional Closing.
          </p>
        </div>
      </div>

      {/* Policy Quick Reference Cheat-Sheet */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#16161D] dark:to-[#0E0E12] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Employee Support Policy Quick Reference & Best Practices
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200/80 dark:border-white/5 space-y-1.5">
            <div className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <FileCheck className="w-4 h-4" />
              Medical Leave & Documentation
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Medical certificates and doctor statements require verification within standard timeframe. Pay processing commences upon HR approval.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200/80 dark:border-white/5 space-y-1.5">
            <div className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <UserCheck className="w-4 h-4" />
              Mandatory Identity Rule
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Must verify Employee ID + Date of Birth before disclosing confidential support updates or leave extension status on both inbound and outbound calls.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200/80 dark:border-white/5 space-y-1.5">
            <div className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <CheckCircle className="w-4 h-4" />
              Workplace Accommodations
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Light duty restrictions (lifting limits, modified hours) require site management review before employee returns to active shift.
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/10 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredScenarios.map((s) => (
          <div
            key={s.id}
            className="p-6 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#16161D] dark:to-[#0E0E12] border border-slate-200/80 dark:border-white/10 hover:border-indigo-400 transition-all flex flex-col justify-between space-y-4 shadow-xs"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 text-xs font-bold uppercase">
                  {s.category}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold">
                  Difficulty: {s.difficulty}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{s.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{s.description}</p>

              <div className="bg-slate-50 dark:bg-black/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-white/5 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Caller / Employee:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{s.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Persona & Tone:</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{s.personality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Request ID:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{s.caseId}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => onStartCall(s, true)}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-105 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                Launch Trainer Mode Call
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
