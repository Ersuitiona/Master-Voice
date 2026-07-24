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

// Advanced Speech Synthesis with natural prosody, natural clause chunking, and neural voice selection
export function speakText(
  text: string,
  options?: {
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

  // Voice Selection Algorithm prioritizing Natural Neural Voices
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    let matchedVoice: SpeechSynthesisVoice | undefined;

    // Search keywords for natural/neural high-quality voice engines
    const preferredKeywords = ['natural', 'neural', 'google', 'online', 'enhanced', 'samantha', 'daniel', 'alex', 'karen', 'victoria', 'serena'];

    // 1. By requested voice name if explicitly provided
    if (options?.voiceName) {
      matchedVoice = voices.find((v) => v.name.toLowerCase().includes(options.voiceName!.toLowerCase()));
    }

    // 2. By accent/language preference with neural voice priority
    if (!matchedVoice && options?.accent) {
      const accentLangMap: Record<string, string> = {
        American: 'en-US',
        British: 'en-GB',
        Australian: 'en-AU',
        Indian: 'en-IN',
        Canadian: 'en-CA',
        Irish: 'en-IE',
      };
      const langCode = accentLangMap[options.accent] || 'en-US';
      const matchingLangVoices = voices.filter((v) => v.lang.startsWith(langCode));

      // Try finding a natural/neural voice among language matches
      matchedVoice = matchingLangVoices.find((v) =>
        preferredKeywords.some((kw) => v.name.toLowerCase().includes(kw))
      );

      if (!matchedVoice && matchingLangVoices.length > 0) {
        matchedVoice = matchingLangVoices[0];
      }
    }

    // 3. Fallback to any natural English neural voice
    if (!matchedVoice) {
      matchedVoice = voices.find(
        (v) => v.lang.startsWith('en') && preferredKeywords.some((kw) => v.name.toLowerCase().includes(kw))
      );
    }

    // 4. Default fallback to first English voice or first system voice
    if (!matchedVoice) {
      matchedVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
  }

  utterance.onstart = () => options?.onStart?.();
  utterance.onend = () => options?.onEnd?.();
  utterance.onerror = (e) => {
    console.error('Speech synthesis error:', e);
    options?.onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Web Speech API SpeechRecognition wrapper with auto-restart and sensitivity tuning
export class VoiceRecognizer {
  private recognition: any = null;
  public isListening = false;
  private onResultCallback?: (transcript: string, isFinal: boolean) => void;
  private onErrorCallback?: (error: string) => void;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 3; // Capture multiple speech interpretations
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptChunk = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptChunk;
            } else {
              interimTranscript += transcriptChunk;
            }
          }

          if (finalTranscript) {
            this.onResultCallback?.(finalTranscript, true);
          } else if (interimTranscript) {
            this.onResultCallback?.(interimTranscript, false);
          }
        };

        this.recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            console.warn('Speech recognition error:', event.error);
            this.onErrorCallback?.(event.error);
          }
        };

        this.recognition.onend = () => {
          // Auto-restart continuous recognition ONLY if listening flag is set AND AI speech synthesis is NOT actively speaking
          const isSpeaking = typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking;
          if (this.isListening && !isSpeaking) {
            try {
              this.recognition.start();
            } catch (e) {
              // Ignore already started exceptions
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
    onResult: (transcript: string, isFinal: boolean) => void,
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
        console.warn('Error stopping recognition:', e);
      }
    }
  }
}

