import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, AlertCircle, RefreshCw, ChevronLeft, Smartphone, CheckCircle2, Lock } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp, resendOtp, isAuthenticated } = useAdminAuth();

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [mobileNumber, setMobileNumber] = useState('9876543210'); // Default Super Admin seeded mobile
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    let timer: any;
    if (step === 'OTP' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(val);
    if (error) setError(null);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6-9.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await sendOtp(mobileNumber);
      setStep('OTP');
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to dispatch verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const sanitized = val.replace(/\D/g, '');
    if (!sanitized) {
      const nextOtp = [...otp];
      nextOtp[index] = '';
      setOtp(nextOtp);
      return;
    }

    if (sanitized.length >= 6) {
      const chars = sanitized.slice(0, 6).split('');
      setOtp(chars);
      otpInputsRef.current[5]?.focus();
      triggerVerify(chars.join(''));
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = sanitized.charAt(sanitized.length - 1);
    setOtp(nextOtp);

    if (error) setError(null);

    if (index < 5 && nextOtp[index]) {
      otpInputsRef.current[index + 1]?.focus();
    }

    const completeOtp = nextOtp.join('');
    if (completeOtp.length === 6 && !nextOtp.includes('')) {
      triggerVerify(completeOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const triggerVerify = async (codeToVerify: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await verifyOtp(mobileNumber, codeToVerify);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isLoading) return;
    try {
      setIsLoading(true);
      setError(null);
      await resendOtp(mobileNumber);
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl -mr-12 -mt-12 pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center border border-indigo-500/30 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AuraPure Ops Portal</h1>
          <p className="text-xs text-slate-400">
            {step === 'PHONE'
              ? 'Enter staff registered mobile number for OTP login'
              : `Code sent to +91 ${mobileNumber}`}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* STEP 1: PHONE */}
        {step === 'PHONE' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                Staff Mobile Number
              </label>
              <div className="flex items-center rounded-xl bg-slate-800 border border-slate-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all p-1">
                <div className="flex items-center gap-1 px-3 py-2 border-r border-slate-700 text-xs font-bold text-slate-300 bg-slate-900/80 rounded-lg">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoFocus
                  placeholder="Enter 10-digit number"
                  value={mobileNumber}
                  onChange={handlePhoneChange}
                  className="w-full px-3 py-2 bg-transparent text-sm font-semibold tracking-wide text-white placeholder:text-slate-500 focus:outline-none"
                  maxLength={10}
                />
                <Smartphone className="w-4 h-4 text-slate-500 mr-2.5 flex-shrink-0" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || mobileNumber.length !== 10}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Dispatching OTP...' : 'Send Verification Code'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400 text-center">
              Super Admin seed number: <span className="font-mono text-emerald-400 font-bold">9876543210</span>
            </div>
          </form>
        )}

        {/* STEP 2: OTP */}
        {step === 'OTP' && (
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2 px-0.5">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Enter 6-Digit OTP</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('PHONE');
                    setError(null);
                  }}
                  className="text-xs font-semibold text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Edit Number
                </button>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-full aspect-square text-center font-bold text-lg rounded-xl border border-slate-700 bg-slate-800 text-white focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none transition-all shadow-sm"
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={isLoading || otp.join('').length !== 6}
              onClick={() => triggerVerify(otp.join(''))}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center text-xs">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="font-semibold text-indigo-400 hover:underline flex items-center justify-center gap-1.5 mx-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Resend OTP via SMS
                </button>
              ) : (
                <span className="text-slate-400">
                  Resend code in <span className="font-bold text-white font-mono">0:{countdown < 10 ? `0${countdown}` : countdown}</span>
                </span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span>Strict RBAC enforcement: Only authorized staff roles permitted.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
