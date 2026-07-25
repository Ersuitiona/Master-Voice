// Speech recognition & synthesis utilities for Master Voice AI

export interface SpeechRecognitionResultItem {
  transcript: string;
  isFinal: boolean;
}

const FILLER_PATTERNS = [
  /\b(um+|uh+|ahh+|er+|hmm+)\b/gi,
  /\b(like)\b/gi,
  /\b(actually)\b/gi,
  /\b(basically)\b/gi,
  /\b(you know)\b/gi,
  /\b(I mean)\b/gi,
];

export function analyzeSpeechText(text: string, durationSeconds: number = 5) {
  let fillerCount = 0;
  const foundFillers: string[] = [];

  FILLER_PATTERNS.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      fillerCount += matches.length;
      matches.forEach((m) => foundFillers.push(m.toLowerCase()));
    }
  });

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const wpm = durationSeconds > 0 ? Math.round((wordCount / durationSeconds) * 60) : 0;

  return {
    wordCount,
    fillerCount,
    foundFillers,
    wpm,
  };
}

// Persistent Voice Lock per caller session to prevent voice shifting mid-call
const callerVoiceMap = new Map<string, string>();

// Global AI Audio Output state tracking for acoustic echo suppression
let isAiAudioOutputActive = false;
let lastAiAudioOutputEndTime = 0;

export function setAiAudioOutputActive(active: boolean) {
  isAiAudioOutputActive = active;
  if (!active) {
    lastAiAudioOutputEndTime = Date.now();
  }
}

export function getIsAiAudioOutputActive(): boolean {
  if (isAiAudioOutputActive) return true;
  if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
    return true;
  }
  // 600ms acoustic decay guard window after AI speech ends to eliminate room reflections
  if (Date.now() - lastAiAudioOutputEndTime < 600) {
    return true;
  }
  return false;
}

// Advanced Acoustic Echo Filter: checks if user speech matches recent AI utterances
export function isAcousticAiEcho(userText: string, recentAiUtterances: string[]): boolean {
  if (!userText || !userText.trim() || !recentAiUtterances || recentAiUtterances.length === 0) {
    return false;
  }

  const normUser = userText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normUser || normUser.length < 3) return false;

  const userWords = normUser.split(' ').filter((w) => w.length > 2);
  if (userWords.length === 0) return false;

  for (const aiMsg of recentAiUtterances) {
    if (!aiMsg) continue;
    const normAi = aiMsg.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!normAi) continue;

    // Exact or substring match
    if (normUser === normAi) return true;
    if (normUser.length > 10 && normAi.includes(normUser)) return true;
    if (normAi.length > 10 && normUser.includes(normAi)) return true;

    // Consecutive 3-word overlap check
    if (userWords.length >= 3) {
      for (let i = 0; i <= userWords.length - 3; i++) {
        const trigram = `${userWords[i]} ${userWords[i + 1]} ${userWords[i + 2]}`;
        if (normAi.includes(trigram)) {
          return true;
        }
      }
    }

    // Jaccard word overlap ratio (> 40% matching words)
    const aiWordSet = new Set(normAi.split(' '));
    const matchingCount = userWords.filter((w) => aiWordSet.has(w)).length;
    if (userWords.length >= 2 && matchingCount / userWords.length >= 0.4) {
      return true;
    }
  }

  return false;
}

// Pre-warm Web Speech Synthesis voices array early
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.getVoices();
    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  } catch (e) {
    // Ignore voice load quirks
  }
}

