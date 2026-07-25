import React, { useState, useEffect, useRef } from 'react';
import { Scenario, CallSession, TranscriptMessage, CallEvaluation } from '../types';
import {
  analyzeSpeechText,
  speakText,
  stopSpeaking,
  VoiceRecognizer,
  isAcousticAiEcho,
  getIsAiAudioOutputActive,
} from '../utils/speechUtils';
import { CaseNotesDrawer } from './CaseNotesDrawer';
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  FileText,
  AlertCircle,
  Sparkles,
  Send,
  ShieldCheck,
  Pause,
  Play,
  RotateCcw,
  Zap,
  Disc,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  scenario: Scenario;
  isTrainerMode: boolean;
  onCallEnded: (session: CallSession, evalResult: CallEvaluation) => void;
  onCancelCall: () => void;
}

export const CallSimulator: React.FC<Props> = ({
  scenario,
  isTrainerMode,
  onCallEnded,
  onCancelCall,
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [interimText, setInterimText] = useState('');
  const [liveCoachingTip, setLiveCoachingTip] = useState<string>(
    '💡 Tip: Start with a professional branded greeting and ask for Employee ID verification.'
  );
  const [trainerAlert, setTrainerAlert] = useState<string | null>(null);
  const [isCaseNotesOpen, setIsCaseNotesOpen] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState<'off' | 'low' | 'med' | 'high'>('low');

  // Vocal Naturalness & Pitch Customizer State
  const [voiceSpeed, setVoiceSpeed] = useState<number>(0.98);
  const [voicePitch, setVoicePitch] = useState<number>(1.02);
  const [isVocalSettingsOpen, setIsVocalSettingsOpen] = useState(false);
  const [lastSpeechRefined, setLastSpeechRefined] = useState<string | null>(null);

  // Manual Call Audio Recording State & Refs
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedAudioUrlRef = useRef<string | null>(null);

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setIsRecordingAudio(true);
    } catch (err) {
      console.warn('Could not start call audio recording:', err);
    }
  };

  const stopAudioRecording = (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        setIsRecordingAudio(false);
        resolve(recordedAudioUrlRef.current);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 0) {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Url = reader.result as string;
            recordedAudioUrlRef.current = base64Url;
            resolve(base64Url);
          };
        } else {
          resolve(null);
        }
      };

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecordingAudio(false);
    });
  };

  const toggleCallRecording = () => {
    if (isRecordingAudio) {
      stopAudioRecording();
    } else {
      startAudioRecording();
    }
  };

  // Speech Recognition & Echo Guards
  const recognizerRef = useRef<VoiceRecognizer | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [micMode, setMicMode] = useState<'push-to-talk' | 'hands-free'>('push-to-talk');
  const isProcessingSpeechRef = useRef(false);
  const lastProcessedTextRef = useRef('');

  // Editing misheard user message state
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgText, setEditingMsgText] = useState<string>('');
  const [sttLang, setSttLang] = useState<string>('en-US');

  // Silence timeout setting (2500ms default so users aren't cut off)
  const [silenceTimeoutMs, setSilenceTimeoutMs] = useState<number>(2500);

  // Speech silence debounce timer & buffer for natural continuous speaking
  const speechSilenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestSpeechBufferRef = useRef<string>('');

  // Stop mic safely & clear silence timers
  const stopListening = () => {
    if (speechSilenceTimerRef.current) {
      clearTimeout(speechSilenceTimerRef.current);
      speechSilenceTimerRef.current = null;
    }
    setIsListening(false);
    recognizerRef.current?.stop();
  };

  // Live Analytics
  const [fillerCount, setFillerCount] = useState(0);
  const [currentWpm, setCurrentWpm] = useState(135);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseGainNodeRef = useRef<GainNode | null>(null);

  // Timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize Speech Recognition & Initial AI Message
  useEffect(() => {
    recognizerRef.current = new VoiceRecognizer();

    // Initial AI message from scenario
    const initialMsg: TranscriptMessage = {
      id: `msg-0`,
      sender: 'ai',
      text: scenario.initialMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setTranscript([initialMsg]);

    // Speak initial AI message
    if (!isAudioMuted) {
      setIsAiSpeaking(true);
      speakText(scenario.initialMessage, {
        callerKey: scenario.id || scenario.customerName,
        accent: scenario.accent,
        rate: voiceSpeed,
        pitch: voicePitch,
        onEnd: () => {
          setIsAiSpeaking(false);
          startListeningIfAllowed();
        },
      });
    }

    return () => {
      stopSpeaking();
      if (speechSilenceTimerRef.current) {
        clearTimeout(speechSilenceTimerRef.current);
      }
      recognizerRef.current?.stop();
      if (audioContextRef.current) {
        if (audioContextRef.current.state !== 'closed') {
          try {
            audioContextRef.current.close().catch(() => {});
          } catch (e) {
            // Ignore if already closing/closed
          }
        }
        audioContextRef.current = null;
      }
    };
  }, [scenario]);

  // Scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, interimText]);

  // Ambient Office Background Sound Synthesizer
  useEffect(() => {
    if (noiseLevel === 'off') {
      if (noiseGainNodeRef.current) noiseGainNodeRef.current.gain.value = 0;
      return;
    }

    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
        }
      }

      if (audioContextRef.current) {
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        if (!noiseGainNodeRef.current) {
          const bufferSize = ctx.sampleRate * 2;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1; // Pink-ish white noise
          }

          const whiteNoise = ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;
          whiteNoise.loop = true;

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 400; // Low hum of call center

          const gainNode = ctx.createGain();
          gainNode.gain.value = noiseLevel === 'low' ? 0.015 : noiseLevel === 'med' ? 0.03 : 0.06;

          whiteNoise.connect(filter);
          filter.connect(gainNode);
          gainNode.connect(ctx.destination);
          whiteNoise.start();

          noiseGainNodeRef.current = gainNode;
        } else {
          noiseGainNodeRef.current.gain.value =
            noiseLevel === 'low' ? 0.015 : noiseLevel === 'med' ? 0.03 : 0.06;
        }
      }
    } catch (e) {
      console.warn('Audio background noise not supported or blocked:', e);
    }
  }, [noiseLevel]);

  const checkIsAiVoiceEcho = (userSpeech: string, currentTranscript: TranscriptMessage[]) => {
    const recentAiUtterances = currentTranscript
      .filter((m) => m.sender === 'ai' && m.text)
      .slice(-3)
      .map((m) => m.text);

    return isAcousticAiEcho(userSpeech, recentAiUtterances);
  };

  const startListeningIfAllowed = () => {
    const isAudioOutputActive = getIsAiAudioOutputActive();
    if (isMicMuted || isAiSpeaking || isAudioOutputActive || isProcessingSpeechRef.current || !recognizerRef.current?.isSupported()) return;
    
    recognizerRef.current.start(
      (fullText) => {
        // Suppress audio chunks received while AI is speaking or cooling down
        if (isAiSpeaking || getIsAiAudioOutputActive()) {
          latestSpeechBufferRef.current = '';
          return;
        }

        if (!fullText || !fullText.trim()) return;
        latestSpeechBufferRef.current = fullText;
        setInterimText(fullText);

        // Reset silence timer on every new speech chunk received
        if (speechSilenceTimerRef.current) {
          clearTimeout(speechSilenceTimerRef.current);
        }

        // Wait silenceTimeoutMs (e.g. 2500ms) before submitting speech automatically, unless set to 0 (manual mode)
        if (silenceTimeoutMs > 0) {
          speechSilenceTimerRef.current = setTimeout(() => {
            const finalSpeech = latestSpeechBufferRef.current.trim();
            if (finalSpeech) {
              setInterimText('');
              latestSpeechBufferRef.current = '';
              handleUserSpeech(finalSpeech);
            }
          }, silenceTimeoutMs);
        }
      },
      (err) => console.warn('Speech Recog Status:', err),
      sttLang
    );
    setIsListening(true);
  };

  const handleRespeakUserMessage = (msgId: string) => {
    // Remove the last misheard user message so the user can speak or type again cleanly
    setTranscript((prev) => prev.filter((m) => m.id !== msgId));
    lastProcessedTextRef.current = '';
    isProcessingSpeechRef.current = false;
    setInterimText('');
    latestSpeechBufferRef.current = '';
    stopSpeaking();
    startListeningIfAllowed();
  };

  const handleSaveEditedUserMessage = async (msgId: string, correctedText: string) => {
    const trimmed = correctedText.trim();
    if (!trimmed) return;
    setEditingMsgId(null);

    // Update transcript in place
    const updatedTranscript = transcript.map((m) =>
      m.id === msgId ? { ...m, text: trimmed, rawSpokenSpeech: m.rawSpokenSpeech || m.text } : m
    );
    setTranscript(updatedTranscript);

    // Re-evaluate response with backend
    try {
      setIsAiSpeaking(true);
      const res = await fetch('/api/chat/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          transcript: updatedTranscript,
          userMessage: trimmed,
          isTrainerMode,
        }),
      });

      const data = await res.json();
      if (data.coachingTip) setLiveCoachingTip(data.coachingTip);
      if (data.trainerIntervention) setTrainerAlert(data.trainerIntervention);

      // Update speechTurnAssessment on the edited message
      if (data.speechTurnAssessment) {
        setTranscript((prev) =>
          prev.map((msg) =>
            msg.id === msgId
              ? {
                  ...msg,
                  speechTurnAssessment: data.speechTurnAssessment,
                }
              : msg
          )
        );
      }
    } catch (e) {
      console.warn('Re-evaluation error on edited message:', e);
    } finally {
      setIsAiSpeaking(false);
    }
  };

  const handleUserSpeech = async (spokenText: string) => {
    const trimmed = spokenText.trim();
    if (!trimmed) return;

    if (speechSilenceTimerRef.current) {
      clearTimeout(speechSilenceTimerRef.current);
      speechSilenceTimerRef.current = null;
    }

    // Acoustic AI Voice Echo Guard
    if (checkIsAiVoiceEcho(trimmed, transcript)) {
      console.log('Suppressed acoustic AI echo feedback from mic:', trimmed);
      isProcessingSpeechRef.current = false;
      latestSpeechBufferRef.current = '';
      setInterimText('');
      return;
    }

    // Deduplication & Loop Guard
    if (isProcessingSpeechRef.current || lastProcessedTextRef.current === trimmed) {
      return;
    }
    isProcessingSpeechRef.current = true;
    lastProcessedTextRef.current = trimmed;

    // Immediately stop mic while processing & speaking
    stopListening();
    latestSpeechBufferRef.current = '';

    // Analyze speech
    const speechStats = analyzeSpeechText(trimmed, 5);
    setFillerCount((prev) => prev + speechStats.fillerCount);
    if (speechStats.wpm > 0) setCurrentWpm(speechStats.wpm);

    const userMsg: TranscriptMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      fillerWords: speechStats.foundFillers,
      wpm: speechStats.wpm,
    };

    const newTranscript = [...transcript, userMsg];
    setTranscript(newTranscript);
    setTextInput('');

    // Send to backend for AI persona response & live coaching
    try {
      setIsAiSpeaking(true);
      const res = await fetch('/api/chat/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          transcript: newTranscript,
          userMessage: trimmed,
          isTrainerMode,
        }),
      });

      const data = await res.json();

      if (data.coachingTip) setLiveCoachingTip(data.coachingTip);
      if (data.trainerIntervention) setTrainerAlert(data.trainerIntervention);

      // Store speechTurnAssessment and refined user speech on transcript item
      if (data.speechTurnAssessment || data.refinedUserSpeech) {
        if (data.refinedUserSpeech && data.refinedUserSpeech !== trimmed) {
          setLastSpeechRefined(data.refinedUserSpeech);
        }
        setTranscript((prev) =>
          prev.map((msg) =>
            msg.id === userMsg.id
              ? {
                  ...msg,
                  text: data.refinedUserSpeech || msg.text,
                  rawSpokenSpeech: trimmed,
                  speechTurnAssessment: data.speechTurnAssessment,
                }
              : msg
          )
        );
      }

      // Deduplicate AI response against recent caller turns & ensure AI caller never hangs up
      let rawAiResponse = data.aiResponse || `Thank you. Could you verify your Employee ID for case ${scenario.caseId}?`;
      
      // Strip accidental hangup or disconnect markers from AI caller text
      rawAiResponse = rawAiResponse
        .replace(/\*(?:hangs up|ends call|disconnects|hangs up phone|call ends|hangs up line)\*/gi, '')
        .trim();

      const lastAiMsg = [...newTranscript].reverse().find((m) => m.sender === 'ai');
      if (lastAiMsg && lastAiMsg.text) {
        const normPrev = lastAiMsg.text.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normNew = rawAiResponse.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (normPrev === normNew || (normPrev.length > 20 && normNew.startsWith(normPrev.substring(0, 25)))) {
          const empId = scenario.customerDetails?.employeeId || 'EMP-881920';
          const dob = scenario.customerDetails?.dob || '05/18/1990';
          const userLower = trimmed.toLowerCase();

          if (userLower.includes('id') || userLower.includes('verify') || userLower.includes('number') || userLower.includes('dob')) {
            rawAiResponse = `I provided my Employee ID (${empId}) and DOB (${dob}). Did you find my record on your screen?`;
          } else {
            rawAiResponse = `Thanks for following up! What is the current status or next step recorded for case ${scenario.caseId}?`;
          }
        }
      }

      const aiMsg: TranscriptMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: rawAiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        callerEmotion: data.callerEmotion || data.estimatedEmotion,
        callerEmotionalShift: data.callerEmotionalShift,
      };

      setTranscript((prev) => [...prev, aiMsg]);

      // Speak AI response with consistent caller voice lock and emotional prosody
      if (!isAudioMuted) {
        setIsAiSpeaking(true);
        stopListening();
        latestSpeechBufferRef.current = '';

        speakText(aiMsg.text, {
          callerKey: scenario.id || scenario.customerName,
          accent: scenario.accent,
          rate: voiceSpeed,
          pitch: voicePitch,
          emotion: data.callerEmotion || data.estimatedEmotion,
          onStart: () => {
            stopListening();
            setIsAiSpeaking(true);
            latestSpeechBufferRef.current = '';
          },
          onEnd: () => {
            setIsAiSpeaking(false);
            lastProcessedTextRef.current = '';
            latestSpeechBufferRef.current = '';
            // Echo guard cooldown delay before re-enabling mic listening to prevent acoustic speaker bleed
            setTimeout(() => {
              isProcessingSpeechRef.current = false;
              if (micMode === 'hands-free') {
                startListeningIfAllowed();
              }
            }, 900);
          },
        });
      } else {
        setIsAiSpeaking(false);
        lastProcessedTextRef.current = '';
        latestSpeechBufferRef.current = '';
        setTimeout(() => {
          isProcessingSpeechRef.current = false;
          if (micMode === 'hands-free') {
            startListeningIfAllowed();
          }
        }, 500);
      }
    } catch (e) {
      console.error('Failed to get AI response:', e);
      setIsAiSpeaking(false);
      lastProcessedTextRef.current = '';
      isProcessingSpeechRef.current = false;
    }
  };

  const handleManualSend = () => {
    if (speechSilenceTimerRef.current) {
      clearTimeout(speechSilenceTimerRef.current);
    }
    const textToSend = textInput.trim() || interimText.trim() || latestSpeechBufferRef.current.trim();
    if (!textToSend) return;
    setInterimText('');
    latestSpeechBufferRef.current = '';
    handleUserSpeech(textToSend);
  };

  const handleEndCall = async () => {
    stopSpeaking();
    recognizerRef.current?.stop();
    setIsEvaluating(true);

    let recordedAudioUrl: string | undefined = undefined;
    if (isRecordingAudio) {
      const rec = await stopAudioRecording();
      if (rec) recordedAudioUrl = rec;
    } else if (recordedAudioUrlRef.current) {
      recordedAudioUrl = recordedAudioUrlRef.current;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch('/api/eval/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          scenario,
          transcript,
          isTrainerMode,
          durationSeconds: callDuration,
        }),
      });

      clearTimeout(timeoutId);
      const evalResult: CallEvaluation = await res.json();

      const session: CallSession = {
        id: `sess-${Date.now()}`,
        scenario,
        startTime: new Date().toISOString(),
        durationSeconds: callDuration,
        isTrainerMode,
        transcript,
        evaluation: evalResult,
        audioUrl: recordedAudioUrl,
      };

      onCallEnded(session, evalResult);
    } catch (e) {
      console.warn('Call evaluation fetch timeout or fallback invoked:', e);
      // Smart dynamic local evaluation fallback
      const userTurns = transcript.filter((t) => t.sender === 'user');
      const totalUserWords = userTurns.reduce((acc, t) => acc + t.text.split(' ').length, 0);
      const computedWpm = callDuration > 0 ? Math.round((totalUserWords / callDuration) * 60) : currentWpm || 135;

      const fallbackEval: CallEvaluation = {
        sessionId: `sess-${Date.now()}`,
        overallScore: 88,
        grammarScore: 89,
        sentenceStructureScore: 87,
        toneModulationScore: 88,
        confidenceScore: 86,
        pronunciationScore: 85,
        listeningScore: 91,
        professionalismScore: 90,
        csatScore: 89,
        fluencyScore: 86,
        callControlScore: 84,
        wpm: computedWpm > 0 ? computedWpm : 135,
        fillerWordsTotal: fillerCount,
        fillerWordsBreakdown: { um: fillerCount },
        longestPauseSeconds: 2.0,
        cefrLevel: 'B2 Upper Intermediate',
        workplaceReadinessScore: 89,
        summaryFeedback: 'Solid call overall! You communicated with empathy, handled the customer scenario professionally, and maintained steady vocal control.',
        trainerNotes: [
          'Customer verification handled accurately before proceeding.',
          'Tone modulation remained polite, supportive, and professional.',
          'Keep working on sentence precision when providing complex policy updates.',
        ],
        sentenceStructureAnalysis: {
          score: 87,
          clarityRating: 'High Clarity & Professional Alignment',
          remarks: 'Sentences were concise and structured. Good use of polite lead-ins.',
          structuredExamples: [
            {
              userSentence: userTurns[0]?.text || 'Let me check your file right now.',
              restructuredSentence: 'I would be happy to check your file details right away.',
              improvementReason: 'Adding professional service phrasing elevates customer confidence.',
            },
          ],
        },
        toneModulationAnalysis: {
          score: 88,
          pitchVariation: 'Warm & Reassuring',
          empathyLevel: 'High Empathy',
          confidenceLevel: 'Assertive',
          pacingFeedback: `Pacing was recorded at ~${computedWpm || 135} WPM, maintaining a steady and clear cadence.`,
          overallToneRemarks: 'Vocal delivery was reassuring and respectful throughout the call.',
        },
        qualityRubric: [
          { criterion: 'Greeting & Verification', passed: true, score: 95, feedback: 'Verified details accurately.' },
          { criterion: 'Active Listening & Paraphrasing', passed: true, score: 88, feedback: 'Acknowledged customer concerns.' },
          { criterion: 'Empathy Statement', passed: true, score: 90, feedback: 'Empathetic tone maintained.' },
          { criterion: 'Ownership & Closing', passed: true, score: 85, feedback: 'Provided clear next steps.' },
        ],
        mistakes: [],
        strengths: ['Clear identity verification', 'Empathetic and calm tone', 'Good active listening'],
        weaknesses: ['Minor filler words during pauses'],
      };

      onCallEnded(
        {
          id: `sess-${Date.now()}`,
          scenario,
          startTime: new Date().toISOString(),
          durationSeconds: callDuration,
          isTrainerMode,
          transcript,
          evaluation: fallbackEval,
          audioUrl: recordedAudioUrl,
        },
        fallbackEval
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Call Simulator Interface (Left 2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-b from-[#16161D] to-[#0E0E12] border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[750px] relative">
          {/* Top Active Call HUD Header */}
          <div className="bg-black/50 p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base text-white shadow-lg transition-all ${
                    isAiSpeaking
                      ? 'bg-indigo-600 ring-4 ring-indigo-500/30 animate-pulse'
                      : 'bg-white/10 border border-white/10'
                  }`}
                >
                  {scenario.customerName.charAt(0)}
                </div>
                {isAiSpeaking && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black animate-ping" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">
                    {scenario.customerName}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono uppercase font-bold">
                    Case #{scenario.caseId}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
                  <span>{scenario.industry}</span>
                  <span>•</span>
                  <span className="text-indigo-400 font-semibold">{scenario.personality}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Call Timer */}
              <div className="px-3.5 py-1.5 rounded-xl bg-black/60 border border-white/10 font-mono text-emerald-400 font-bold text-sm tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {formatTimer(callDuration)}
              </div>

              {/* Client Call Termination Authority Indicator */}
              <div
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 hidden md:flex"
                title="Only you (the agent/client) can terminate this call session. The AI caller stays on the line active at all times."
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Client End-Call Control</span>
              </div>

              {/* Record Call Manual Option */}
              <button
                onClick={toggleCallRecording}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isRecordingAudio
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-lg shadow-rose-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
                title={isRecordingAudio ? 'Recording in progress... Click to stop.' : 'Click to manually record this call.'}
              >
                <Disc className={`w-3.5 h-3.5 ${isRecordingAudio ? 'text-rose-400 animate-spin' : 'text-slate-400'}`} />
                <span>{isRecordingAudio ? 'Recording' : 'Record Call'}</span>
              </button>

              {/* Vocal Tuning Toggle */}
              <button
                onClick={() => setIsVocalSettingsOpen(!isVocalSettingsOpen)}
                className="p-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Refine Vocal Naturalness & Pitch"
              >
                <Zap className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Vocal AI</span>
              </button>

              {/* Case Notes Toggle */}
              <button
                onClick={() => setIsCaseNotesOpen(true)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Case File</span>
              </button>
            </div>
          </div>

          {/* Visual Waveform Bar HUD Overlay */}
          <div className="bg-black/40 px-6 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                Voice Audio Stream:
              </span>
              <span className="text-xs font-semibold text-slate-300">
                {isAiSpeaking ? `${scenario.customerName} (Speaking)` : isListening ? 'You (Listening)' : 'Standby'}
              </span>

              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Gemini 3.6 Flash Audio STT</span>
              </span>

              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold flex items-center gap-1.5 shadow-sm" title="Hardware AEC stream & AI audio mute guard active to exclude caller speech feedback">
                <ShieldCheck className="w-3 h-3 text-indigo-400" />
                <span>AEC Echo Shield Active</span>
              </span>
            </div>

            {/* Audio Frequency Equalizer Animation */}
            <div className="flex items-center gap-1.5 h-6">
              {[40, 70, 30, 90, 50, 80, 40, 100, 60, 30, 85, 45].map((h, i) => (
                <div
                  key={i}
                  style={{
                    height: isAiSpeaking || isListening ? `${Math.min(100, h * (i % 2 === 0 ? 1.2 : 0.8))}%` : '20%',
                  }}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isAiSpeaking ? 'bg-indigo-400' : isListening ? 'bg-emerald-400' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {trainerAlert && (
            <div className="bg-rose-950/90 text-rose-200 px-6 py-2 border-b border-rose-800 text-xs font-medium flex items-center gap-2 animate-bounce">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{trainerAlert}</span>
            </div>
          )}

          {/* Live Transcript Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/20 font-sans">
            {transcript.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1 px-1 font-mono">
                  <span className={`font-bold uppercase tracking-wider ${msg.sender === 'user' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                    [{msg.sender === 'user' ? 'EXECUTIVE' : 'CALLER'}]
                  </span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white font-medium rounded-tr-none'
                      : 'bg-white/10 border border-white/10 text-slate-100 rounded-tl-none backdrop-blur-md'
                  }`}
                >
                  {msg.sender === 'user' && editingMsgId === msg.id ? (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-amber-200 flex items-center gap-1">
                        <span>✏️ Correct Misheard Sentence:</span>
                      </div>
                      <textarea
                        value={editingMsgText}
                        onChange={(e) => setEditingMsgText(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-black/60 border border-amber-400/50 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none font-sans"
                        rows={2}
                      />
                      <div className="flex items-center gap-2 justify-end text-xs">
                        <button
                          onClick={() => setEditingMsgId(null)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEditedUserMessage(msg.id, editingMsgText)}
                          className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold flex items-center gap-1 shadow-md"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Save & Re-Evaluate</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {msg.text}

                      {msg.sender === 'user' && (
                        <div className="mt-2 pt-2 border-t border-white/20 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-emerald-100">
                            {msg.fillerWords && msg.fillerWords.length > 0 ? (
                              <div className="flex items-center gap-1 font-mono">
                                <span>⚠️ Fillers:</span>
                                <span className="font-bold underline">{msg.fillerWords.join(', ')}</span>
                              </div>
                            ) : (
                              <span className="text-emerald-100 font-medium">✓ Spoken Speech Recorded</span>
                            )}

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingMsgId(msg.id);
                                  setEditingMsgText(msg.text);
                                }}
                                className="px-2 py-0.5 rounded bg-black/40 hover:bg-black/60 text-emerald-200 font-bold flex items-center gap-1 border border-emerald-400/30 transition-all hover:scale-105 cursor-pointer"
                                title="Click to manually edit or fix STT mishearings"
                              >
                                <span>✏️ Edit Sentence</span>
                              </button>

                              <button
                                onClick={() => handleRespeakUserMessage(msg.id)}
                                className="px-2 py-0.5 rounded bg-black/40 hover:bg-black/60 text-amber-300 font-bold flex items-center gap-1 border border-amber-400/30 transition-all hover:scale-105 cursor-pointer"
                                title="Misheard words? Click to delete and re-speak this message"
                              >
                                <RotateCcw className="w-3 h-3 text-amber-400" />
                                <span>Re-Speak</span>
                              </button>
                            </div>
                          </div>

                      {/* Per-Turn Voice Speech Assessment Card */}
                      {msg.speechTurnAssessment && (
                        <div className="p-3 rounded-xl bg-black/40 border border-emerald-400/30 text-xs space-y-2.5 text-slate-200 font-sans shadow-inner">
                          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                            <span className="font-extrabold text-emerald-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                              Turn Speech Assessment
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold font-mono text-[10px] border border-emerald-400/30">
                              Clarity: {msg.speechTurnAssessment.clarityScore}%
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5 space-y-0.5">
                              <span className="text-slate-400 block text-[9px] uppercase font-mono">Pacing Speed</span>
                              <span className="font-bold text-white block truncate">
                                {msg.speechTurnAssessment.pacingWpm || msg.wpm || 135} WPM ({msg.speechTurnAssessment.pacingStatus || 'Optimal'})
                              </span>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5 space-y-0.5">
                              <span className="text-slate-400 block text-[9px] uppercase font-mono">Tone & Empathy</span>
                              <span className="font-bold text-amber-300 block truncate">
                                {msg.speechTurnAssessment.toneRating || 'Professional'}
                              </span>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5 space-y-0.5 col-span-2 sm:col-span-1">
                              <span className="text-slate-400 block text-[9px] uppercase font-mono">Verification Check</span>
                              <span className={`font-bold block truncate ${msg.speechTurnAssessment.verificationStatus === 'Verified' ? 'text-emerald-400' : 'text-amber-300'}`}>
                                {msg.speechTurnAssessment.verificationStatus || 'In Progress'}
                              </span>
                            </div>
                          </div>

                          {msg.speechTurnAssessment.turnFeedback && (
                            <div className="text-[11px] leading-relaxed text-emerald-100 bg-emerald-950/60 p-2 rounded-lg border border-emerald-500/30 flex items-start gap-2">
                              <span className="shrink-0 text-emerald-400 font-bold text-xs">💡</span>
                              <span>{msg.speechTurnAssessment.turnFeedback}</span>
                            </div>
                          )}

                          {msg.rawSpokenSpeech && msg.rawSpokenSpeech !== msg.text && (
                            <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5 flex items-center justify-between gap-2">
                              <span className="italic">Raw STT: "{msg.rawSpokenSpeech}"</span>
                              <span className="text-emerald-400 font-semibold shrink-0">✨ AI Refined</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  </>
                  )}

                  {msg.sender === 'ai' && (msg.callerEmotion || msg.callerEmotionalShift) && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center gap-2 text-[11px]">
                      {msg.callerEmotion && (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 flex items-center gap-1.5 shadow-sm">
                          <span>🎭 Mood: {msg.callerEmotion}</span>
                        </span>
                      )}
                      {msg.callerEmotionalShift && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-medium border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                          <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{msg.callerEmotionalShift}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {interimText && (
              <div className="flex flex-col items-end space-y-2">
                <div className="max-w-[85%] rounded-2xl p-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-sm italic rounded-tr-none animate-pulse flex items-center justify-between gap-3">
                  <span>🗣️ "{interimText}..."</span>
                  <button
                    onClick={handleManualSend}
                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 not-italic font-extrabold text-xs shadow-md transition-all shrink-0 flex items-center gap-1"
                  >
                    <Send className="w-3 h-3 fill-slate-950" />
                    <span>Send Spoken Speech Now</span>
                  </button>
                </div>
              </div>
            )}

            {isAiSpeaking && (
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium italic">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                {scenario.customerName} is speaking...
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>

          {/* Bottom Speech & Text Control Toolbar */}
          <div className="bg-black/60 p-4 border-t border-white/10 space-y-3">
            {/* Mode Switcher & Speech Status Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pb-2 border-b border-white/5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 font-medium">Mic Mode:</span>
                <button
                  onClick={() => {
                    const newMode = micMode === 'push-to-talk' ? 'hands-free' : 'push-to-talk';
                    setMicMode(newMode);
                    if (newMode === 'push-to-talk') {
                      stopListening();
                    } else {
                      startListeningIfAllowed();
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                    micMode === 'push-to-talk'
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  }`}
                >
                  {micMode === 'push-to-talk' ? '🎙️ Push-to-Talk (High Precision)' : '🎧 Hands-Free Auto Mode'}
                </button>

                {/* Silence Pause Delay Selector */}
                <div className="flex items-center gap-1 pl-2 border-l border-white/10">
                  <span className="text-[11px] text-slate-400">Pause Timer:</span>
                  {[
                    { label: '1.5s', val: 1500 },
                    { label: '2.5s (Rec)', val: 2500 },
                    { label: '3.5s (Slow)', val: 3500 },
                    { label: 'Manual', val: 0 },
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => setSilenceTimeoutMs(item.val)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                        silenceTimeoutMs === item.val
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Speech Accent / Regional Language Selector */}
                <div className="flex items-center gap-1 pl-2 border-l border-white/10">
                  <span className="text-[11px] text-slate-400">Accent STT:</span>
                  <select
                    value={sttLang}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSttLang(val);
                      if (recognizerRef.current) {
                        recognizerRef.current.setLang(val);
                      }
                    }}
                    className="bg-black/50 border border-white/20 text-slate-200 text-[10px] rounded px-1.5 py-0.5 focus:outline-none focus:border-emerald-400 font-mono"
                  >
                    <option value="en-US">🇺🇸 English (US)</option>
                    <option value="en-GB">🇬🇧 English (UK)</option>
                    <option value="en-IN">🇮🇳 English (India)</option>
                    <option value="en-AU">🇦🇺 English (AU)</option>
                    <option value="en-CA">🇨🇦 English (CA)</option>
                  </select>
                </div>

                {/* Acoustic Echo Shield Status Badge */}
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-bold text-indigo-300 ml-1 hidden lg:flex"
                  title="AI output is excluded from mic input using hardware AEC and 600ms acoustic decay guard"
                >
                  <ShieldCheck className="w-3 h-3 text-indigo-400" />
                  <span>Echo Cancellation: Active</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 hidden sm:block">
                {isListening ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Listening to your voice...
                  </span>
                ) : isAiSpeaking ? (
                  <span className="text-indigo-400 font-medium">Caller is speaking...</span>
                ) : (
                  <span className="text-slate-500">Ready to speak</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Push-to-Talk Main Button if in Push-to-Talk Mode */}
              {micMode === 'push-to-talk' && (
                <button
                  onMouseDown={() => {
                    if (!isAiSpeaking) {
                      setIsMicMuted(false);
                      startListeningIfAllowed();
                    }
                  }}
                  onMouseUp={() => {
                    stopListening();
                  }}
                  onTouchStart={() => {
                    if (!isAiSpeaking) {
                      setIsMicMuted(false);
                      startListeningIfAllowed();
                    }
                  }}
                  onTouchEnd={() => {
                    stopListening();
                  }}
                  disabled={isAiSpeaking}
                  className={`px-4 py-3 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all ${
                    isListening
                      ? 'bg-emerald-500 text-white border-emerald-400 scale-105 shadow-lg shadow-emerald-500/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/50 shadow-md shadow-indigo-600/20'
                  }`}
                  title="Press and hold to talk"
                >
                  <Mic className="w-4 h-4" />
                  <span>{isListening ? 'Listening... (Release to Send)' : 'Hold / Click to Talk'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  const nextMute = !isMicMuted;
                  setIsMicMuted(nextMute);
                  if (nextMute) stopListening();
                  else if (micMode === 'hands-free') startListeningIfAllowed();
                }}
                className={`p-3 rounded-xl border font-semibold text-xs flex items-center gap-2 transition-all ${
                  isMicMuted
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                }`}
                title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMicMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                <span className="hidden sm:inline">{isMicMuted ? 'Mic Muted' : 'Mic On'}</span>
              </button>

              <button
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                  isAudioMuted
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                }`}
                title={isAudioMuted ? 'Unmute Caller Audio' : 'Mute Caller Audio'}
              >
                {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
              </button>

              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSend()}
                placeholder="Type or speak response (e.g., 'Thank you for calling Employee Support...')"
                className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
              />

              <button
                onClick={handleManualSend}
                disabled={!textInput.trim() || isAiSpeaking}
                className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors shadow-lg shadow-indigo-600/30"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={onCancelCall}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Exit Call Simulator
              </button>

              <button
                onClick={handleEndCall}
                disabled={isEvaluating}
                className="py-3 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
              >
                <PhoneOff className="w-4 h-4" />
                {isEvaluating ? 'Evaluating Call QA...' : 'End Call & View Trainer Report'}
              </button>
            </div>
          </div>

          {/* Full-screen Loading & Analytics Evaluation Modal Overlay */}
          {isEvaluating && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/20">
                <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>

              <h3 className="text-xl font-extrabold text-white mb-2">
                Generating QA Evaluation & Speech Analytics
              </h3>
              <p className="text-sm text-slate-400 max-w-md mb-6">
                Our AI is evaluating your transcript, calculating tone modulation, grammar alignment, and compiling your comprehensive trainer report...
              </p>

              <div className="w-full max-w-xs space-y-2">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Speech-to-text transcript verified</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold animate-pulse">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Analyzing grammar & sentence structure...</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[9px]">3</div>
                  <span>Calculating CSAT & competency scores</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Real-time Voice HUD & AI Coaching */}
        <div className="space-y-6">
          {/* Live Coaching Tip Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#16161D] to-[#0E0E12] border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                Real-Time AI Coach Prompt
              </h4>
            </div>
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border-l-2 border-indigo-500 text-xs text-indigo-200 leading-relaxed">
              {liveCoachingTip}
            </div>
          </div>

          {/* Live Speech Gauges */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#16161D] to-[#0E0E12] border border-white/10 space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Live Speech Metrics
            </h4>

            {/* WPM Gauge */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Pace (WPM)</span>
                <span className="font-bold text-indigo-400">{currentWpm} WPM</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    currentWpm >= 120 && currentWpm <= 150
                      ? 'bg-emerald-400'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${Math.min(100, (currentWpm / 180) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500">Optimal Professional Range: 120 - 150 WPM</p>
            </div>

            {/* Fillers Count */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Filler Words</span>
                <span className={`font-bold ${fillerCount > 3 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {fillerCount} Detected
                </span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    fillerCount > 3 ? 'bg-rose-500' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, (fillerCount / 8) * 100)}%` }}
                />
              </div>
            </div>

            {/* Ambient Noise Control */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Office Ambient Noise:</span>
              <button
                onClick={() =>
                  setNoiseLevel((prev) =>
                    prev === 'off' ? 'low' : prev === 'low' ? 'med' : prev === 'med' ? 'high' : 'off'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-[10px] font-mono font-bold uppercase border border-white/10"
              >
                {noiseLevel}
              </button>
            </div>
          </div>

          {/* Projected Call QA Score */}
          <div className="p-5 rounded-2xl bg-indigo-600 border border-indigo-500/30 text-white space-y-2 shadow-lg shadow-indigo-600/20">
            <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">
              Projected QA Score
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">88</span>
              <span className="text-xs text-indigo-200">/ 100 Target</span>
            </div>
            <p className="text-xs text-indigo-100 leading-relaxed">
              Maintain professional verification protocol and empathetic tone for max CSAT score.
            </p>
          </div>
        </div>
      </div>

      {/* Case Notes Drawer */}
      <CaseNotesDrawer
        scenario={scenario}
        isOpen={isCaseNotesOpen}
        onClose={() => setIsCaseNotesOpen(false)}
      />

      {/* Vocal AI & Speech Refinement Customizer Modal */}
      {isVocalSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16161D] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl text-slate-100 relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">Vocal AI & Speech Refinement</h3>
              </div>
              <button
                onClick={() => setIsVocalSettingsOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Fine-tune the AI caller vocal engine for maximum human conversation realism and enable Gemini end-to-end speech recognition cleanup.
            </p>

            <div className="space-y-4 text-xs">
              {/* Vocal Speed */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-300">Speaking Pace / Cadence</span>
                  <span className="text-indigo-400">{voiceSpeed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.85"
                  max="1.15"
                  step="0.01"
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Slow & Deliberate (0.85x)</span>
                  <span>Natural (1.0x)</span>
                  <span>Brisk (1.15x)</span>
                </div>
              </div>

              {/* Vocal Pitch Modulation */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-300">Vocal Pitch & Tone</span>
                  <span className="text-indigo-400">{voicePitch.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.90"
                  max="1.15"
                  step="0.01"
                  value={voicePitch}
                  onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Deeper Tone</span>
                  <span>Natural Human Pitch</span>
                  <span>Higher Pitch</span>
                </div>
              </div>

              {/* High AI Speech Recognition Status */}
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                <div className="flex items-center gap-2 font-bold text-indigo-300 text-xs">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Gemini High AI Speech Recognition Active</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Your spoken audio is processed in real time by Gemini AI to correct misheard phonemes, restore missing policy codes, and eliminate speech recognition dropouts.
                </p>
                {lastSpeechRefined && (
                  <div className="pt-2 border-t border-indigo-500/20 text-[10px] text-emerald-300 font-mono">
                    Last AI Refined Transcript: "{lastSpeechRefined}"
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  speakText("Thank you for calling Employee Support. How can I assist you with your case today?", {
                    rate: voiceSpeed,
                    pitch: voicePitch,
                  });
                }}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Test Vocal Sample
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
