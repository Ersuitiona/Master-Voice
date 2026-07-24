import React, { useState } from 'react';
import { UserProfile, Challenge, Scenario } from '../types';
import { DAILY_CHALLENGES } from '../data/mockUserData';
import { PRESET_SCENARIOS } from '../data/presetScenarios';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Flame,
  RotateCcw,
  Play,
  Send,
  Copy,
  Check,
  RefreshCw,
  BookOpen,
  Target,
  MessageSquare,
  Zap,
} from 'lucide-react';

interface Props {
  user: UserProfile;
  onStartCall?: (scenario: Scenario, trainerMode?: boolean) => void;
  onNavigateTab?: (tab: string) => void;
}

interface CoachChatMessage {
  id: string;
  sender: 'coach' | 'user';
  text: string;
  timestamp: string;
  isRetry?: boolean;
}

export const AICoach: React.FC<Props> = ({ user, onStartCall, onNavigateTab }) => {
  const [challenges, setChallenges] = useState<Challenge[]>(DAILY_CHALLENGES);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<CoachChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'coach',
      text: `Hello ${user.name}! I am your AI Executive Voice Coach. Based on your recent call recordings, your caller empathy score is strong (89%)! However, we should focus on sentence structuring, eliminating filler pauses ("um", "like"), and smooth identity verification. How can I guide your practice today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [coachQuestion, setCoachQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // --- Daily Homework Handlers ---
  const handleResetSingleHomework = (challengeId: string) => {
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challengeId
          ? { ...c, currentCount: 0, completed: false }
          : c
      )
    );
    const item = challenges.find((c) => c.id === challengeId);
    showToast(`Homework task "${item?.title || 'Challenge'}" reset! Ready to try again.`);
  };

  const handleResetAllHomework = () => {
    setChallenges((prev) =>
      prev.map((c) => ({ ...c, currentCount: 0, completed: false }))
    );
    showToast('All Daily Homework tasks reset! You can now do all assignments again.');
  };

  const handleGenerateFreshHomework = () => {
    const newTasks: Challenge[] = [
      {
        id: `ch-fresh-1-${Date.now()}`,
        title: 'Zero Filler Words Challenge',
        description: 'Complete a 2-minute call with 0 filler words ("um", "like", "you know")',
        rewardPoints: 200,
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
      {
        id: `ch-fresh-2-${Date.now()}`,
        title: 'Sentence Restructuring Master',
        description: 'Achieve a 90%+ Sentence Structure clarity rating on an Employee Support Call',
        rewardPoints: 220,
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
      {
        id: `ch-fresh-3-${Date.now()}`,
        title: 'Empathetic De-escalation Drill',
        description: 'Achieve 88+ Tone Modulation score on an emotional or frustrated caller scenario',
        rewardPoints: 250,
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ];
    setChallenges(newTasks);
    showToast('Generated 3 fresh Daily Homework challenges tailored to your recent voice performance!');
  };

  const handlePracticeHomeworkCall = (challenge: Challenge) => {
    let targetScenario = PRESET_SCENARIOS[0];
    if (challenge.title.toLowerCase().includes('angry') || challenge.title.toLowerCase().includes('de-escalat')) {
      targetScenario = PRESET_SCENARIOS[0]; // Frustrated Sarah Jenkins
    } else if (challenge.title.toLowerCase().includes('filler') || challenge.title.toLowerCase().includes('zero')) {
      targetScenario = PRESET_SCENARIOS[1] || PRESET_SCENARIOS[0];
    } else if (challenge.title.toLowerCase().includes('verification')) {
      targetScenario = PRESET_SCENARIOS[0];
    }

    if (onStartCall) {
      onStartCall(targetScenario, true);
    } else if (onNavigateTab) {
      onNavigateTab('dashboard');
    }
  };

  // --- AI Coach Chat Handlers ---
  const handleAskCoach = async (overrideQuestion?: string, isRetryCall?: boolean) => {
    const textToSend = overrideQuestion || coachQuestion;
    if (!textToSend.trim()) return;

    if (!overrideQuestion) {
      setCoachQuestion('');
    }

    const userMsg: CoachChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (!isRetryCall) {
      setChatMessages((prev) => [...prev, userMsg]);
    }

    setIsAsking(true);

    try {
      const res = await fetch('/api/coach/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: textToSend, user, isRetry: isRetryCall }),
      });
      const data = await res.json();

      const coachMsg: CoachChatMessage = {
        id: `msg-coach-${Date.now()}`,
        sender: 'coach',
        text: data.reply || 'Maintain polite call control, clean sentence structure, and verified identity procedures.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRetry: isRetryCall,
      };

      setChatMessages((prev) => [...prev, coachMsg]);
      if (isRetryCall) {
        showToast('AI Coach re-evaluated response with fresh advice!');
      }
    } catch (err) {
      console.error('Error asking coach:', err);
      let coachReply =
        'Great question! Focus on 1) Clear sentence structuring, 2) Silent 1-second pauses instead of filler words, and 3) Polite identity verification before revealing case details.';
      if (textToSend.toLowerCase().includes('filler')) {
        coachReply =
          'To eliminate filler words ("umm", "like"), pause silently for 1 second instead of filling the void with sound. Silence sounds confident and gives you time to construct your next thought!';
      }

      const fallbackMsg: CoachChatMessage = {
        id: `msg-coach-${Date.now()}`,
        sender: 'coach',
        text: coachReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRetry: isRetryCall,
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleRetryCoachResponse = (messageIndex: number) => {
    // Find the previous user prompt associated with or prior to this coach message
    let lastUserPrompt = 'How can I improve my call handling and sentence structuring?';
    for (let i = messageIndex; i >= 0; i--) {
      if (chatMessages[i]?.sender === 'user') {
        lastUserPrompt = chatMessages[i].text;
        break;
      }
    }
    handleAskCoach(lastUserPrompt, true);
  };

  const handleRetryCoachingSession = () => {
    setChatMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'coach',
        text: `Coaching Session Reset! Hello ${user.name}, I am ready to guide you again. Ask any question on tone modulation, sentence structuring, handling difficult callers, or removing filler words!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    showToast('Coaching session reset! Starting again from scratch.');
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 relative">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce border border-amber-400">
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span>Personal AI Communication & Executive Voice Coach</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            AI Coach & Daily Homework
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Practice personalized homework tasks, retry assignments for mastery, and get real-time AI guidance on sentence structuring, tone modulation, and de-escalation.
          </p>
        </div>
      </div>

      {/* Daily Homework Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h2 className="text-base font-bold text-white">Daily Homework & Practice Assignments</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetAllHomework}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all hover:scale-105"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Do Homework Again</span>
            </button>

            <button
              onClick={handleGenerateFreshHomework}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-amber-500/30 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Generate New Tasks</span>
            </button>
          </div>
        </div>

        {/* Homework Tasks Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {challenges.map((c) => (
            <div
              key={c.id}
              className={`p-5 rounded-2xl border space-y-4 transition-all flex flex-col justify-between ${
                c.completed
                  ? 'bg-emerald-950/20 border-emerald-500/30 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    +{c.rewardPoints} XP
                  </span>
                  {c.completed ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-slate-400">
                      Progress: {c.currentCount}/{c.targetCount}
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-white text-sm">{c.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>
              </div>

              {/* Action Buttons for Homework */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResetSingleHomework(c.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-amber-500/30 transition-all hover:scale-105"
                    title="Reset progress on this mission to do it again"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reset Mission</span>
                  </button>

                  <button
                    onClick={() => handlePracticeHomeworkCall(c)}
                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Practice Call</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive AI Coach Assistant with Retry Options */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Ask Your Voice Coach</h3>
              <p className="text-xs text-slate-400">Get instant advice on sentence structuring, tone modulation & de-escalation</p>
            </div>
          </div>

          <button
            onClick={handleRetryCoachingSession}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Coaching Session</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="space-y-4 max-h-96 overflow-y-auto p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80">
          {chatMessages.map((msg, i) => (
            <div
              key={msg.id || i}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>{msg.sender === 'user' ? 'You' : 'AI Voice Coach'}</span>
                <span>• {msg.timestamp}</span>
                {msg.isRetry && (
                  <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                    Re-evaluated
                  </span>
                )}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'bg-slate-800 text-slate-100 border border-slate-700 shadow-lg'
                }`}
              >
                <p>{msg.text}</p>

                {msg.sender === 'coach' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60 mt-2">
                    <button
                      onClick={() => handleRetryCoachResponse(i)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-amber-300 text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition-all"
                      title="Re-evaluate coach advice with fresh perspective"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      <span>Retry Answer</span>
                    </button>

                    <button
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-slate-300 text-[11px] font-medium flex items-center gap-1 border border-slate-700 transition-all"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {onStartCall && (
                      <button
                        onClick={() => onStartCall(PRESET_SCENARIOS[0], true)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-[11px] font-bold flex items-center gap-1 border border-indigo-500/30 transition-all ml-auto"
                      >
                        <Play className="w-3 h-3 fill-indigo-200" />
                        <span>Practice Call</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isAsking && (
            <div className="flex items-center gap-2 text-xs text-amber-400 italic p-2">
              <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
              <span>AI Coach is analyzing and formulating response...</span>
            </div>
          )}
        </div>

        {/* Quick "Do It Again" Recommended Practice Chips */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Quick Practice Topics ("Do It Again"):
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '🔁 Retry Identity Verification Practice', q: 'How do I smoothly ask for employee ID and DOB without sounding rigid?' },
              { label: '🔁 Retry De-escalation & Tone Control', q: 'Give me 3 step de-escalation tips for an angry employee calling about leave delays.' },
              { label: '🔁 Retry Filler Word Elimination', q: 'How do I replace "um", "uh", and "like" with confident silent pauses?' },
              { label: '🔁 Retry Sentence Restructuring', q: 'How can I restructure long run-on sentences during phone calls?' },
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleAskCoach(chip.q)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-300 text-xs font-semibold border border-slate-800 transition-all hover:scale-105"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={coachQuestion}
            onChange={(e) => setCoachQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskCoach()}
            placeholder="Ask your coach (e.g. 'How do I eliminate filler words when checking case status?')"
            className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={() => handleAskCoach()}
            disabled={!coachQuestion.trim() || isAsking}
            className="p-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