export function getLockedVoiceForCaller(
  callerKey: string,
  accent?: string,
  preferredVoiceName?: string
): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. If already assigned a voice for this caller/scenario, stick to it
  const existingVoiceName = callerVoiceMap.get(callerKey);
  if (existingVoiceName) {
    const matched = voices.find((v) => v.name === existingVoiceName);
    if (matched) return matched;
  }

  // 2. Otherwise select the best natural voice once and lock it
  let selectedVoice: SpeechSynthesisVoice | undefined;
  const preferredKeywords = [
    'natural',
    'neural',
    'google',
    'online',
    'enhanced',
    'samantha',
    'daniel',
    'alex',
    'karen',
    'victoria',
    'serena',
  ];

  if (preferredVoiceName) {
    selectedVoice = voices.find((v) =>
      v.name.toLowerCase().includes(preferredVoiceName.toLowerCase())
    );
  }

  if (!selectedVoice && accent) {
    const accentLangMap: Record<string, string> = {
      American: 'en-US',
      British: 'en-GB',
      Australian: 'en-AU',
      Indian: 'en-IN',
      Canadian: 'en-CA',
      Irish: 'en-IE',
    };
    const langCode = accentLangMap[accent] || 'en-US';
    const langVoices = voices.filter((v) => v.lang.startsWith(langCode));

    selectedVoice =
      langVoices.find((v) =>
        preferredKeywords.some((kw) => v.name.toLowerCase().includes(kw))
      ) || langVoices[0];
  }

  if (!selectedVoice) {
    selectedVoice =
      voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          preferredKeywords.some((kw) => v.name.toLowerCase().includes(kw))
      ) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];
  }

  if (selectedVoice) {
    callerVoiceMap.set(callerKey, selectedVoice.name);
    return selectedVoice;
  }

  return null;
}

// Advanced Speech Synthesis with natural prosody, emotion modulation, and caller voice locking
export function speakText(
  text: string,
  options?: {
    callerKey?: string;
    voiceName?: string;
    rate?: number; // 0.8 - 1.2
    pitch?: number; // 0.8 - 1.2
    emotion?: string;
    accent?: string;
    onEnd?: () => void;
    onStart?: () => void;
  }
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    options?.onEnd?.();
    return null;
  }

  window.speechSynthesis.cancel(); // Stop any ongoing speech

  // Helper to format text phonetically for speech synthesis (pronounces codes, acronyms, and IDs with crystal clarity)
  const formatTextForPhoneticTTS = (str: string): string => {
    if (!str) return '';
    let formatted = str;

    // Remove or convert stage directions like *sighs*, *pauses*, *chuckles*, [chuckles] into natural pauses for TTS
    formatted = formatted.replace(/\*+(sighs|pauses|takes a breath|chuckles|groans|gasps|hesitates)[^*]*\*+/gi, ', ');
    formatted = formatted.replace(/\[(sighs|pauses|takes a breath|chuckles|groans|gasps|hesitates)[^\]]*\]/gi, ', ');
    formatted = formatted.replace(/\*+[^*]+\*+/g, ''); // strip any remaining asterisk tags

    // Format Employee IDs, Ticket IDs, and Case Codes (e.g. EMP-881920 -> "E M P, 8 8 1 9 2 0")
    formatted = formatted.replace(/\b([A-Za-z]{2,4})-([0-9]+)\b/g, (match, prefix, digits) => {
      const spelledPrefix = prefix.split('').join(' ');
      const spelledDigits = digits.split('').join(' ');
      return `${spelledPrefix}, ${spelledDigits}`;
    });

    // Expand common call center acronyms and symbols so Web Speech TTS doesn't slur or mispronounce them
    return formatted
      .replace(/\bFMLA\b/g, 'F M L A')
      .replace(/\bWH-380\b/gi, 'W H 3 8 0')
      .replace(/\bWH380\b/gi, 'W H 3 8 0')
      .replace(/\bSTD\b/g, 'S T D')
      .replace(/\bUPT\b/g, 'U P T')
      .replace(/\bSSO\b/g, 'S S O')
      .replace(/\b2FA\b/gi, '2 F A')
      .replace(/\bCSAT\b/gi, 'C SAT')
      .replace(/\bQA\b/gi, 'Q A')
      .replace(/\bDOB\b/gi, 'Date of Birth')
      .replace(/\bHR\b/g, 'H R')
      .replace(/\bID\b/g, 'I D')
      .replace(/\bVPN\b/gi, 'V P N')
      .replace(/\$/g, ' dollars ')
      .replace(/%/g, ' percent ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const cleanedText = formatTextForPhoneticTTS(text);

  const utterance = new SpeechSynthesisUtterance(cleanedText);

  // Dynamic Prosody & Emotional Voice Modulation
  let targetRate = options?.rate || 0.98;
  let targetPitch = options?.pitch || 1.02;

  if (options?.emotion) {
    const emo = options.emotion.toLowerCase();
    if (emo.includes('frustrated') || emo.includes('impatient') || emo.includes('angry')) {
      targetRate = 1.06;
      targetPitch = 1.08;
    } else if (emo.includes('anxious') || emo.includes('hesitant') || emo.includes('confused') || emo.includes('uncertain')) {
      targetRate = 1.02;
      targetPitch = 1.06;
    } else if (emo.includes('relieved') || emo.includes('validated') || emo.includes('calm') || emo.includes('reassured')) {
      targetRate = 0.94;
      targetPitch = 0.98;
    } else if (emo.includes('warm') || emo.includes('grateful') || emo.includes('delighted')) {
      targetRate = 0.96;
      targetPitch = 1.04;
    }
  }

  utterance.rate = targetRate;
  utterance.pitch = targetPitch;

  // Use locked caller voice if callerKey provided, or algorithm fallback
  const callerKey = options?.callerKey || options?.voiceName || options?.accent || 'default_caller';
  const assignedVoice = getLockedVoiceForCaller(callerKey, options?.accent, options?.voiceName);
  if (assignedVoice) {
    utterance.voice = assignedVoice;
  }

  let hasEnded = false;
  const safeOnEnd = () => {
    if (!hasEnded) {
      hasEnded = true;
      setAiAudioOutputActive(false);
      options?.onEnd?.();
    }
  };

  utterance.onstart = () => {
    setAiAudioOutputActive(true);
    options?.onStart?.();
  };
  utterance.onend = () => safeOnEnd();
  utterance.onerror = (e) => {
    const errorType = (e as any)?.error;
    if (errorType && errorType !== 'canceled' && errorType !== 'interrupted') {
      console.warn('Speech synthesis status:', errorType);
    }
    safeOnEnd();
  };

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    setAiAudioOutputActive(true);
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis launch exception handled gracefully:', err);
    setAiAudioOutputActive(false);
    options?.onEnd?.();
  }
  return utterance;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  setAiAudioOutputActive(false);
}

