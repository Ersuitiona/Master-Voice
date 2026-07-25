import { UserProfile, CallSession, Scenario } from '../types';
import { INITIAL_USER } from '../data/mockUserData';
import { PRESET_SCENARIOS } from '../data/presetScenarios';

const STORAGE_KEYS = {
  USER_PROFILE: 'mastervoice_user_profile',
  CALL_SESSIONS: 'mastervoice_call_sessions',
  CUSTOM_SCENARIOS: 'mastervoice_custom_scenarios',
  DARK_MODE: 'mastervoice_dark_mode',
};

export function getIsAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('mastervoice_is_authenticated') === 'true';
}

export function saveIsAuthenticated(authenticated: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mastervoice_is_authenticated', authenticated ? 'true' : 'false');
}

export function getUserProfile(): UserProfile {
  if (typeof window === 'undefined') return INITIAL_USER;
  const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  if (!saved) {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(INITIAL_USER));
    return INITIAL_USER;
  }
  try {
    return JSON.parse(saved);
  } catch (e) {
    return INITIAL_USER;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
}

export function resetFreshUser(): { freshUser: UserProfile; freshSessions: CallSession[] } {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.CALL_SESSIONS);
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(INITIAL_USER));
  }
  return { freshUser: INITIAL_USER, freshSessions: [] };
}

export function getCallSessions(): CallSession[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(STORAGE_KEYS.CALL_SESSIONS);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch (e) {
    return [];
  }
}

export function recalculateUserProfileFromSessions(
  profile: UserProfile,
  sessions: CallSession[]
): UserProfile {
  if (!sessions || sessions.length === 0) {
    return {
      ...profile,
      totalCalls: 0,
      practiceTimeMinutes: 0,
      avgScore: 0,
      scores: {
        fluency: 0,
        pronunciation: 0,
        confidence: 0,
        grammar: 0,
        listening: 0,
        empathy: 0,
        callControl: 0,
        professionalism: 0,
      },
      wpm: 0,
      fillerWordsCount: 0,
      weakAreas: [],
      strongAreas: [],
    };
  }

  const evaluatedSessions = sessions.filter((s) => s.evaluation);
  const totalCalls = sessions.length;
  const totalDurationSeconds = sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
  const practiceTimeMinutes = Math.round(totalDurationSeconds / 60);

  if (evaluatedSessions.length === 0) {
    return {
      ...profile,
      totalCalls,
      practiceTimeMinutes,
    };
  }

  const calcAvg = (fn: (e: NonNullable<CallSession['evaluation']>) => number | undefined) => {
    const vals = evaluatedSessions
      .map((s) => fn(s.evaluation!))
      .filter((v): v is number => typeof v === 'number' && !isNaN(v) && v > 0);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  const overallScore = calcAvg((e) => e.overallScore);
  const fluency = calcAvg((e) => e.fluencyScore);
  const grammar = calcAvg((e) => e.grammarScore);
  const confidence = calcAvg((e) => e.confidenceScore);
  const pronunciation = calcAvg((e) => e.pronunciationScore);
  const listening = calcAvg((e) => e.listeningScore);
  const empathy = calcAvg((e) => e.csatScore || e.toneModulationScore);
  const callControl = calcAvg((e) => e.callControlScore);
  const professionalism = calcAvg((e) => e.professionalismScore);
  const wpm = calcAvg((e) => e.wpm);
  const totalFillers = evaluatedSessions.reduce(
    (sum, s) => sum + (s.evaluation?.fillerWordsTotal || 0),
    0
  );

  // Extract weak areas & strong areas dynamically from AI evaluations
  const allWeaknesses = evaluatedSessions.flatMap((s) => s.evaluation?.weaknesses || []);
  const allStrengths = evaluatedSessions.flatMap((s) => s.evaluation?.strengths || []);

  const topWeakAreas = Array.from(new Set(allWeaknesses)).slice(0, 5);
  const topStrongAreas = Array.from(new Set(allStrengths)).slice(0, 5);

  return {
    ...profile,
    totalCalls,
    practiceTimeMinutes,
    avgScore: overallScore,
    scores: {
      fluency,
      pronunciation,
      confidence,
      grammar,
      listening,
      empathy,
      callControl,
      professionalism,
    },
    wpm: wpm || 135,
    fillerWordsCount: totalFillers,
    weakAreas: topWeakAreas,
    strongAreas: topStrongAreas,
  };
}

export function saveCallSession(session: CallSession): CallSession[] {
  const sessions = getCallSessions();
  const updated = [session, ...sessions];
  localStorage.setItem(STORAGE_KEYS.CALL_SESSIONS, JSON.stringify(updated));

  // Update user profile stats accurately from AI session evaluations
  const profile = getUserProfile();
  const updatedProfile = recalculateUserProfileFromSessions(profile, updated);

  saveUserProfile(updatedProfile);
  return updated;
}

export function getCustomScenarios(): Scenario[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_SCENARIOS);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch (e) {
    return [];
  }
}

export function saveCustomScenario(scenario: Scenario): Scenario[] {
  const custom = getCustomScenarios();
  const updated = [scenario, ...custom];
  localStorage.setItem(STORAGE_KEYS.CUSTOM_SCENARIOS, JSON.stringify(updated));
  return updated;
}

export function getAllScenarios(): Scenario[] {
  const custom = getCustomScenarios();
  return [...PRESET_SCENARIOS, ...custom];
}
