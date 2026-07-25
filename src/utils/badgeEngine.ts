import { UserProfile, CallSession, Badge, DailyMilestone } from '../types';
import { ALL_BADGES_MASTER } from '../data/badgesData';

// Helper to format date as YYYY-MM-DD
export function getTodayDateKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DAILY_MILESTONES_STORAGE_PREFIX = 'mastervoice_daily_milestones_';

// Calculate & Retrieve Daily Milestones
export function getDailyMilestones(recentSessions: CallSession[] = [], user?: UserProfile): DailyMilestone[] {
  const dateKey = getTodayDateKey();
  const storageKey = `${DAILY_MILESTONES_STORAGE_PREFIX}${dateKey}`;

  // Filter calls done today
  const todaySessions = recentSessions.filter((s) => {
    if (!s.startTime) return false;
    const sessionDate = new Date(s.startTime).toISOString().slice(0, 10);
    return sessionDate === dateKey;
  });

  const todayCallsCount = todaySessions.length;
  const todayMins = Math.round(
    todaySessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / 60
  );
  const todayHighQualityCalls = todaySessions.filter(
    (s) => (s.evaluation?.overallScore || 0) >= 85
  ).length;

  const todayVerifiedCalls = todaySessions.filter((s) =>
    s.evaluation?.qualityRubric?.some(
      (r) => r.criterion.toLowerCase().includes('verification') && r.passed
    )
  ).length;

  const todayLowFillerCalls = todaySessions.filter(
    (s) => (s.evaluation?.fillerWordsTotal || 0) <= 2
  ).length;

  // Retrieve saved milestone claimed states
  let savedStates: Record<string, boolean> = {};
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        savedStates = JSON.parse(raw);
      } catch (e) {
        savedStates = {};
      }
    }
  }

  const milestonesTemplate = [
    {
      id: 'dm-1',
      title: 'Daily Call Sprint',
      description: 'Complete 2 mock call sessions today',
      category: 'Calls' as const,
      target: 2,
      current: todayCallsCount,
      unit: 'calls',
      rewardPoints: 100,
    },
    {
      id: 'dm-2',
      title: 'Daily Practice Target',
      description: 'Practice speaking for at least 10 minutes today',
      category: 'Practice Time' as const,
      target: 10,
      current: todayMins,
      unit: 'mins',
      rewardPoints: 150,
    },
    {
      id: 'dm-3',
      title: 'QA Excellence Award',
      description: 'Achieve an overall score of 85+ on a call today',
      category: 'Quality' as const,
      target: 1,
      current: todayHighQualityCalls,
      unit: 'calls',
      rewardPoints: 200,
    },
    {
      id: 'dm-4',
      title: 'Identity Verification Compliance',
      description: 'Pass employee identity verification in a support call today',
      category: 'Compliance' as const,
      target: 1,
      current: todayVerifiedCalls,
      unit: 'calls',
      rewardPoints: 120,
    },
    {
      id: 'dm-5',
      title: 'Zero Filler Sprint',
      description: 'Complete a call session with under 3 filler words today',
      category: 'Fluency' as const,
      target: 1,
      current: todayLowFillerCalls,
      unit: 'calls',
      rewardPoints: 180,
    },
  ];

  const milestones: DailyMilestone[] = milestonesTemplate.map((m) => {
    const isMet = m.current >= m.target;
    return {
      ...m,
      dateKey,
      completed: isMet,
    };
  });

  return milestones;
}

