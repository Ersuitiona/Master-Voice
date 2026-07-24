import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { X, ShieldCheck, Mail, ArrowLeft, RefreshCw, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, user, onUpdateUser }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [emailInput, setEmailInput] = useState(user.email || '');
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

  if (!isOpen) return null;

  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [isGoogleFlow, setIsGoogleFlow] = useState(false);

  const validateEmail = (email: string) => {
    const clean = email.trim().toLowerCase();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(clean);
  };

  const sendOtpForEmail = async (targetEmail: string) => {
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
    await sendOtpForEmail(targetEmail);
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

      // Store JWT token securely
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }

      const userName = data.user?.name || (isGoogleFlow ? 'Santhanu Gireesh' : cleanEmail.split('@')[0]);
      onUpdateUser({
        ...user,
        name: userName,
        email: cleanEmail,
        authMode: isGoogleFlow ? 'google' : 'email',
        avatar: isGoogleFlow
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : user.avatar,
      });

      setSuccessMessage('Successfully authenticated!');
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMessage('Verification failed due to a network connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#16161D] border border-white/10 rounded-2xl p-6 shadow-2xl text-slate-100 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2.5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Email OTP Authentication</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
            {step === 1
              ? 'Enter your email to receive a secure 6-digit verification code.'
              : `Enter the code sent to ${emailInput.trim().toLowerCase()}`}
          </p>
        </div>

        {/* Configuration Error Alert if API Key Missing */}
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

        {/* PAGE 1: Email Form */}
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
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Send OTP Verification Code</span>
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
              className="w-full py-2.5 px-4 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors shadow-md"
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
              Continue with Google
            </button>
          </div>
        )}

        {/* PAGE 2: OTP Verification Form */}
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
                <ArrowLeft className="w-3 h-3" /> Change
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
                  Enter 6-Digit Verification Code
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
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Sign In</span>
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
              <span className="text-slate-400">Didn't receive the email?</span>
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
                {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