// Common voice recognition phonetic cleanup rules for call center speech & Gemini 3.6 Flash alignment
export const COMMON_STT_CORRECTIONS = [
  { pattern: /\b(fucks|fucked|fack|facks|fackd|facked|faxd)\b/gi, replacement: 'faxed' },
  { pattern: /\bfactory\b/gi, replacement: 'facts' },
  { pattern: /\bcorrupted\b/gi, replacement: 'corrected' },
  { pattern: /\bemp\s*id\b/gi, replacement: 'Employee ID' },
  { pattern: /\bdob\b/gi, replacement: 'Date of Birth' },
  { pattern: /\bef\s*em\s*el\s*a\b/gi, replacement: 'FMLA' },
  { pattern: /\bupt\b/gi, replacement: 'UPT' },
  { pattern: /\bstd\b/gi, replacement: 'STD' },
  { pattern: /\baich\s*ahr\b/gi, replacement: 'HR' },
  { pattern: /\b(wh\s*380|w\s*h\s*380)\b/gi, replacement: 'WH-380' },
  { pattern: /\b(s\s*s\s*o)\b/gi, replacement: 'SSO' },
  { pattern: /\b(2\s*f\s*a)\b/gi, replacement: '2FA' },
];

export function normalizeRecognizedSpeech(text: string): string {
  if (!text) return '';
  let cleaned = text;

  // 1. Profanity & Phonetic Correction for Fax/Faxed/Faxing misrecognitions in speech
  cleaned = cleaned
    .replace(/\b(fucks|fucked|fack|facks|fackd|facked|faxd|foxed)\b/gi, 'faxed')
    .replace(/\b(faxed|fucks|fucked|facks|facts|fast|fixed)\s+(it|the|over|my|a|this|that|form|document|wh380|wh-380|paper|paperwork|note|doctor|dr)\b/gi, 'faxed $2')
    .replace(/\b(i|we|already|have|had|just|and|then|she|he|they)\s+(fucks|fucked|facks|facked|facts|fast|fixed)\b/gi, '$1 faxed')
    .replace(/\bby\s+(fucks|facked|facts|fast)\b/gi, 'by fax')
    .replace(/\bsent\s+(a\s+)?(fucks|facked|facts|fast)\b/gi, 'sent a fax')
    .replace(/\bvia\s+(fucks|facked|facts)\b/gi, 'via fax');

  // 2. Phonetic corrections for common call center & HR speech mishearings
  cleaned = cleaned
    .replace(/\b(for\s+vacation|bearification|fairification|verifaction|verfication)\b/gi, 'verification')
    .replace(/\b(apple\s+guys|a\s+policy)\b/gi, (match) => (/sorry|understand|feel|apologize/i.test(cleaned) ? 'apologize' : 'policy'))
    .replace(/\bpaul\s+sea\b/gi, 'policy')
    .replace(/\bman\s+a\s+germ\b/gi, 'manager')
    .replace(/\b(emp\s*id|e\s*m\s*p\s*i\s*d)\b/gi, 'Employee ID')
    .replace(/\b(d\s*o\s*b)\b/gi, 'Date of Birth')
    .replace(/\b(e\s*m\s*p)\b/gi, 'EMP')
    .replace(/\b(w\s*h\s*380|wh\s*380)\b/gi, 'WH-380')
    .replace(/\b(e\s*f\s*e\s*m\s*l\s*a|f\s*m\s*l\s*a)\b/gi, 'FMLA')
    .replace(/\b(u\s*p\s*t)\b/gi, 'UPT')
    .replace(/\b(s\s*t\s*d)\b/gi, 'STD')
    .replace(/\b(l\s*t\s*d)\b/gi, 'LTD')
    .replace(/\b(s\s*s\s*o)\b/gi, 'SSO')
    .replace(/\b(2\s*f\s*a)\b/gi, '2FA')
    .replace(/\b(v\s*p\s*n)\b/gi, 'VPN')
    .replace(/\baich\s*ahr\b/gi, 'HR')
    .replace(/\bpay\s+cheque\b/gi, 'paycheck')
    .replace(/\bdouble\s*zero\b/gi, '00')
    .replace(/\btriple\s*zero\b/gi, '000');

  // Spoken digit context normalization
  cleaned = cleaned
    .replace(/\b(for|fore)\b/gi, (match) => (/\d/.test(text) || /id|case|emp|employee|code/i.test(text) ? '4' : match))
    .replace(/\b(to|too)\b/gi, (match) => (/\d/.test(text) || /id|case|emp|employee|code/i.test(text) ? '2' : match))
    .replace(/\b(ate)\b/gi, (match) => (/\d/.test(text) || /id|case|emp|employee|code/i.test(text) ? '8' : match))
    .replace(/\b(won)\b/gi, (match) => (/\d/.test(text) || /id|case|emp|employee|code/i.test(text) ? '1' : match));

  // Contextual word fixes
  cleaned = cleaned
    .replace(/\bfactory\b/gi, (match, offset, string) => {
      if (/check|give|state|case|document|record|the|these|my|all|get/i.test(string)) return 'facts';
      return match;
    })
    .replace(/\bcorrupted\b/gi, (match, offset, string) => {
      if (/record|file|update|statement|info|information|details|got|get|already|been|is|was/i.test(string)) return 'corrected';
      return match;
    });

  // Remove accidental duplicate consecutive words or short phrases from STT stuttering
  cleaned = cleaned.replace(/\b(\w+(?:\s+\w+){0,2})\s+\1\b/gi, '$1');

  // Auto Capitalize First Letter & Smart Question Mark / Period formatting
  cleaned = cleaned.trim();
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    const startsWithQuestion = /^(what|where|when|why|how|can|could|would|is|are|do|does|did|may|will|have|has|should)\b/i.test(cleaned);
    if (!/[.!?]$/.test(cleaned)) {
      cleaned += startsWithQuestion ? '?' : '.';
    }
  }

  return cleaned;
}

