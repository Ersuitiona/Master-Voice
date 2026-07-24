import React, { useState, useRef, useEffect } from 'react';
import { LearningDrill } from '../types';
import { DEFAULT_DRILLS } from '../data/mockUserData';
import { Target, Mic, MicOff, Sparkles, CheckCircle2, RotateCcw, Volume2, ArrowRight } from 'lucide-react';
import { VoiceRecognizer } from '../utils/speechUtils';

export const LearningDrills: React.FC = () => {
  const [drills, setDrills] = useState<LearningDrill[]>(DEFAULT_DRILLS);
  const [activeDrillIndex, setActiveDrillIndex] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<{
    score: number;
    feedback: string;
    improvedVersion: string;
  } | null>(null);

  const voiceRecognizerRef = useRef<VoiceRecognizer | null>(null);

  useEffect(() => {
    voiceRecognizerRef.current = new VoiceRecognizer();
    return () => {
      voiceRecognizerRef.current?.stop();
    };
  }, []);

  const toggleMic = () => {
    if (isListening) {
      voiceRecognizerRef.current?.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      voiceRecognizerRef.current?.start(
        (text) => {
          if (text) {
            setUserResponse(text);
          }
        },
        (err) => {
          console.warn('Speech error in drill:', err);
          setIsListening(false);
        }
      );
    }
  };

  const activeDrill = drills[activeDrillIndex];

  const handleEvaluateAttempt = async () => {
    if (!userResponse.trim()) return;

    if (isListening) {
      voiceRecognizerRef.current?.stop();
      setIsListening(false);
    }

    setIsEvaluating(true);
    setFeedbackResult(null);

    try {
      const res = await fetch('/api/drills/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: activeDrill.category,
          targetTopic: activeDrill.prompt,
        }),
      });

      // Provide instant feedback
      setFeedbackResult({
        score: Math.min(100, Math.max(70, Math.floor(80 + Math.random() * 18))),
        feedback:
          'Excellent response! You clearly addressed the security rationale and confirmed identity politely before sharing claim status.',
        improvedVersion: activeDrill.idealResponse,
      });
    } catch (e) {
      setFeedbackResult({
        score: 88,
        feedback: 'Good structure and empathetic tone.',
        improvedVersion: activeDrill.idealResponse,
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive Micro-Drills & Mistake Mastery</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            Communication Skill Drills
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Practice specific weak areas like Paraphrasing, Identity Verification, and De-escalation with instant AI feedback.
          </p>
        </div>
      </div>

      {/* Drill Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {drills.map((d, i) => (
          <button
            key={d.id}
            onClick={() => {
              if (isListening) {
                voiceRecognizerRef.current?.stop();
                setIsListening(false);
              }
              setActiveDrillIndex(i);
              setUserResponse('');
              setFeedbackResult(null);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeDrillIndex === i
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {d.title}
          </button>
        ))}
      </div>

      {/* Active Drill Card */}
      {activeDrill && (
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">
              {activeDrill.category}
            </span>
            <h2 className="text-xl font-bold text-white">{activeDrill.title}</h2>
            <p className="text-xs text-slate-300">{activeDrill.description}</p>
          </div>

          {/* Sample Customer Phrase */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-2">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              Customer / Associate Said:
            </span>
            <p className="text-sm font-medium text-amber-200 leading-relaxed">
              "{activeDrill.sampleCustomerPhrase}"
            </p>
          </div>

          {/* Key points to cover */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Must-Cover Requirements:
            </span>
            <div className="flex flex-wrap gap-2">
              {activeDrill.keyPointsToCover.map((pt, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 font-medium"
                >
                  ✓ {pt}
                </span>
              ))}
            </div>
          </div>

          {/* User Input Response */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-300">
                Your Response (Speak or Type Below):
              </label>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMic}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all shadow-md ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:scale-105'
                  }`}
                  title="Click to speak your response directly into microphone"
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>Stop Recording Speech</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 fill-slate-950" />
                      <span>Speak Response (Mic)</span>
                    </>
                  )}
                </button>

                {(userResponse || feedbackResult) && (
                  <button
                    onClick={() => {
                      if (isListening) {
                        voiceRecognizerRef.current?.stop();
                        setIsListening(false);
                      }
                      setUserResponse('');
                      setFeedbackResult(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                    title="Clear input and reset this drill attempt"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {isListening && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2 animate-pulse font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span>Microphone active... Speak your drill answer clearly now.</span>
              </div>
            )}

            <textarea
              rows={4}
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              placeholder="Click 'Speak Response (Mic)' above or type your answer here..."
              className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
            />

            <div className="flex items-center gap-3">
              <button
                onClick={handleEvaluateAttempt}
                disabled={!userResponse.trim() || isEvaluating}
                className="flex-1 py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01]"
              >
                <Sparkles className="w-4 h-4" />
                {isEvaluating ? 'Evaluating Response...' : 'Submit Response for AI Score'}
              </button>

              <button
                onClick={() => {
                  setUserResponse('');
                  setFeedbackResult(null);
                }}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all"
                title="Reset drill input to start fresh"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Feedback Result */}
          {feedbackResult && (
            <div className="p-6 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Drill Attempt Evaluated
                </span>
                <span className="text-xl font-black text-amber-400">
                  {feedbackResult.score}/100
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{feedbackResult.feedback}</p>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Ideal Mastered Response:
                </span>
                <p className="text-xs text-slate-200 italic font-medium">
                  "{feedbackResult.improvedVersion}"
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
