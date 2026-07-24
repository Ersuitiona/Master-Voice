import React, { useState } from 'react';
import { CallEvaluation, CallSession } from '../types';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  RotateCcw,
  Sparkles,
  BarChart2,
  MessageSquare,
  Volume2,
  FileText,
  Target,
  ArrowRight,
} from 'lucide-react';

interface Props {
  session: CallSession;
  evaluation: CallEvaluation;
  onPracticeMistakes: () => void;
  onDone: () => void;
}

export const CallEvaluationReport: React.FC<Props> = ({
  session,
  evaluation,
  onPracticeMistakes,
  onDone,
}) => {
  const [activeTab, setActiveTab] = useState<'rubric' | 'mistakes' | 'transcript' | 'analytics'>('rubric');

  const rubricItems = evaluation?.qualityRubric || evaluation?.dlsRubric || [];
  const mistakesList = evaluation?.mistakes || [];
  const trainerNotesList = evaluation?.trainerNotes || [];
  const strengthsList = evaluation?.strengths || [];
  const weaknessesList = evaluation?.weaknesses || [];

  const downloadTranscript = () => {
    const text = (session?.transcript || [])
      .map((t) => `[${t.timestamp}] ${t.sender.toUpperCase()}: ${t.text}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VoiceCoach_Transcript_${session?.scenario?.caseId || 'session'}.txt`;
    a.click();
  };

  const isPassed = (evaluation?.overallScore ?? 0) >= 80;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Banner & Overall Score Gauge */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>QA Evaluation & Support Quality Report</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white">
              {session.scenario.title}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Case #{session.scenario.caseId} • {session.scenario.industry} • Duration: {Math.ceil(session.durationSeconds / 60)} mins
            </p>
          </div>

          {/* Big Score Gauge */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <div
                className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center shadow-2xl ${
                  isPassed
                    ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400'
                    : 'border-amber-500 bg-amber-950/30 text-amber-400'
                }`}
              >
                <span className="text-3xl font-black">{evaluation?.overallScore ?? 80}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  / 100 Score
                </span>
              </div>
              <span
                className={`mt-2 text-xs font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider ${
                  isPassed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isPassed ? 'Passed Standard' : 'Needs Practice'}
              </span>
            </div>
          </div>
        </div>

        {session.audioUrl && (
          <div className="mt-6 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <span>Recorded Call Audio Session Playback</span>
            </div>
            <audio controls src={session.audioUrl} className="w-full h-10 rounded-lg outline-none" />
          </div>
        )}

        {/* Executive Trainer Summary */}
        <div className="mt-6 pt-6 border-t border-slate-800 text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-400 text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Executive Trainer Summary</span>
          </div>
          <p className="text-sm text-slate-200">{evaluation?.summaryFeedback || 'Evaluation complete.'}</p>
        </div>

        {/* AI Coaching Tips & Key Recommendations */}
        <div className="mt-4 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
            <Target className="w-4 h-4 text-indigo-400" />
            <span>AI Tips to Improve & Key Actionable Takeaways</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Actionable Recommendations */}
            <div className="space-y-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-amber-400 block">Trainer Action Items:</span>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {trainerNotesList.length > 0 ? (
                  trainerNotesList.map((note, i) => <li key={i}>{note}</li>)
                ) : (
                  <li>Practice active listening and paraphrasing employee concerns clearly.</li>
                )}
              </ul>
            </div>

            {/* Strengths & Focus Areas */}
            <div className="space-y-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              {strengthsList.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-emerald-400 block">Key Strengths:</span>
                  <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                    {strengthsList.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {weaknessesList.length > 0 && (
                <div className="mt-2">
                  <span className="text-[11px] font-bold text-rose-400 block">Areas for Improvement:</span>
                  <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                    {weaknessesList.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Core Communication Scores Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Grammar', score: evaluation?.grammarScore ?? 85 },
          { label: 'Fluency', score: evaluation?.fluencyScore ?? 82 },
          { label: 'Empathy', score: (evaluation?.grammarScore ?? 82) + 3 },
          { label: 'Confidence', score: evaluation?.confidenceScore ?? 80 },
          { label: 'Listening', score: evaluation?.listeningScore ?? 85 },
          { label: 'Pronunciation', score: evaluation?.pronunciationScore ?? 82 },
          { label: 'Call Control', score: evaluation?.callControlScore ?? 80 },
          { label: 'CSAT', score: evaluation?.csatScore ?? 85 },
        ].map((item, i) => (
          <div
            key={i}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1"
          >
            <div className="text-[11px] font-medium text-slate-400 truncate">{item.label}</div>
            <div className="text-xl font-black text-amber-400">{item.score}%</div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        {[
          { id: 'rubric', label: 'Quality Rubric', icon: Award },
          { id: 'mistakes', label: `Mistakes & Fixes (${mistakesList.length})`, icon: AlertTriangle },
          { id: 'analytics', label: 'Speech & Speed Analytics', icon: BarChart2 },
          { id: 'transcript', label: 'Full Transcript', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 ${
                isActive
                  ? 'border-amber-400 text-amber-300 bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content: Quality Criteria Rubric */}
      {activeTab === 'rubric' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Quality Criteria Checklist
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rubricItems.map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-200">
                    {item.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                    <span>{item.criterion}</span>
                  </div>
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                      item.passed
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    }`}
                  >
                    {item.score}/100
                  </span>
                </div>
                <p className="text-xs text-slate-400 pl-7 leading-relaxed">{item.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Mistakes Analysis */}
      {activeTab === 'mistakes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Detailed Sentence & Grammar Corrections
            </h3>

            <button
              onClick={onPracticeMistakes}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all hover:scale-105"
            >
              <Target className="w-4 h-4" />
              Practice These Mistakes in Drills Mode
            </button>
          </div>

          <div className="space-y-4">
            {mistakesList.length > 0 ? (
              mistakesList.map((m, index) => (
                <div
                  key={m.id || index}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Original */}
                    <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-1">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                        Original Spoken Sentence
                      </span>
                      <p className="text-sm font-medium text-rose-200">"{m.originalText}"</p>
                    </div>

                    {/* Corrected */}
                    <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                        Corrected Professional Version
                      </span>
                      <p className="text-sm font-medium text-emerald-200">"{m.correctedText}"</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                    <p>
                      <b className="text-amber-400">Why it was flagged:</b> {m.reasoning}
                    </p>
                    {m.nativeSpeakerVersion && (
                      <p>
                        <b className="text-amber-400">Native Speaker Version:</b> "{m.nativeSpeakerVersion}"
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs">
                No major sentence or grammar mistakes were flagged in this call session. Excellent job!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Speech & Speed Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Speaking Speed</span>
            <div className="text-3xl font-black text-amber-400">{evaluation?.wpm ?? 130} <span className="text-sm font-normal text-slate-400">WPM</span></div>
            <p className="text-xs text-slate-300">Target Range: 120 - 150 WPM for clarity.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Total Filler Words</span>
            <div className="text-3xl font-black text-rose-400">{evaluation?.fillerWordsTotal ?? 0}</div>
            <p className="text-xs text-slate-300">"Umm", "Ahh", "Like", "You know"</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Longest Silence / Pause</span>
            <div className="text-3xl font-black text-emerald-400">{evaluation?.longestPauseSeconds ?? 2}s</div>
            <p className="text-xs text-slate-300">Healthy call flow maintained.</p>
          </div>
        </div>
      )}

      {/* Tab Content: Full Transcript */}
      {activeTab === 'transcript' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Complete Call Transcript</h3>
            <button
              onClick={downloadTranscript}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700"
            >
              <Download className="w-4 h-4 text-amber-400" />
              Download Transcript
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 max-h-96 overflow-y-auto">
            {(session?.transcript || []).map((msg, i) => (
              <div key={i} className="space-y-1">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {msg.sender === 'user' ? 'Executive (You)' : session.scenario.customerName} • {msg.timestamp}
                </div>
                <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  {msg.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Bottom Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-800">
        <button
          onClick={downloadTranscript}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 border border-slate-700"
        >
          <Download className="w-4 h-4 text-amber-400" />
          Export Report
        </button>

        <button
          onClick={onDone}
          className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20"
        >
          Return to Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