export const normalizeSpeechText = normalizeRecognizedSpeech;

// Web Speech API SpeechRecognition wrapper with hardware AEC/Noise Suppression and AI audio output exclusion
export class VoiceRecognizer {
  private recognition: any = null;
  public isListening = false;
  public isAecActive = false;
  private onResultCallback?: (fullText: string, isFinal: boolean) => void;
  private onErrorCallback?: (error: string) => void;
  private accumulatedFinalText = '';
  private hardwareAecStream: MediaStream | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 3;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          // Acoustic AI Output Exclusion Guard: Drop input captured while AI output is active or cooling down
          if (getIsAiAudioOutputActive()) {
            this.accumulatedFinalText = '';
            return;
          }

          let currentSessionFinal = '';
          let activeInterimText = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            let chunk = res[0].transcript;

            // Prioritize alternatives if Web Speech API offers "fax", "faxed", or HR terms
            if (res.length > 1) {
              for (let j = 0; j < res.length; j++) {
                const altText = res[j]?.transcript || '';
                if (/\b(fax|faxed|faxes|faxing)\b/i.test(altText)) {
                  chunk = altText;
                  break;
                }
              }
            }

            if (res.isFinal) {
              currentSessionFinal += (currentSessionFinal ? ' ' : '') + chunk.trim();
            } else {
              activeInterimText += (activeInterimText ? ' ' : '') + chunk.trim();
            }
          }

          if (currentSessionFinal) {
            this.accumulatedFinalText = (this.accumulatedFinalText + ' ' + currentSessionFinal).trim();
          }

          const rawCombined = (this.accumulatedFinalText + ' ' + activeInterimText).trim();
          const combinedText = normalizeRecognizedSpeech(rawCombined);
          const hasFinal = Boolean(currentSessionFinal || this.accumulatedFinalText);

          if (combinedText && !getIsAiAudioOutputActive()) {
            this.onResultCallback?.(combinedText, hasFinal);
          }
        };

        this.recognition.onerror = (event: any) => {
          const err = event.error;
          if (err !== 'no-speech' && err !== 'aborted') {
            console.warn('Speech recognition status:', err);
            this.onErrorCallback?.(err);
          }
        };

        this.recognition.onend = () => {
          if (this.isListening && !getIsAiAudioOutputActive()) {
            try {
              this.recognition.start();
            } catch (e) {
              // Already started
            }
          } else if (this.isListening) {
            // Re-check after decay period
            setTimeout(() => {
              if (this.isListening && !getIsAiAudioOutputActive()) {
                try {
                  this.recognition.start();
                } catch (e) {}
              }
            }, 700);
          } else {
            this.isListening = false;
          }
        };
      }
    }
  }

  // Initialize browser & OS hardware DSP stream for explicit Echo Cancellation & Noise Suppression
  private async ensureHardwareAecStream(): Promise<void> {
    if (this.hardwareAecStream) return;
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },
            channelCount: { ideal: 1 },
            sampleRate: { ideal: 48000 },
            // Vendor specific constraints for WebKit/Blink DSP pipeline
            googEchoCancellation: true,
            googAutoGainControl: true,
            googNoiseSuppression: true,
            googHighpassFilter: true,
          } as any,
        });
        this.hardwareAecStream = stream;
        this.isAecActive = true;
      } catch (err) {
        console.warn('Acoustic Echo Cancellation hardware stream note:', err);
        this.isAecActive = false;
      }
    }
  }

  public setLang(lang: string) {
    if (this.recognition) {
      this.recognition.lang = lang || 'en-US';
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public async start(
    onResult: (fullText: string, isFinal: boolean) => void,
    onError?: (err: string) => void,
    lang?: string
  ) {
    if (!this.recognition) return;
    if (lang) {
      this.recognition.lang = lang;
    }
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.isListening = true;
    this.accumulatedFinalText = '';

    // Guarantee browser mic pipeline runs with hardware Echo Cancellation & Noise Suppression
    await this.ensureHardwareAecStream();

    try {
      this.recognition.abort();
    } catch (e) {
      // Ignore abort error
    }

    if (!getIsAiAudioOutputActive()) {
      try {
        this.recognition.start();
      } catch (e) {
        // Recognition already started
      }
    }
  }

  public stop() {
    this.isListening = false;
    this.onResultCallback = undefined;
    this.accumulatedFinalText = '';

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore stop error
      }
    }

    if (this.hardwareAecStream) {
      this.hardwareAecStream.getTracks().forEach((track) => track.stop());
      this.hardwareAecStream = null;
      this.isAecActive = false;
    }
  }
}

