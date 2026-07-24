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

// Advanced Speech Synthesis with natural prosody and caller voice locking
export function speakText(
  text: string,
  options?: {
    callerKey?: string;
    voiceName?: string;
    rate?: number; // 0.8 - 1.2
    pitch?: number; // 0.8 - 1.2
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

  // Clean text for natural speech (remove technical symbols, format numbers/abbreviations)
  const cleanedText = text
    .replace(/ID/g, 'I D')
    .replace(/FMLA/g, 'F M L A')
    .replace(/HR/g, 'H R')
    .replace(/STD/g, 'S T D')
    .replace(/UPT/g, 'U P T')
    .replace(/\$/g, 'dollars ');

  const utterance = new SpeechSynthesisUtterance(cleanedText);
  // Natural humanlike speed: default around 0.98 for clear natural cadence
  utterance.rate = options?.rate || 0.98;
  utterance.pitch = options?.pitch || 1.02; // Subtle natural pitch modulation

  // Use locked caller voice if callerKey provided, or algorithm fallback
  const callerKey = options?.callerKey || options?.voiceName || options?.accent || 'default_caller';
  const assignedVoice = getLockedVoiceForCaller(callerKey, options?.accent, options?.voiceName);
  if (assignedVoice) {
    utterance.voice = assignedVoice;
  }

  utterance.onstart = () => options?.onStart?.();
  utterance.onend = () => options?.onEnd?.();
  utterance.onerror = (e) => {
    const errorType = (e as any)?.error;
    if (errorType && errorType !== 'canceled' && errorType !== 'interrupted') {
      console.warn('Speech synthesis status:', errorType);
    }
    options?.onEnd?.();
  };

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis launch exception handled gracefully:', err);
    options?.onEnd?.();
  }
  return utterance;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Common voice recognition phonetic cleanup rules for call center speech
export function normalizeRecognizedSpeech(text: string): string {
  if (!text) return '';
  let cleaned = text;

  // Clean common misheard call-center phrases and spoken digits
  cleaned = cleaned
    .replace(/\b(for|fore)\b/gi, (match, p1, offset) => {
      // replace if surrounded by digits or ID keywords
      return /\d/.test(text) ? '4' : match;
    })
    .replace(/\bemp id\b/gi, 'Employee ID')
    .replace(/\bemployee id is\b/gi, 'Employee ID is')
    .replace(/\bdob\b/gi, 'Date of Birth')
    .replace(/\bfmla\b/gi, 'FMLA')
    .replace(/\bupt\b/gi, 'UPT')
    .replace(/\bstd\b/gi, 'STD')
    .replace(/\bhr\b/gi, 'HR');

  return cleaned.trim();
}

// Web Speech API SpeechRecognition wrapper with continuous sentence buffering and smooth pause handling
export class VoiceRecognizer {
  private recognition: any = null;
  public isListening = false;
  private onResultCallback?: (fullText: string, isFinal: boolean) => void;
  private onErrorCallback?: (error: string) => void;

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
          let completeFinalText = '';
          let activeInterimText = '';

          for (let i = 0; i < event.results.length; ++i) {
            const res = event.results[i];
            const chunk = res[0].transcript;
            if (res.isFinal) {
              completeFinalText += (completeFinalText ? ' ' : '') + chunk.trim();
            } else {
              activeInterimText += (activeInterimText ? ' ' : '') + chunk.trim();
            }
          }

          const combinedText = normalizeRecognizedSpeech(
            (completeFinalText + ' ' + activeInterimText).trim()
          );
          const hasFinal = Boolean(completeFinalText);

          if (combinedText) {
            this.onResultCallback?.(combinedText, hasFinal);
          }
        };

        this.recognition.onerror = (event: any) => {
          const err = event.error;
          if (err !== 'no-speech' && err !== 'aborted') {
            console.warn('Speech recognition error:', err);
            this.onErrorCallback?.(err);
          }
        };

        this.recognition.onend = () => {
          const isSpeaking =
            typeof window !== 'undefined' &&
            window.speechSynthesis &&
            window.speechSynthesis.speaking;

          if (this.isListening && !isSpeaking) {
            try {
              this.recognition.start();
            } catch (e) {
              // Already started
            }
          } else {
            this.isListening = false;
          }
        };
      }
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public start(
    onResult: (fullText: string, isFinal: boolean) => void,
    onError?: (err: string) => void
  ) {
    if (!this.recognition) return;
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.isListening = true;
    try {
      this.recognition.start();
    } catch (e) {
      // Recognition already started or busy
    }
  }

  public stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore stop error
      }
    }
  }
}