// Evaluate Badges and unlock newly earned ones
export function evaluateUserBadges(
  user: UserProfile,
  recentSessions: CallSession[]
): { updatedUser: UserProfile; newlyUnlockedBadges: Badge[] } {
  const dateKey = getTodayDateKey();

  const totalCalls = Math.max(user.totalCalls, recentSessions.length);
  const streakDays = user.streakDays || 1;

  // Empathy 90+ calls count
  const empathyHighCount = recentSessions.filter(
    (s) => (s.evaluation?.csatScore || 0) >= 90 || (s.evaluation?.overallScore || 0) >= 90
  ).length;

  // Support calls count
  const supportCallsCount = recentSessions.filter((s) =>
    s.scenario?.industry?.includes('Support') || s.scenario?.category?.includes('Support')
  ).length;

  // Zero filler calls count
  const zeroFillerCalls = recentSessions.filter(
    (s) => (s.evaluation?.fillerWordsTotal || 0) <= 2
  ).length;

  // De-escalation count
  const deEscalationCount = recentSessions.filter(
    (s) =>
      (s.scenario?.personality === 'Angry' || s.scenario?.personality === 'Frustrated') &&
      (s.evaluation?.overallScore || 0) >= 85
  ).length;

  // Verification passed count
  const verificationPassedCount = recentSessions.filter((s) =>
    s.evaluation?.qualityRubric?.some(
      (r) => r.criterion.toLowerCase().includes('verification') && r.passed
    )
  ).length;

  // Grammar 95+ count
  const grammarHighCount = recentSessions.filter(
    (s) => (s.evaluation?.grammarScore || 0) >= 95
  ).length;

  // WPM 120-150 count
  const wpmIdealCount = recentSessions.filter(
    (s) => (s.evaluation?.wpm || 0) >= 120 && (s.evaluation?.wpm || 0) <= 150
  ).length;

  // CSAT 95+ count
  const csatHighCount = recentSessions.filter(
    (s) => (s.evaluation?.csatScore || 0) >= 95
  ).length;

  // QA 90+ count
  const qaHighCount = recentSessions.filter(
    (s) => (s.evaluation?.overallScore || 0) >= 90
  ).length;

  // Policy explanation passed count
  const policyPassedCount = recentSessions.filter((s) =>
    s.evaluation?.qualityRubric?.some(
      (r) => r.criterion.toLowerCase().includes('policy') && r.passed
    )
  ).length;

  // Night owl count (calls after 8pm or before 4am)
  const nightOwlCount = recentSessions.filter((s) => {
    if (!s.startTime) return false;
    const hour = new Date(s.startTime).getHours();
    return hour >= 20 || hour < 4;
  }).length;

  // Build current map of user's existing badges
  const existingBadgesMap = new Map<string, Badge>();
  (user.badges || []).forEach((b) => existingBadgesMap.set(b.id, b));

  const newlyUnlockedBadges: Badge[] = [];

  const updatedBadges: Badge[] = ALL_BADGES_MASTER.map((masterBadge) => {
    const existing = existingBadgesMap.get(masterBadge.id);

    let currentCount = existing?.currentCount ?? 0;
    const maxProgress = masterBadge.maxProgress || 1;

    // Calculate live currentCount based on badge ID
    switch (masterBadge.id) {
      case 'bdg-1': // 7-Day Streak
        currentCount = Math.min(maxProgress, Math.max(currentCount, streakDays));
        break;
      case 'bdg-8': // 14-Day Streak
        currentCount = Math.min(maxProgress, Math.max(currentCount, streakDays));
        break;
      case 'bdg-9': // 30-Day Streak
        currentCount = Math.min(maxProgress, Math.max(currentCount, streakDays));
        break;
      case 'bdg-2': // Empathy Champion
        currentCount = Math.min(maxProgress, Math.max(currentCount, empathyHighCount));
        break;
      case 'bdg-3': // Support Specialist
        currentCount = Math.min(maxProgress, Math.max(currentCount, supportCallsCount));
        break;
      case 'bdg-4': // Zero Filler Hero
        currentCount = Math.min(maxProgress, Math.max(currentCount, zeroFillerCalls));
        break;
      case 'bdg-5': // 10 Calls Apprentice
        currentCount = Math.min(maxProgress, Math.max(currentCount, totalCalls));
        break;
      case 'bdg-6': // 25 Calls Veteran
        currentCount = Math.min(maxProgress, Math.max(currentCount, totalCalls));
        break;
      case 'bdg-7': // 100 Calls Legend
        currentCount = Math.min(maxProgress, Math.max(currentCount, totalCalls));
        break;
      case 'bdg-10': // De-escalation Ninja
        currentCount = Math.min(maxProgress, Math.max(currentCount, deEscalationCount));
        break;
      case 'bdg-11': // Identity Guard
        currentCount = Math.min(maxProgress, Math.max(currentCount, verificationPassedCount));
        break;
      case 'bdg-12': // Grammar Wizard
        currentCount = Math.min(maxProgress, Math.max(currentCount, grammarHighCount));
        break;
      case 'bdg-13': // Pacing Master
        currentCount = Math.min(maxProgress, Math.max(currentCount, wpmIdealCount));
        break;
      case 'bdg-14': // CSAT Superstar
        currentCount = Math.min(maxProgress, Math.max(currentCount, csatHighCount));
        break;
      case 'bdg-15': // Call Quality Elite
        currentCount = Math.min(maxProgress, Math.max(currentCount, qaHighCount));
        break;
      case 'bdg-16': // Policy Expert
        currentCount = Math.min(maxProgress, Math.max(currentCount, policyPassedCount));
        break;
      case 'bdg-17': // Night Owl
        currentCount = Math.min(maxProgress, Math.max(currentCount, nightOwlCount));
        break;
      default:
        break;
    }

    const progressPct = Math.min(100, Math.round((currentCount / maxProgress) * 100));

    let unlockedAt = existing?.unlockedAt;
    if (progressPct >= 100 && !unlockedAt) {
      unlockedAt = dateKey;
      const newlyUnlocked: Badge = {
        ...masterBadge,
        currentCount,
        progress: 100,
        unlockedAt,
      };
      newlyUnlockedBadges.push(newlyUnlocked);
    }

    return {
      ...masterBadge,
      currentCount,
      progress: progressPct,
      unlockedAt,
    };
  });

  const updatedUser: UserProfile = {
    ...user,
    badges: updatedBadges,
  };

  return { updatedUser, newlyUnlockedBadges };
}
