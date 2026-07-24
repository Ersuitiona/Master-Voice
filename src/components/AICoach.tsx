import React, { useState } from 'react';
import { UserProfile, Challenge } from '../types';
import { DAILY_CHALLENGES } from '../data/mockUserData';
import { GraduationCap, Sparkles, CheckCircle2, Flame, Award, Send, MessageSquare } from 'lucide-react';

interface Props {
  user: UserProfile;
}

export const AICoach: React.FC<Props> = ({ user }) => {
  const [challenges, setChallenges] = useState<Challenge[]>(DAILY_CHALLENGES);
  const [coachQuestion, setCoachQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState<
    { sender: 'coach' | 'user'; text: string }[]
  >([
    {
      sender: 'coach',
      text: `Hello ${user.name}! I am your AI Communication Coach. Based on your recent call recordings, your empathy score is outstanding (89%)! However, we should focus on polite interruptions and paraphrasing complex policy forms. How can I help you today?`,
    },
  ]);
  const [isAsking, setIsAsking] = useState(false);

  const handleAskCoach = async () => {
    if (!coachQuestion.trim()) return;

    const userText = coachQuestion;
    setCoachQuestion('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsAsking(true);

    setTimeout(() => {
      let coachReply =
        'Great question! When dealing with an anxious employee calling about leave pay, start with a warm acknowledging statement like "I hear how urgent this is for you." Then immediately pivot to security verification before giving request updates.';
      if (userText.toLowerCase().includes('filler')) {
        coachReply =
          'To eliminate filler words ("umm", "like"), pause silently for 1 second instead of filling the void with sound. Silence sounds confident and gives you time to construct your next thought!';
      } else if (userText.toLowerCase().includes('angry') || userText.toLowerCase().includes('upset')) {
        coachReply =
          'When handling an angry caller: 1) Lower your voice pitch slightly, 2) Never tell them to calm down, 3) Validate their frustration ("I completely agree that waiting 4 days for your pay is unacceptable"), and 4) Give clear next steps.';
      }

      setChatMessages((prev) => [...prev, { sender: 'coach', text: coachReply }]);
      setIsAsking(false);
    }, 800);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span>Personal AI Communication Trainer</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            AI Coach & Daily Homework
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Get personalized homework assignments, daily challenges, and instant answers to your voice coaching questions.
          </p>
        </div>
      </div>

      {/* Daily Challenges Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
          Today's Daily Practice Challenges
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {challenges.map((c) => (
            <div
              key={c.id}
              className={`p-5 rounded-2xl border space-y-3 transition-all ${
                c.completed
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  +{c.rewardPoints} XP
                </span>
                {c.completed ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Completed
                  </span>
                ) : (
                  <span className="text-xs font-mono text-slate-400">
                    {c.currentCount}/{c.targetCount}
                  </span>
                )}
              </div>

              <h4 className="font-bold text-white text-sm">{c.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive AI Coach Chat Assistant */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 space-y-4 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Ask Your Voice Coach</h3>
            <p className="text-xs text-slate-400">Get instant advice on support policies, de-escalation & tone</p>
          </div>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-amber-500 text-slate-950 font-medium'
                    : 'bg-slate-800 text-slate-100 border border-slate-700'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isAsking && (
            <div className="text-xs text-amber-400 italic">Coach is thinking...</div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={coachQuestion}
            onChange={(e) => setCoachQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskCoach()}
            placeholder="Ask your coach (e.g. 'How do I handle an angry employee calling about leave denial?')"
            className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={handleAskCoach}
            disabled={!coachQuestion.trim() || isAsking}
            className="p-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
