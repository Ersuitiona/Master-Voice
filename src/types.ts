export type AuthMode = 'google' | 'email';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  authMode: AuthMode;
  streakDays: number;
  practiceTimeMinutes: number;
  totalCalls: number;
  avgScore: number;
  scores: {
    fluency: number;
    pronunciation: number;
    confidence: number;
    grammar: number;
    listening: number;
    empathy: number;
    callControl: number;
    professionalism: number;
  };
  wpm: number;
  fillerWordsCount: number;
  weakAreas: string[];
  strongAreas: string[];
  badges: Badge[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category?: 'Streak' | 'Soft Skills' | 'Quality' | 'Volume' | 'Compliance' | 'Special';
  tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  unlockedAt?: string;
  progress?: number; // 0 to 100
  currentCount?: number;
  maxProgress?: number;
  howToEarn?: string;
}

export interface DailyMilestone {
  id: string;
  title: string;
  description: string;
  category: 'Calls' | 'Quality' | 'Practice Time' | 'Compliance' | 'Fluency';
  target: number;
  current: number;
  unit: string;
  rewardPoints: number;
  completed: boolean;
  dateKey: string; // YYYY-MM-DD
}

export type IndustryType =
  | 'Employee Support'
  | 'HR Service Center'
  | 'Internal Helpdesk'
  | 'Shared Services'
  | 'Customer Support'
  | 'Technical Support'
  | 'Banking & Finance'
  | 'Healthcare Care Support'
  | 'General Employee Care'
  | 'IT Helpdesk'
  | 'E-Commerce & Retail'
  | 'Healthcare & Benefits'
  | 'Telecommunications'
  | 'Corporate Travel'
  | 'B2B SaaS'
  | 'HR & Onboarding';

export type SpeakingMode =
  | 'Outbound Call'
  | 'Inbound Call'
  | 'Follow-up Call'
  | 'Escalation Request'
  | 'Service Request'
  | 'Verification'
  | 'Information Collection'
  | 'Closing Call';

export type PersonalityType =
  | 'Friendly'
  | 'Calm'
  | 'Angry'
  | 'Frustrated'
  | 'Emotional'
  | 'Confused'
  | 'Talkative'
  | 'Silent'
  | 'Busy'
  | 'Nervous'
  | 'Senior Employee'
  | 'New Employee'
  | 'Fast Speaker'
  | 'Slow Speaker'
  | 'Highly Educated'
  | 'Non-native English Speaker'
  | 'Impatient'
  | 'Polite'
  | 'Demanding'
  | 'Uncertain'
  | 'Anxious'
  | 'Very Calm & Understanding'
  | 'Frustrated & Impatient'
  | 'Emotional / Crying'
  | 'Demand for Manager'
  | 'Negotiation & Discount Seeker';

export type AccentType =
  | 'American'
  | 'British'
  | 'Australian'
  | 'Canadian'
  | 'Indian'
  | 'African'
  | 'Irish'
  | 'Scottish'
  | 'Mixed Accent';

export type DifficultyLevel =
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
  | 'Expert'
  | 'Trainer Level'
  | 'Random';

export interface Scenario {
  id: string;
  title: string;
  industry: IndustryType;
  category: string;
  mode: SpeakingMode;
  personality: PersonalityType;
  accent: AccentType;
  difficulty: DifficultyLevel;
  description: string;
  customerName: string;
  caseId: string;
  customerDetails: {
    employeeId?: string;
    leaveType?: string;
    policyStatus?: string;
    accountNumber?: string;
    issueSummary: string;
    verificationFields: { key: string; value: string }[];
  };
  initialMessage: string;
  trainerRubric: {
    greetingRequired: boolean;
    verificationRequired: boolean;
    purposeStatementRequired: boolean;
    paraphrasingRequired: boolean;
    empathyRequired: boolean;
    policyExplanationRequired: boolean;
    ownershipRequired: boolean;
    closingRequired: boolean;
  };
}

export interface TranscriptMessage {
  id: string;
  sender: 'ai' | 'user' | 'system';
  text: string;
  timestamp: string;
  wpm?: number;
  fillerWords?: string[];
  coachingTip?: string;
  isInterruption?: boolean;
}

export interface CallMistake {
  id: string;
  originalText: string;
  correctedText: string;
  reasoning: string;
  betterAlternatives: string[];
  nativeSpeakerVersion: string;
  category: 'Grammar' | 'Empathy' | 'Verification' | 'Policy' | 'Tone' | 'Clarity' | 'Vocabulary';
}

export interface QualityRubricScore {
  criterion: string;
  passed: boolean;
  score: number; // 0 - 100
  feedback: string;
}

export interface FillerOccurrence {
  word: string;
  count: number;
  contextSentence?: string;
}

export interface SentenceStructureAnalysis {
  score: number; // 0 - 100
  clarityRating: string; // e.g. "High Clarity", "Run-on Sentences Detected", "Concise & Well Structured"
  remarks: string;
  structuredExamples: {
    userSentence: string;
    restructuredSentence: string;
    improvementReason: string;
  }[];
}

export interface ToneModulationAnalysis {
  score: number; // 0 - 100
  pitchVariation: string; // e.g. "Dynamic & Reassuring", "Monotone", "Warm & Professional"
  empathyLevel: string; // e.g. "High Empathy", "Neutral", "Needs Warmth"
  confidenceLevel: string; // e.g. "Assertive & Calm", "Hesitant", "Authoritative"
  pacingFeedback: string;
  overallToneRemarks: string;
}

export interface CallEvaluation {
  sessionId: string;
  overallScore: number;
  grammarScore: number;
  confidenceScore: number;
  pronunciationScore: number;
  listeningScore: number;
  professionalismScore: number;
  csatScore: number;
  fluencyScore: number;
  callControlScore: number;
  sentenceStructureScore?: number;
  toneModulationScore?: number;
  wpm: number;
  fillerWordsTotal: number;
  fillerWordsBreakdown: Record<string, number>;
  fillerOccurrences?: FillerOccurrence[];
  longestPauseSeconds: number;
  summaryFeedback: string;
  trainerNotes: string[];
  sentenceStructureAnalysis?: SentenceStructureAnalysis;
  toneModulationAnalysis?: ToneModulationAnalysis;
  qualityRubric: QualityRubricScore[];
  dlsRubric?: QualityRubricScore[]; // Alias for backwards compatibility
  mistakes: CallMistake[];
  strengths: string[];
  weaknesses: string[];
  cefrLevel?: string; // e.g. B2, C1, C2
  workplaceReadinessScore?: number; // e.g. 88%
  homeworkExercises?: string[];
}

export interface CallSession {
  id: string;
  scenario: Scenario;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  isTrainerMode: boolean;
  transcript: TranscriptMessage[];
  evaluation?: CallEvaluation;
  audioUrl?: string;
}

export interface LearningDrill {
  id: string;
  title: string;
  category: 'Paraphrasing' | 'Empathy' | 'Identity Verification' | 'Policy Explanation' | 'De-escalation' | 'Call Control' | 'Professional Closing';
  description: string;
  prompt: string;
  sampleCustomerPhrase: string;
  idealResponse: string;
  keyPointsToCover: string[];
  userAttempts?: {
    text: string;
    score: number;
    feedback: string;
    timestamp: string;
  }[];
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  score: number;
  callsCount: number;
  streak: number;
  badgeTitle: string;
  isCurrentUser?: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  rewardPoints: number;
  targetCount: number;
  currentCount: number;
  completed: boolean;
}

