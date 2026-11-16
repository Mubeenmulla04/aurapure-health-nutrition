import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Smartphone, ArrowRight, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, ChevronLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sendOtp, verifyOtp, resendOtp, isAuthenticated } = useAuth();

  const redirectPath = (location.state as any)?.from || '/account';

  // Step 1: 'PHONE', Step 2: 'OTP'
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [mobileNumber, setMobileNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  // Resend Countdown Timer
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
      setError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
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
      setError(err.response?.data?.error?.message || err.message || 'Failed to send OTP. Please try again.');
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

    // Support copy-paste of 6-digit OTP
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

    // Auto-advance focus to next input box
    if (index < 5 && nextOtp[index]) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
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
      const result = await verifyOtp(mobileNumber, codeToVerify);
      if (result.isNewUser) {
        navigate('/account/profile?welcome=true');
      } else {
        navigate(redirectPath, { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid or expired OTP. Please check and try again.');
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-md bg-white rounded-3xl border border-brand-muted/80 p-6 sm:p-10 shadow-card relative overflow-hidden transition-all duration-300">
        
        {/* Organic Background Accent Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-brand-glow/40 blur-3xl -mr-16 -mt-16 pointer-events-none" />

        {/* Brand Emblem */}
        <div className="text-center space-y-2 mb-6">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-brand-glow flex items-center justify-center transition-transform group-hover:scale-105">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-brand-primary fill-current">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-brand-dark">AuraPure</span>
          </Link>

          {step === 'PHONE' ? (
            <div>
              <h1 className="font-serif text-2xl font-bold text-brand-dark mt-2">Welcome Back!</h1>
              <p className="text-xs text-brand-subtext mt-1">Enter your mobile number to sign in or get started.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-brand-primary font-semibold">
                <ShieldCheck className="w-4 h-4 text-brand-sage" />
                <span>Instant OTP Verification</span>
              </div>
              <h1 className="font-serif text-2xl font-bold text-brand-dark mt-1">Verify Mobile Number</h1>
              <p className="text-xs text-brand-subtext mt-1">
                We've sent a 6-digit code to <span className="font-bold text-brand-dark">+91 {mobileNumber}</span>
              </p>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* STEP 1: MOBILE NUMBER INPUT */}
        {step === 'PHONE' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-brand-dark block uppercase tracking-wider mb-1.5">
                Mobile Number
              </label>
              <div className="flex items-center rounded-2xl border border-brand-muted/90 bg-brand-bg/50 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all overflow-hidden p-1">
                <div className="flex items-center gap-1.5 px-3 py-2 border-r border-brand-muted/70 text-xs font-bold text-brand-dark bg-white rounded-xl">
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
                  className="w-full px-3.5 py-2.5 bg-transparent text-sm font-semibold tracking-wide text-brand-dark placeholder:text-brand-subtext/60 focus:outline-none"
                  maxLength={10}
                />
                <Smartphone className="w-5 h-5 text-brand-subtext mr-3 flex-shrink-0" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || mobileNumber.length !== 10}
              className="w-full btn-primary !py-3.5 gap-2 text-sm font-bold shadow-card disabled:opacity-50 transition-all"
            >
              <span>{isLoading ? 'Sending Code...' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[11px] text-center text-brand-subtext/80 leading-relaxed pt-2">
              By clicking Continue, you agree to AuraPure's{' '}
              <Link to="/terms" className="text-brand-primary hover:underline">
                Terms
              </Link>{' '}
              &{' '}
              <Link to="/privacy-policy" className="text-brand-primary hover:underline">
                Privacy Policy
              </Link>
              . No password required.
            </p>
          </form>
        )}

        {/* STEP 2: 6-DIGIT OTP VERIFICATION */}
        {step === 'OTP' && (
          <div className="space-y-5">
            {/* 6 Box Input Matrix */}
            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-xs font-bold text-brand-dark uppercase tracking-wider">Enter 6-Digit Code</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('PHONE');
                    setError(null);
                  }}
                  className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-0.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Edit Number
                </button>
              </div>

              <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
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
                    className="w-full aspect-square text-center font-bold text-lg rounded-2xl border border-brand-muted/90 bg-brand-bg/40 text-brand-dark focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all shadow-xs"
                  />
                ))}
              </div>
            </div>

            {/* Manual Verify CTA (in case user prefers clicking) */}
            <button
              type="button"
              disabled={isLoading || otp.join('').length !== 6}
              onClick={() => triggerVerify(otp.join(''))}
              className="w-full btn-primary !py-3.5 text-sm font-bold shadow-card disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Verifying Code...' : 'Verify & Continue'}
            </button>

            {/* Resend Cooldown Countdown */}
            <div className="text-center pt-1 text-xs">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="font-bold text-brand-primary hover:underline flex items-center justify-center gap-1.5 mx-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Resend Code via SMS
                </button>
              ) : (
                <span className="text-brand-subtext">
                  Resend code in <span className="font-bold text-brand-dark font-mono">0:{countdown < 10 ? `0${countdown}` : countdown}</span>
                </span>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-brand-secondary/50 border border-brand-muted/60 text-[11px] text-brand-subtext text-center flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />
              <span>New customers are automatically registered with full access.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
