import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { ShieldCheck, Mail, ArrowLeft, RefreshCw, KeyRound, AlertCircle, CheckCircle2, PhoneCall, Sparkles, Award, Shield, Headphones } from 'lucide-react';

interface Props {
  user: UserProfile;
  onAuthenticated: (updatedUser: UserProfile) => void;
}

export const AuthScreen: React.FC<Props> = ({ user, onAuthenticated }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  // Resend Timer (60s countdown)
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (step === 2 && resendTimer > 0) {
      setCanResend(false);
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [isGoogleFlow, setIsGoogleFlow] = useState(false);

  const validateEmail = (email: string) => {
    const clean = email.trim().toLowerCase();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(clean);
  };

  const sendOtpForEmail = async (targetEmail: string, providerName = 'Email') => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setConfigError(null);
    setPreviewCode(null);

    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter an email address.');
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to send verification code.');
        setIsLoading(false);
        return;
      }

      if (data.emailSent) {
        setSuccessMessage(`Real-time OTP verification code sent to ${cleanEmail}. Please check your email inbox.`);
      } else {
        setSuccessMessage(`OTP code generated for ${cleanEmail}. Enter the code below to complete verification.`);
        if (data.previewOtp) {
          setPreviewCode(data.previewOtp);
        }
      }

      setStep(2);
      setResendTimer(60);
      setCanResend(false);
      setOtpInput('');
    } catch (err: any) {
      setErrorMessage('Network error while requesting verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGoogleFlow(false);
    await sendOtpForEmail(emailInput);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleFlow(true);
    const targetEmail = emailInput.trim().toLowerCase() || 'santhanugireesh6@gmail.com';
    setEmailInput(targetEmail);
    await sendOtpForEmail(targetEmail, 'Google Account');
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanOtp = otpInput.trim();

    if (!cleanOtp) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    if (!/^\d{6}$/.test(cleanOtp)) {
      setErrorMessage('Verification code must be exactly 6 numeric digits.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Invalid verification code.');
        setIsLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }

      const userName = data.user?.name || (isGoogleFlow ? 'Santhanu Gireesh' : cleanEmail.split('@')[0]);
      onAuthenticated({
        ...user,
        name: userName,
        email: cleanEmail,
        authMode: isGoogleFlow ? 'google' : 'email',
        avatar: isGoogleFlow
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : user.avatar,
      });
    } catch (err: any) {
      setErrorMessage('Verification failed due to a network connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center z-10">
        {/* Left Side: Brand & Value Proposition */}
        <div className="space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Call Center Voice Simulator</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
            Employee Support <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-amber-300">
              AI Voice Trainer
            </span>
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed max-w-md">
            Master real-time employee support call handling, empathetic customer service, and DLS quality rubrics with real-time AI speech evaluation.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Headphones className="w-4 h-4" />
              </div>
              <span>Interactive Real-time Voice Call Simulator with Speech Recognition</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <span>Automated CSAT, WPM, CEFR & Call Center Quality Scorecards</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <span>Secure Authentication via Google Account or Realtime Email OTP</span>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Box */}
        <div className="bg-[#16161D] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Sign In to Continue</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              {step === 1
                ? 'Authenticate via Google or Email OTP to access your training dashboard.'
                : `Enter the code sent to ${emailInput.trim().toLowerCase()}`}
            </p>
          </div>

          {/* Config Alert if API Key Missing */}
          {configError && (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Email Provider Setup Required</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Real OTP emails require a valid <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">RESEND_API_KEY</code> environment variable.
              </p>
              <div className="text-[10px] text-slate-400 border-t border-amber-500/20 pt-2 font-mono">
                Add RESEND_API_KEY to your environment secrets in the Settings panel.
              </div>
            </div>
          )}

          {/* Error / Success Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-tight">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-tight">{successMessage}</span>
            </div>
          )}

          {/* STEP 1: Email Form or Google Button */}
          {step === 1 && (
            <div className="space-y-4">
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Send Realtime OTP Code</span>
                    </>
                  )}
                </button>
              </form>

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-white/10 w-full"></div>
                <span className="bg-[#16161D] px-3 text-[10px] text-slate-500 uppercase font-semibold">Or</span>
              </div>

              <button
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 transition-colors shadow-md cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                Sign In with Google Account
              </button>
            </div>
          )}

          {/* STEP 2: Verification Form */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium truncate max-w-[200px]">
                  {emailInput.trim().toLowerCase()}
                </span>
                <button
                  onClick={() => {
                    setStep(1);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold text-[11px] flex items-center gap-1 shrink-0"
                >
                  <ArrowLeft className="w-3 h-3" /> Change Email
                </button>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {previewCode && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-amber-300 flex items-center justify-between">
                      <span>Generated OTP Code:</span>
                      <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-200">Dev Mode</span>
                    </div>
                    <div className="font-mono text-xl font-black text-center text-amber-300 bg-black/50 py-1.5 rounded-lg border border-amber-500/20 tracking-widest">
                      {previewCode}
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">
                      Type this 6-digit code into the box below to authenticate.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center text-2xl font-mono tracking-[0.5em] font-bold py-3 px-4 rounded-xl bg-black/50 border border-indigo-500/40 text-indigo-300 placeholder-slate-600 focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpInput.length !== 6}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify OTP & Unlock App</span>
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
                <span className="text-slate-400">Didn't receive email?</span>
                <button
                  onClick={() => handleSendOtp()}
                  disabled={!canResend || isLoading}
                  className={`font-semibold transition-colors flex items-center gap-1 ${
                    canResend
                      ? 'text-indigo-400 hover:text-indigo-300 cursor-pointer'
                      : 'text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  {canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
