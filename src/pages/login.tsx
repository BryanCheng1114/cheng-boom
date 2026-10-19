import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  LogIn,
  Mail,
  LockKeyhole,
  UserRound,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { useCart } from '../components/cart/CartProvider';
import { useBusiness } from '../context/BusinessContext';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

// Custom Google Button Component
function CustomGoogleButton({ onSuccess, onError, isLoading, text }: { onSuccess: (res: any) => void, onError: () => void, isLoading: boolean, text?: string }) {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => onSuccess(tokenResponse),
    onError: () => onError(),
  });

  return (
    <button
      type="button"
      onClick={() => login()}
      disabled={isLoading}
      className="w-full py-3.5 bg-white text-black font-bold rounded-full border border-zinc-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      {text || 'Continue With Google'}
    </button>
  );
}

// Inner Auth Content
function AuthContent() {
  const { clearCart } = useCart();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { settings } = useBusiness();

  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginData, setLoginData] = useState({ identifier: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', phone: '', email: '', password: '', address: '' });

  const [regStep, setRegStep] = useState<'form' | 'otp'>('form');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (regStep === 'otp' && otpExpiresAt) {
      const interval = setInterval(() => {
        const diff = Math.floor((otpExpiresAt.getTime() - Date.now()) / 1000);
        if (diff <= 0) {
          setTimeLeft(0);
          clearInterval(interval);
        } else {
          setTimeLeft(diff);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [regStep, otpExpiresAt]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    if (router.query.registered) {
      setSuccess(t.login?.successCreated || 'Account created successfully! Please sign in.');
    }
  }, [router.query, t.login]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginData.identifier.trim().toLowerCase(), password: loginData.password }),
      });

      if (res.ok) {
        const user = await res.json();
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user_role', user.role);
        window.dispatchEvent(new Event('user-updated'));

        clearCart();

        router.push('/');
      } else {
        const data = await res.json();
        if (data.code === 'USER_NOT_FOUND') {
          setRegisterData({
            name: '',
            phone: '',
            email: loginData.identifier.trim().toLowerCase(),
            password: '',
            address: '',
          });
          setIsRegistering(true);
          setRegStep('form');
          setError('');
        } else {
          setError(data.message || t.login?.loginError || 'Please check your email and password.');
        }
      }
    } catch (err) {
      setError(t.login?.genericError || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (registerData.email && !emailRegex.test(registerData.email)) {
      setError(t.login?.invalidEmail || 'Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(registerData.password)) {
      setError(t.login?.passwordTooWeak || 'Password must be at least 8 characters long and contain at least one number and one special character.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerData.email }),
      });

      if (res.ok) {
        const data = await res.json();
        setRegStep('otp');
        setOtpExpiresAt(new Date(data.expiresAt));
        setSuccess('OTP has been sent to your email.');
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerData.email }),
      });

      if (res.ok) {
        const data = await res.json();
        setOtpExpiresAt(new Date(data.expiresAt));
        setOtpValues(['', '', '', '', '', '']);
        setSuccess('OTP has been resent to your email.');
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const otpString = otpValues.join('');
    if (otpString.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...registerData, otp: otpString }),
      });

      if (res.ok) {
        const user = await res.json();
        setOtpValues(['', '', '', '', '', '']);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user_role', user.role);
        window.dispatchEvent(new Event('user-updated'));
        clearCart();
        router.push('/');
      } else {
        const data = await res.json();
        setError(data.message || t.login?.registerError || 'Registration failed');
      }
    } catch (err) {
      setError(t.login?.genericError || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse: any) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: tokenResponse.access_token }),
      });

      if (res.ok) {
        const user = await res.json();
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user_role', user.role);
        window.dispatchEvent(new Event('user-updated'));

        clearCart();
        router.push('/');
      } else {
        const data = await res.json();
        setError(data.message || t.login?.googleError || 'Google Login failed.');
      }
    } catch (err) {
      setError(t.login?.genericError || 'An error occurred during Google Login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{isRegistering ? `Sign Up - ${settings?.businessName || 'Cheng-BOOM'}` : `Sign In - ${settings?.businessName || 'Cheng-BOOM'}`}</title>
      </Head>

      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fffaf5] px-4 py-20 text-zinc-900">
        <div className="pointer-events-none absolute -left-40 top-10 h-80 w-80 rounded-full bg-red-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-amber-100/70 blur-3xl" />

        {/* Absolute Back Button over everything (top left of viewport) */}
        <div className="absolute top-6 left-6 md:top-10 md:left-10 z-50">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 transition-colors hover:text-red-700"
          >
            <ArrowLeft size={16} />
            {t.login?.backToHome || 'Back to Home Page'}
          </Link>
        </div>

        <div className="relative z-10 w-full max-w-[520px]">
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex min-h-[600px] w-full flex-col justify-center rounded-[2rem] border border-zinc-200/80 bg-white/95 px-6 py-8 shadow-[0_24px_80px_rgba(127,29,29,0.08)] backdrop-blur-sm sm:min-h-[640px] sm:px-10 sm:py-10"
          >
            <div className="mx-auto w-full max-w-[440px]">
              <AnimatePresence mode="wait">

                {/* --- LOGIN FORM --- */}
                {!isRegistering ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-8 text-center">
                      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-700 shadow-sm">
                        <LogIn size={25} strokeWidth={1.8} />
                      </div>
                      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Sign in with email</h1>
                      <p className="mx-auto max-w-sm text-sm leading-relaxed text-zinc-500">
                        {locale === 'zh' ? '登录以查看订单，为下一场精彩庆典做好准备。' : locale === 'ms' ? 'Log masuk untuk mengurus pesanan dan bersedia untuk sambutan anda yang seterusnya.' : 'Sign in to manage your orders and get ready for your next celebration.'}
                      </p>
                    </div>

                    {error && (
                      <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-left text-sm text-red-700">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-left text-sm text-green-700">
                        <CheckCircle2 size={16} /> {success}
                      </div>
                    )}

                    <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                      <div className="relative">
                        <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="email"
                          required
                          autoComplete="email"
                          aria-label={locale === 'zh' ? '电子邮箱' : locale === 'ms' ? 'E-mel' : 'Email'}
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-100 py-3 pl-11 pr-4 text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-amber-400 focus:bg-white"
                          placeholder={locale === 'zh' ? '电子邮箱' : locale === 'ms' ? 'E-mel' : 'Email'}
                          value={loginData.identifier}
                          onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                        />
                      </div>

                      <div className="relative">
                        <LockKeyhole size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          autoComplete="current-password"
                          aria-label={locale === 'zh' ? '密码' : locale === 'ms' ? 'Kata Laluan' : 'Password'}
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-100 py-3 pl-11 pr-12 text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-amber-400 focus:bg-white"
                          placeholder={locale === 'zh' ? '密码' : locale === 'ms' ? 'Kata Laluan' : 'Password'}
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-700"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      <div className="-mt-1 flex justify-end">
                        <Link href="/forgot-password" className="text-sm font-medium text-zinc-500 transition-colors hover:text-amber-700">
                          {locale === 'zh' ? '忘记密码？' : locale === 'ms' ? 'Lupa Kata Laluan?' : 'Forgot Password?'}
                        </Link>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800"
                      >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Get Started'}
                      </button>
                    </form>

                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-zinc-400">{t.login?.orContinueWith || 'Or continue with'}</span>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <CustomGoogleButton
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError(t.login?.googleError || 'Google Login Failed')}
                        isLoading={isLoading}
                        text={locale === 'zh' ? '使用 Google 账号继续' : locale === 'ms' ? 'Teruskan dengan Google' : 'Continue With Google'}
                      />
                    </div>

                  </motion.div>
                ) : (

                  /* --- REGISTER FORM --- */
                  <motion.div
                    key="register"
                    className="flex min-h-[520px] flex-col justify-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {regStep === 'form' ? (
                      <>
                        <div className="mb-7 text-center">
                          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-700 shadow-sm">
                            <UserRound size={24} strokeWidth={1.8} />
                          </div>
                          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900">Let’s get you started</h1>
                          <p className="text-sm leading-relaxed text-zinc-500">
                            This email isn’t registered yet. Add your name and phone number to create your fireworks account for <span className="font-medium text-zinc-700">{registerData.email}</span>.
                          </p>
                        </div>

                        {error && (
                          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-left text-sm text-red-700">
                            {error}
                          </div>
                        )}
                        <form onSubmit={handleRegisterSubmit} className="space-y-4" autoComplete="off">

                          <div className="space-y-3">
                            <div className="relative">
                              <UserRound size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                              <input
                                type="text"
                                required
                                aria-label={t.login?.fullNameLabel || 'Full Name'}
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-100 py-3 pl-11 pr-4 text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-amber-400 focus:bg-white"
                                placeholder={t.login?.fullNamePlaceholder || 'John Doe'}
                                autoComplete="off"
                                value={registerData.name}
                                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                              />
                            </div>
                            <div className="relative">
                              <Phone size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                              <input
                                type="tel"
                                required
                                aria-label={t.login?.phoneLabel || 'Phone Number'}
                                pattern="^(\+?60|0)1[0-9]{8,9}$"
                                title="Please enter a valid Malaysian phone number, e.g., 0123456789 or +60123456789"
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-100 py-3 pl-11 pr-4 text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-amber-400 focus:bg-white"
                                placeholder={t.login?.phonePlaceholder || '0123456789'}
                                autoComplete="off"
                                value={registerData.phone}
                                onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                              />
                            </div>
                            <div className="relative">
                              <LockKeyhole size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                              <input
                                type={showRegisterPassword ? 'text' : 'password'}
                                required
                                aria-label="Password"
                                autoComplete="new-password"
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-100 py-3 pl-11 pr-12 text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-amber-400 focus:bg-white"
                                placeholder="Create password"
                                value={registerData.password}
                                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                              />
                              <button type="button" onClick={() => setShowRegisterPassword(!showRegisterPassword)} aria-label={showRegisterPassword ? 'Hide password' : 'Show password'} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-700">
                                {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Continue to email verification'}
                          </button>
                        </form>

                        <button type="button" onClick={() => { setIsRegistering(false); setError(''); }} className="mt-5 w-full text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-800">
                          Back to sign in
                        </button>
                      </>
                    ) : (
                      <form onSubmit={handleVerifyAndRegister} className="mt-4 w-full space-y-6">
                        <div className="mb-7 text-center">
                          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-700 shadow-sm">
                            <ShieldCheck size={25} strokeWidth={1.8} />
                          </div>
                          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Account Verification</h1>
                          <p className="text-sm leading-relaxed text-zinc-500">
                            Enter OTP code sent to <span className="text-zinc-900 font-medium">{registerData.email}</span>
                          </p>
                        </div>

                        {error && (
                          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                            <div className="text-red-500 mt-0.5 flex-shrink-0">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <p className="text-left text-[13px] font-medium leading-relaxed text-red-700">
                              {error}
                            </p>
                          </div>
                        )}

                        <div className="w-full">
                          <div className="flex justify-end mb-2 w-full">
                            <span className="text-sm font-medium text-yellow-500">
                              {formatTime(timeLeft)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-2 w-full">
                            {otpValues.map((digit, index) => (
                              <input
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoFocus={index === 0}
                                maxLength={1}
                                className="aspect-square w-full rounded-xl border border-zinc-200 bg-zinc-100 text-center text-2xl font-bold text-zinc-900 outline-none transition-all focus:border-amber-400 focus:bg-white"
                                value={digit}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  const newOtp = [...otpValues];
                                  newOtp[index] = val;
                                  setOtpValues(newOtp);
                                  if (val && index < 5) {
                                    document.getElementById(`otp-${index + 1}`)?.focus();
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
                                    document.getElementById(`otp-${index - 1}`)?.focus();
                                  }
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading || otpValues.join('').length !== 6 || timeLeft === 0}
                          className="w-full py-3.5 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 mt-8 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? <Loader2 className="animate-spin" /> : 'Verify'}
                        </button>

                        <div className="mt-4 text-center text-sm text-zinc-500 flex items-center justify-center gap-2">
                          <span>Didn't receive the email?</span>
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={isLoading || timeLeft > 540} // disable for first 60s
                            className="flex items-center gap-1 font-medium text-amber-700 transition-colors hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Click to resend
                          </button>
                        </div>

                        <div className="mt-8 text-center border-t border-zinc-200 pt-6">
                          <button
                            type="button"
                            onClick={() => {
                              setIsRegistering(false);
                              setRegStep('form');
                              setError('');
                              setSuccess('');
                            }}
                            className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors flex items-center justify-center gap-1 w-full"
                          >
                            <ArrowLeft size={14} /> Back to Sign In
                          </button>
                        </div>
                      </form>
                    )}

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </motion.div>
        </div>
      </div>
    </>
  );
}

export default function AuthPage() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'missing_client_id';
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthContent />
    </GoogleOAuthProvider>
  );
}
