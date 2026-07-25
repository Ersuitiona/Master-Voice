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
  resetFreshUser,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { AuthScreen } from './components/AuthScreen';
import { DashboardView } from './components/DashboardView';
import { CallSimulator } from './components/CallSimulator';
import { CallEvaluationReport } from './components/CallEvaluationReport';
import { QualityTrainerMode } from './components/QualityTrainerMode';
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
  // Initial tab from URL hash if present
  const getInitialTab = () => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '').trim();
      const validTabs = ['dashboard', 'practice', 'drills', 'badges', 'analytics', 'admin'];
      if (validTabs.includes(hash)) return hash;
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      const validTabs = ['dashboard', 'practice', 'drills', 'badges', 'analytics', 'admin'];
      if (validTabs.includes(hash)) {
        setActiveTabState(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const [scenarios, setScenarios] = useState<Scenario[]>(getAllScenarios());
  const [recentSessions, setRecentSessions] = useState<CallSession[]>(getCallSessions());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mastervoice_theme');
      if (saved) return saved === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mastervoice_theme', isDarkMode ? 'dark' : 'light');
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode]);

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
    // Ensure user profile and sessions reset to fresh state for next user
    handleResetUser();
  };

  const handleResetUser = () => {
    const { freshUser, freshSessions } = resetFreshUser();
    setUser(freshUser);
    setRecentSessions(freshSessions);
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
          setRecentSessions(getCallSessions());
          setIsAuthenticated(true);
          saveIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden ${isDarkMode ? 'bg-[#0A0A0C] text-slate-100' : 'bg-slate-100 text-slate-900'} font-sans selection:bg-indigo-500 selection:text-white`}>
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
      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-4 sm:pt-8 w-full max-w-full overflow-x-hidden">
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
            {(activeTab === 'practice' || activeTab === 'trainer') && (
              <div className="space-y-6 pb-16">
                {/* Header */}
                <div className={`rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-[#16161D] via-[#1A1A24] to-[#12121A] border border-indigo-500/20'
                    : 'bg-white border border-slate-200/80 shadow-slate-200/50'
                }`}>
                  <div className="space-y-1.5">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      isDarkMode
                        ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300'
                        : 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                    }`}>
                      <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
                      <span>AI-Powered Call Center Simulations</span>
                    </div>
                    <h1 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Practice Calls Library
                    </h1>
                    <p className={`text-xs max-w-2xl leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      Select a structured call scenario or let Gemini generate an unlimited custom call.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleGenerateRandomAiScenario}
                      disabled={isGeneratingAiScenario}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all hover:scale-105 shrink-0 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isGeneratingAiScenario ? 'Generating Scenario...' : 'Generate AI Scenario'}
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl text-xs transition-all ${
                  isDarkMode
                    ? 'bg-[#16161D] border border-white/10'
                    : 'bg-white border border-slate-200/80 shadow-xs'
                }`}>
                  <div className="flex items-center gap-3">
                    <Filter className="w-4 h-4 text-indigo-600" />
                    <span className={`font-semibold text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Category:</span>
                    <select
                      value={selectedIndustry}
                      onChange={(e) => setSelectedIndustry(e.target.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium focus:outline-none ${
                        isDarkMode
                          ? 'bg-black/40 border border-white/10 text-slate-200'
                          : 'bg-slate-100 border border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="All">All Categories</option>
                      <option value="Employee Support">Employee Support</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Banking">Banking</option>
                      <option value="Healthcare">Healthcare</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`font-semibold text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Difficulty:</span>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium focus:outline-none ${
                        isDarkMode
                          ? 'bg-black/40 border border-white/10 text-slate-200'
                          : 'bg-slate-100 border border-slate-200 text-slate-800'
                      }`}
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
                      className={`p-5 rounded-2xl transition-all flex flex-col justify-between space-y-4 ${
                        isDarkMode
                          ? 'bg-[#16161D] border border-white/10 hover:border-indigo-500/40'
                          : 'bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isDarkMode
                              ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {s.industry}
                          </span>
                          <span className={`text-[10px] font-mono font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {s.difficulty}
                          </span>
                        </div>

                        <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{s.title}</h3>
                        <p className={`text-xs leading-relaxed line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {s.description}
                        </p>

                        <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                          isDarkMode
                            ? 'bg-black/40 border-white/5'
                            : 'bg-slate-50 border-slate-200/60'
                        }`}>
                          <div className="flex justify-between">
                            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Caller:</span>
                            <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{s.customerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Persona:</span>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{s.personality}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartCall(s, true)}
                        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01] cursor-pointer"
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
                    <AICoach
                      user={user}
                      onStartCall={(scenario) => handleStartCall(scenario, true)}
                      onNavigateTab={setActiveTab}
                    />
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
                onResetProfile={handleResetUser}
              />
            )}

            {/* Unified Performance Analytics & Leaderboard Hub */}
            {activeTab === 'analytics' && (
              <div className="space-y-8 pb-16">
                <AnalyticsView user={user} recentSessions={recentSessions} />
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
