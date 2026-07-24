import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  CallSession,
  Scenario,
  CallEvaluation,
  IndustryType,
  PersonalityType,
  AccentType,
  DifficultyLevel,
} from './types';
import {
  getUserProfile,
  saveUserProfile,
  getCallSessions,
  saveCallSession,
  getAllScenarios,
  saveCustomScenario,
  getIsAuthenticated,
  saveIsAuthenticated,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { AuthScreen } from './components/AuthScreen';
import { DashboardView } from './components/DashboardView';
import { CallSimulator } from './components/CallSimulator';
import { CallEvaluationReport } from './components/CallEvaluationReport';
import { DLSTrainerMode } from './components/DLSTrainerMode';
import { LearningDrills } from './components/LearningDrills';
import { AICoach } from './components/AICoach';
import { AnalyticsView } from './components/AnalyticsView';
import { LeaderboardView } from './components/LeaderboardView';
import { BadgesAndMilestonesView } from './components/BadgesAndMilestonesView';
import { AdminPanel } from './components/AdminPanel';
import { evaluateUserBadges } from './utils/badgeEngine';
import { PhoneCall, Play, Sparkles, Filter, SlidersHorizontal, ShieldAlert, Award } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile>(getUserProfile());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => getIsAuthenticated());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [scenarios, setScenarios] = useState<Scenario[]>(getAllScenarios());
  const [recentSessions, setRecentSessions] = useState<CallSession[]>(getCallSessions());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Active Call State
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [isTrainerMode, setIsTrainerMode] = useState<boolean>(true);
  const [completedSession, setCompletedSession] = useState<{
    session: CallSession;
    evaluation: CallEvaluation;
  } | null>(null);

  // Scenario Filters
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [isGeneratingAiScenario, setIsGeneratingAiScenario] = useState(false);

  useEffect(() => {
    // Evaluate user badges against recent sessions
    const { updatedUser } = evaluateUserBadges(user, recentSessions);
    if (JSON.stringify(updatedUser.badges) !== JSON.stringify(user.badges)) {
      setUser(updatedUser);
      saveUserProfile(updatedUser);
    } else {
      saveUserProfile(user);
    }
  }, [recentSessions]);

  const handleUpdateUser = (updated: UserProfile) => {
    const { updatedUser } = evaluateUserBadges(updated, recentSessions);
    setUser(updatedUser);
    saveUserProfile(updatedUser);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    saveIsAuthenticated(false);
    localStorage.removeItem('auth_token');
  };

  const handleStartCall = (scenario: Scenario, trainerMode: boolean = true) => {
    setActiveScenario(scenario);
    setIsTrainerMode(trainerMode);
    setCompletedSession(null);
  };

  const handleCallEnded = (session: CallSession, evalResult: CallEvaluation) => {
    const updatedSessions = saveCallSession(session);
    setRecentSessions(updatedSessions);
    const currProfile = getUserProfile();
    const { updatedUser } = evaluateUserBadges(currProfile, updatedSessions);
    setUser(updatedUser);
    saveUserProfile(updatedUser);
    setCompletedSession({ session, evaluation: evalResult });
    setActiveScenario(null);
  };

  const handleSaveCustomScenario = (scenario: Scenario) => {
    const updated = saveCustomScenario(scenario);
    setScenarios(updated);
  };

  const handleGenerateRandomAiScenario = async () => {
    setIsGeneratingAiScenario(true);
    try {
      const res = await fetch('/api/scenarios/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: selectedIndustry !== 'All' ? selectedIndustry : 'Employee Support',
          difficulty: selectedDifficulty !== 'All' ? selectedDifficulty : 'Intermediate',
        }),
      });

      const generated: Scenario = await res.json();
      if (generated.title) {
        handleStartCall(generated, true);
      }
    } catch (e) {
      console.error('Failed to generate random scenario:', e);
      // Fallback
      handleStartCall(scenarios[0], true);
    } finally {
      setIsGeneratingAiScenario(false);
    }
  };

  const filteredScenarios = scenarios.filter((s) => {
    if (selectedIndustry !== 'All' && s.industry !== selectedIndustry) return false;
    if (selectedDifficulty !== 'All' && s.difficulty !== selectedDifficulty) return false;
    return true;
  });

  if (!isAuthenticated) {
    return (
      <AuthScreen
        user={user}
        onAuthenticated={(updatedUser) => {
          setUser(updatedUser);
          saveUserProfile(updatedUser);
          setIsAuthenticated(true);
          saveIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0A0A0C] text-slate-100' : 'bg-slate-100 text-slate-900'} font-sans selection:bg-indigo-500 selection:text-white`}>
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setCompletedSession(null);
          setActiveScenario(null);
        }}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Active Call Simulator View */}
        {activeScenario ? (
          <CallSimulator
            scenario={activeScenario}
            isTrainerMode={isTrainerMode}
            onCallEnded={handleCallEnded}
            onCancelCall={() => setActiveScenario(null)}
          />
        ) : completedSession ? (
          /* Post-Call QA Evaluation Report View */
          <CallEvaluationReport
            session={completedSession.session}
            evaluation={completedSession.evaluation}
            onPracticeMistakes={() => setActiveTab('drills')}
            onDone={() => setCompletedSession(null)}
          />
        ) : (
          /* Main Tab Views */
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                user={user}
                recentSessions={recentSessions}
                allScenarios={scenarios}
                onStartCall={(s) => handleStartCall(s, true)}
                onSelectSession={(sess) => {
                  if (sess.evaluation) {
                    setCompletedSession({ session: sess, evaluation: sess.evaluation });
                  }
                }}
                onNavigateTab={setActiveTab}
              />
            )}

            {/* Practice Call Scenario Library View */}
            {(activeTab === 'practice' || activeTab === 'dls') && (
              <div className="space-y-6 pb-16">
                {/* Header */}
                <div className="rounded-2xl bg-gradient-to-r from-[#16161D] via-[#1A1A24] to-[#12121A] border border-indigo-500/20 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                      <PhoneCall className="w-3.5 h-3.5 text-indigo-400" />
                      <span>AI-Powered Call Center Simulations</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">
                      Practice Calls Library
                    </h1>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      Select a structured call scenario or let Gemini generate an unlimited custom call.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleGenerateRandomAiScenario}
                      disabled={isGeneratingAiScenario}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all hover:scale-105 shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isGeneratingAiScenario ? 'Generating Scenario...' : 'Generate AI Scenario'}
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#16161D] border border-white/10 text-xs">
                  <div className="flex items-center gap-3">
                    <Filter className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-slate-300 text-xs">Category:</span>
                    <select
                      value={selectedIndustry}
                      onChange={(e) => setSelectedIndustry(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-slate-200 text-xs font-medium focus:outline-none"
                    >
                      <option value="All">All Categories</option>
                      <option value="Employee Support">Employee Support</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Banking">Banking</option>
                      <option value="Healthcare">Healthcare</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-300 text-xs">Difficulty:</span>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-slate-200 text-xs font-medium focus:outline-none"
                    >
                      <option value="All">All Levels</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>

                {/* Scenarios Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredScenarios.map((s) => (
                    <div
                      key={s.id}
                      className="p-5 rounded-2xl bg-[#16161D] border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold uppercase">
                            {s.industry}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-semibold">
                            {s.difficulty}
                          </span>
                        </div>

                        <h3 className="font-bold text-white text-base">{s.title}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                          {s.description}
                        </p>

                        <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Caller:</span>
                            <span className="font-medium text-slate-200">{s.customerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Persona:</span>
                            <span className="font-medium text-indigo-400">{s.personality}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartCall(s, true)}
                        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01]"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        Start Practice Call
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unified Coach & Drills Hub */}
            {activeTab === 'drills' && (
              <div className="space-y-6 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <AICoach user={user} />
                  </div>
                  <div className="space-y-4">
                    <LearningDrills />
                  </div>
                </div>
              </div>
            )}

            {/* Badges, Achievements & Daily Milestones Hub */}
            {activeTab === 'badges' && (
              <BadgesAndMilestonesView
                user={user}
                recentSessions={recentSessions}
                onNavigateTab={setActiveTab}
              />
            )}

            {/* Unified Performance Analytics & Leaderboard Hub */}
            {activeTab === 'analytics' && (
              <div className="space-y-8 pb-16">
                <AnalyticsView user={user} />
                <div className="pt-6 border-t border-white/10">
                  <LeaderboardView user={user} recentSessions={recentSessions} />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
      />
    </div>
  );
}
