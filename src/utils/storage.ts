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

export function saveCallSession(session: CallSession): CallSession[] {
  const sessions = getCallSessions();
  const updated = [session, ...sessions];
  localStorage.setItem(STORAGE_KEYS.CALL_SESSIONS, JSON.stringify(updated));

  // Update user stats
  const profile = getUserProfile();
  const callDurationMins = Math.ceil(session.durationSeconds / 60);
  const totalCalls = profile.totalCalls + 1;
  const practiceTimeMinutes = profile.practiceTimeMinutes + callDurationMins;

  let newAvgScore = profile.avgScore;
  if (session.evaluation) {
    newAvgScore = Math.round(
      (profile.avgScore * profile.totalCalls + session.evaluation.overallScore) / totalCalls
    );
  }

  const updatedProfile: UserProfile = {
    ...profile,
    totalCalls,
    practiceTimeMinutes,
    avgScore: newAvgScore,
  };

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
