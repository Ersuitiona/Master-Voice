import React, { useState } from 'react';
import { CallEvaluation, CallSession } from '../types';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Sparkles,
  BarChart2,
  MessageSquare,
  Volume2,
  FileText,
  Target,
  ArrowRight,
  Zap,
  Mic,
  Activity,
  Lightbulb,
  AlignLeft,
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
  const [activeTab, setActiveTab] = useState<'rubric' | 'sentence' | 'mistakes' | 'fillers' | 'tone' | 'transcript'>('rubric');

  const rubricItems = evaluation?.qualityRubric || evaluation?.dlsRubric || [];
  const mistakesList = evaluation?.mistakes || [];
  const trainerNotesList = evaluation?.trainerNotes || [];
  const strengthsList = evaluation?.strengths || [];
  const weaknessesList = evaluation?.weaknesses || [];
  const sentenceAnalysis = evaluation?.sentenceStructureAnalysis;
  const toneAnalysis = evaluation?.toneModulationAnalysis;
  const fillerBreakdown = evaluation?.fillerWordsBreakdown || {};
  const fillerOccurrences = evaluation?.fillerOccurrences || [];

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

  // Helper to highlight filler words in transcript text
  const renderTextWithFillers = (text: string) => {
    const fillerRegex = /\b(um|umm|uh|uhh|er|err|like|you know|basically|actually|so|i mean|right|sort of|kind of)\b/gi;
    const parts = text.split(fillerRegex);
    return parts.map((part, i) => {
      if (fillerRegex.test(part)) {
        return (
          <mark key={i} className="bg-rose-500/25 text-rose-300 font-bold px-1 py-0.5 rounded border border-rose-500/40 mx-0.5">
            {part}
          </mark>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Banner & Overall Score Gauge */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Call QA Evaluation & Executive Speech Report</span>
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
            <span>AI Call Analysis & Executive Feedback Remarks</span>
          </div>
          <p className="text-sm text-slate-200">{evaluation?.summaryFeedback || 'Evaluation complete.'}</p>
        </div>

        {/* AI Coaching Tips & Key Recommendations */}
        <div className="mt-4 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
            <Target className="w-4 h-4 text-indigo-400" />
            <span>Key Actionable Takeaways & Next Steps</span>
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

      {/* Core AI Analysis Scores Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Sentence Struct.', score: evaluation?.sentenceStructureScore ?? 85, color: 'text-sky-400' },
          { label: 'Grammar', score: evaluation?.grammarScore ?? 85, color: 'text-amber-400' },
          { label: 'Filler Count', score: evaluation?.fillerWordsTotal ?? 0, color: (evaluation?.fillerWordsTotal ?? 0) > 3 ? 'text-rose-400' : 'text-emerald-400', isRaw: true },
          { label: 'Tone Delivery', score: evaluation?.toneModulationScore ?? 85, color: 'text-purple-400' },
          { label: 'Confidence', score: evaluation?.confidenceScore ?? 80, color: 'text-indigo-400' },
          { label: 'Listening', score: evaluation?.listeningScore ?? 85, color: 'text-teal-400' },
          { label: 'Fluency', score: evaluation?.fluencyScore ?? 82, color: 'text-emerald-400' },
          { label: 'Call Control', score: evaluation?.callControlScore ?? 80, color: 'text-amber-400' },
        ].map((item, i) => (
          <div
            key={i}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1"
          >
            <div className="text-[11px] font-medium text-slate-400 truncate">{item.label}</div>
            <div className={`text-xl font-black ${item.color}`}>
              {item.score}{item.isRaw ? '' : '%'}
            </div>
          </div>
        ))}
      </div>

      {/* Comprehensive Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-1">
        {[
          { id: 'rubric', label: 'Quality Rubric', icon: Award },
          { id: 'sentence', label: 'Sentence Structuring', icon: AlignLeft },
          { id: 'mistakes', label: `Grammar & Fixes (${mistakesList.length})`, icon: AlertTriangle },
          { id: 'fillers', label: `Filler Words (${evaluation?.fillerWordsTotal ?? 0})`, icon: Mic },
          { id: 'tone', label: 'Tone Modulation', icon: Activity },
          { id: 'transcript', label: 'Full Transcript', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
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

      {/* Tab 1: Quality Criteria Rubric */}
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

      {/* Tab 2: Sentence Structuring Analysis */}
      {activeTab === 'sentence' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
                  <AlignLeft className="w-4 h-4" />
                  <span>Sentence Structuring & Syntax Analysis</span>
                </div>
                <h3 className="text-lg font-black text-white mt-1">
                  Clarity Rating: {sentenceAnalysis?.clarityRating || 'Clear & Concise'}
                </h3>
              </div>
              <div className="px-4 py-2 rounded-xl bg-sky-950/60 border border-sky-800/60 text-sky-300 text-sm font-bold flex items-center gap-2">
                <span>Structure Score:</span>
                <span className="text-lg font-black text-sky-400">{sentenceAnalysis?.score ?? evaluation?.sentenceStructureScore ?? 85}%</span>
              </div>
            </div>

            <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-amber-400 block">AI Remarks on Sentence Structuring:</span>
              <p>{sentenceAnalysis?.remarks || 'Your sentences were well structured and easy to follow. Maintain logical subject-verb positioning and avoid combining multiple requests into single run-on sentences.'}</p>
            </div>

            {/* Restructuring Examples */}
            {sentenceAnalysis?.structuredExamples && sentenceAnalysis.structuredExamples.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  Sentence Restructuring Recommendations:
                </span>
                {sentenceAnalysis.structuredExamples.map((ex, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/30 text-xs space-y-1">
                        <span className="font-bold text-rose-400 block uppercase text-[10px]">As Spoken on Call</span>
                        <p className="text-rose-200">"{ex.userSentence}"</p>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-xs space-y-1">
                        <span className="font-bold text-emerald-400 block uppercase text-[10px]">Restructured Version</span>
                        <p className="text-emerald-200">"{ex.restructuredSentence}"</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 italic">
                      <b className="text-amber-400 not-italic">Why restructure:</b> {ex.improvementReason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Grammar & Mistakes */}
      {activeTab === 'mistakes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Detailed Grammar & Vocabulary Corrections
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

      {/* Tab 4: Filler Words & Speech Fluency Capture */}
      {activeTab === 'fillers' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <Mic className="w-4 h-4" />
                  <span>Filler Words & Verbal Pauses Capture</span>
                </div>
                <h3 className="text-lg font-black text-white mt-1">
                  Detected {evaluation?.fillerWordsTotal ?? 0} Filler Word{evaluation?.fillerWordsTotal === 1 ? '' : 's'} Spoken
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Speaking Rate</span>
                  <span className="text-sm font-bold text-amber-400">{evaluation?.wpm ?? 130} WPM</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Max Pause</span>
                  <span className="text-sm font-bold text-emerald-400">{evaluation?.longestPauseSeconds ?? 2}s</span>
                </div>
              </div>
            </div>

            {/* Filler Breakdown Chips */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Specific Filler Words Breakdown:
              </span>

              {Object.keys(fillerBreakdown).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(fillerBreakdown).map(([word, count]) => (
                    <div
                      key={word}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/30 border border-rose-800/50 flex items-center gap-2"
                    >
                      <span className="text-xs font-bold text-rose-300">"{word}"</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-rose-500 text-slate-950 font-black text-[10px]">
                        {count}x
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30 text-emerald-300 text-xs font-medium">
                  🎉 Zero filler words detected in your speech! Outstanding verbal precision and clarity.
                </div>
              )}
            </div>

            {/* Detected Context Instances */}
            {fillerOccurrences.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Contextual Occurrences in Speech:
                </span>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {fillerOccurrences.map((occ, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-rose-400">
                        <span>Filler Flagged: "{occ.word}" ({occ.count} occurrence{occ.count > 1 ? 's' : ''})</span>
                      </div>
                      <p className="text-slate-200">
                        {renderTextWithFillers(occ.contextSentence || '')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coaching Tip for Fillers */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Executive Speech Tip: Silent Pause Replacement</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                When you feel the urge to say "um", "like", or "you know" while retrieving information or formulating a thought, replace the filler sound with a <b>silent 1-second pause</b>. Silent pauses convey executive authority, confidence, and give callers time to digest information.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Tone Modulation */}
      {activeTab === 'tone' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                  <Activity className="w-4 h-4" />
                  <span>Tone Modulation & Vocal Delivery Analysis</span>
                </div>
                <h3 className="text-lg font-black text-white mt-1">
                  Overall Tone Score: {toneAnalysis?.score ?? evaluation?.toneModulationScore ?? 85}%
                </h3>
              </div>

              <div className="px-4 py-2 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-300 text-xs font-bold">
                Dynamic & Empathetic Vocal Delivery
              </div>
            </div>

            {/* Tone Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pitch & Cadence</span>
                <p className="text-sm font-extrabold text-purple-300">{toneAnalysis?.pitchVariation || 'Warm & Dynamic'}</p>
                <p className="text-[11px] text-slate-400">Avoids monotone delivery</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Empathy Level</span>
                <p className="text-sm font-extrabold text-emerald-300">{toneAnalysis?.empathyLevel || 'High Empathy'}</p>
                <p className="text-[11px] text-slate-400">Acknowledges caller feelings</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vocal Confidence</span>
                <p className="text-sm font-extrabold text-amber-300">{toneAnalysis?.confidenceLevel || 'Assertive & Calm'}</p>
                <p className="text-[11px] text-slate-400">Maintains composure</p>
              </div>
            </div>

            {/* AI Tone Remarks */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-amber-400 block uppercase tracking-wider text-[11px]">
                Detailed AI Tone Remarks:
              </span>
              <p>{toneAnalysis?.overallToneRemarks || 'Your vocal tone was warm, patient, and professional throughout the interaction. You sounded calm during identity verification and showed reassuring empathy when the caller described their issue.'}</p>
              {toneAnalysis?.pacingFeedback && (
                <p className="text-slate-400 pt-1 border-t border-slate-800/60">
                  <b className="text-indigo-300">Pacing Feedback:</b> {toneAnalysis.pacingFeedback}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Full Transcript with Filler Highlights */}
      {activeTab === 'transcript' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              Complete Call Transcript
            </h3>
            <button
              onClick={downloadTranscript}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700"
            >
              <Download className="w-4 h-4 text-amber-400" />
              Download Transcript
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 max-h-[30rem] overflow-y-auto">
            {(session?.transcript || []).map((msg, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span>
                    {msg.sender === 'user' ? 'Executive (You)' : session.scenario.customerName} • {msg.timestamp}
                  </span>
                  {msg.sender === 'user' && (
                    <span className="text-rose-400 font-semibold text-[9px] uppercase">
                      Highlighted: Verbal Fillers
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  {msg.sender === 'user' ? renderTextWithFillers(msg.text) : msg.text}
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
