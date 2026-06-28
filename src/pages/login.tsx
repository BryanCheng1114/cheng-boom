import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle2
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
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" />
        {/* We want it full colored like standard google or single color? The prompt said "a google icon, and text is Continue With Google". Let's use the standard SVG colors but ensure it looks good on white. The `fill="currentColor"` overrides might conflict. Let's just use the proper colored paths. */}
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginData, setLoginData] = useState({ identifier: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', phone: '', email: '', password: '', address: '' });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  
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
    if (router.query.mode === 'register') {
      setIsRegistering(true);
    }

    const rememberedPhone = localStorage.getItem('user_remembered_phone');
    if (rememberedPhone) {
      setLoginData(prev => ({ ...prev, identifier: rememberedPhone }));
      setRememberMe(true);
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
        body: JSON.stringify({ phone: loginData.identifier, password: loginData.password }),
      });

      if (res.ok) {
        const user = await res.json();
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user_role', user.role);
        window.dispatchEvent(new Event('user-updated'));
        
        clearCart();

        if (rememberMe) {
          localStorage.setItem('user_remembered_phone', loginData.identifier);
        } else {
          localStorage.removeItem('user_remembered_phone');
        }

        router.push('/');
      } else {
        const data = await res.json();
        setError(data.message || t.login?.loginError || 'Login failed. Please check your credentials.');
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

    if (!agreeTerms) {
      setError(t.login?.agreeTermsError || 'You must agree to the terms of service.');
      setIsLoading(false);
      return;
    }

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
        setIsRegistering(false);
        setRegStep('form');
        setOtpValues(['', '', '', '', '', '']);
        setSuccess(t.login?.successRegister || 'Welcome! Your account is ready. Please sign in.');
        setLoginData({ ...loginData, identifier: registerData.email || registerData.phone });
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

      <div className="min-h-screen bg-white text-zinc-900 flex relative overflow-hidden">
        
        {/* Absolute Back Button over everything (top left of viewport) */}
        <div className="absolute top-6 left-6 md:top-10 md:left-10 z-50">
          <Link 
            href="/" 
            className={`inline-flex items-center gap-2 transition-all text-sm font-medium ${
              !isRegistering 
                ? 'text-zinc-900 md:text-white hover:text-zinc-600 md:hover:text-zinc-200 drop-shadow-none md:drop-shadow-md' 
                : 'text-zinc-900 hover:text-zinc-600'
            }`}
          >
            <ArrowLeft size={16} />
            {t.login?.backToHome || 'Back to Home Page'}
          </Link>
        </div>

        {/* Mobile Background Image */}
        <div className="absolute inset-0 md:hidden z-0">
          <Image 
            src="/login_signin.jpg"
            alt="Background"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
        </div>

        {/* --- SPLIT SCREEN LAYOUT --- */}
        <div className="w-full flex flex-col md:flex-row min-h-screen relative z-10">
          
          {/* Desktop Image Panel (65%) */}
          <motion.div 
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`hidden md:block w-[65%] relative ${isRegistering ? 'order-2' : 'order-1'}`}
          >
            <Image 
              src="/login_signin.jpg"
              alt="Background"
              fill
              sizes="65vw"
              className="object-cover"
              priority
            />
            {/* Kept a very subtle gradient just for the Back button readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent opacity-50" />
            
            {/* Add slight blur only for the Sign up image */}
            {isRegistering && (
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
            )}
          </motion.div>

          {/* Form Panel (35%) */}
          <motion.div 
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`w-full md:w-[35%] flex flex-col ${regStep === 'otp' ? 'justify-center' : 'justify-start md:justify-center'} relative bg-white ${isRegistering ? 'order-1' : 'order-2'} min-h-screen overflow-y-auto ${regStep === 'otp' ? 'py-12 md:py-0' : 'pt-[100px] pb-12 md:py-0'}`}
          >
            <div className="w-full max-w-[440px] mx-auto px-6 mt-4 md:mt-0">
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
                    <div className="mb-10">
                      <h1 className="text-4xl md:text-5xl font-light text-zinc-900 mb-3">{t.login?.signIn || 'Sign in'}</h1>
                      <p className="text-zinc-500 text-sm whitespace-pre-line">
                        {t.login?.loginDesc || 'Sign in to access your orders and exclusive seller pricing benefits.'}
                      </p>
                    </div>

                    {error && (
                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-left">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm text-left flex items-center gap-2">
                        <CheckCircle2 size={16} /> {success}
                      </div>
                    )}

                    <form onSubmit={handleLoginSubmit} className="space-y-5">
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-zinc-600 mb-2">{t.login?.labelAccount || 'Phone Number or E-mail'}</label>
                        <input 
                          type="text"
                          required
                          className="w-full px-5 py-2.5 rounded-full bg-zinc-100 border border-zinc-200 focus:border-yellow-500 focus:bg-white outline-none transition-all text-zinc-900 placeholder:text-zinc-400"
                          placeholder={t.login?.placeholderAccount || "your@email.com or +60123456789"}
                          value={loginData.identifier}
                          onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-zinc-600 mb-2">{t.login?.labelPassword || 'Password'}</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"}
                            required
                            className="w-full pl-5 pr-12 py-2.5 rounded-full bg-zinc-100 border border-zinc-200 focus:border-yellow-500 focus:bg-white outline-none transition-all text-zinc-900 tracking-wider"
                            placeholder="••••••••••••"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center pt-2">
                        <label className="flex items-center gap-3 cursor-pointer group select-none">
                          <div className="relative flex items-center justify-center">
                            <input 
                              type="checkbox"
                              className="sr-only"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${rememberMe ? 'bg-yellow-500 border-yellow-500' : 'bg-zinc-100 border-zinc-300'}`}>
                              {rememberMe && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-zinc-500 group-hover:text-zinc-700 transition-colors">
                            {t.login?.rememberMe || 'Remember me'}
                          </span>
                        </label>
                      </div>

                      <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 bg-yellow-500 text-black font-semibold rounded-full hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm"
                      >
                        {isLoading ? <Loader2 className="animate-spin" /> : (t.login?.signIn || 'Sign In')}
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

                    <div className="mt-12 text-left flex items-center gap-2">
                      <span className="text-sm text-zinc-500">{t.login?.noAccount || 'No Account?'}</span>
                      <button 
                        onClick={() => { setIsRegistering(true); setError(''); setSuccess(''); setRegStep('form'); }}
                        className="text-sm text-yellow-600 font-semibold hover:text-yellow-500 transition-colors"
                      >
                        {t.login?.createAccount || 'Create Now'}
                      </button>
                    </div>

                  </motion.div>
                ) : (
                  
                  /* --- REGISTER FORM --- */
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {regStep === 'form' ? (
                      <>
                        <div className="mb-8">
                          <h1 className="text-4xl md:text-5xl font-light text-zinc-900 mb-3">{t.login?.joinBoom || 'Sign up'}</h1>
                          <p className="text-zinc-500 text-sm whitespace-pre-line">
                            {t.login?.registerDesc || 'Create your account and start exploring our premium fireworks collection.'}
                          </p>
                        </div>

                        {error && (
                          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-left">
                            {error}
                          </div>
                        )}
                        <form onSubmit={handleRegisterSubmit} className="space-y-4" autoComplete="off">
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <label className="block text-sm font-medium text-zinc-600 mb-2">{t.login?.fullNameLabel || 'Name'}</label>
                              <input 
                                type="text"
                                required
                                className="w-full px-5 py-2.5 rounded-full bg-zinc-100 border border-zinc-200 focus:border-yellow-500 focus:bg-white outline-none transition-all text-zinc-900"
                                placeholder={t.login?.fullNamePlaceholder || 'John Doe'}
                                autoComplete="off"
                                value={registerData.name}
                                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-3">
                              <label className="block text-sm font-medium text-zinc-600 mb-2">{t.login?.phoneLabel || 'Phone Number'}</label>
                              <input 
                                type="tel"
                                required
                                pattern="^(\+?60|0)1[0-9]{8,9}$"
                                title="Please enter a valid Malaysian phone number, e.g., 0123456789 or +60123456789"
                                className="w-full px-5 py-2.5 rounded-full bg-zinc-100 border border-zinc-200 focus:border-yellow-500 focus:bg-white outline-none transition-all text-zinc-900"
                                placeholder={t.login?.phonePlaceholder || '0123456789'}
                                autoComplete="off"
                                value={registerData.phone}
                                onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-zinc-600 mb-2">{t.login?.emailLabel || 'E-mail'}</label>
                            <input 
                              type="email"
                              required
                              className="w-full px-5 py-2.5 rounded-full bg-zinc-100 border border-zinc-200 focus:border-yellow-500 focus:bg-white outline-none transition-all text-zinc-900"
                              placeholder={t.login?.emailPlaceholder || 'you@example.com'}
                              autoComplete="off"
                              value={registerData.email}
                              onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                            />
                          </div>

                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-zinc-600 mb-2">{t.login?.labelPassword || 'Password'}</label>
                            <div className="relative">
                              <input 
                                type={showRegPassword ? "text" : "password"}
                                required
                                className="w-full pl-5 pr-12 py-2.5 rounded-full bg-zinc-100 border border-zinc-200 focus:border-yellow-500 focus:bg-white outline-none transition-all text-zinc-900 tracking-wider"
                                placeholder="••••••••••••"
                                autoComplete="new-password"
                                value={registerData.password}
                                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                              />
                              <button 
                                type="button"
                                onClick={() => setShowRegPassword(!showRegPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                              >
                                {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                            {registerData.password.length > 0 && !/^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(registerData.password) && (
                              <p className="text-xs text-yellow-500 mt-1">
                                ⚠️ {t.login?.passwordMinPlaceholder || 'Password must be at least 8 chars with a number & symbol.'}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center pt-2">
                            <label className="flex items-center gap-3 cursor-pointer group select-none">
                              <div className="relative flex items-center justify-center">
                                <input 
                                  type="checkbox"
                                  className="sr-only"
                                  checked={agreeTerms}
                                  onChange={(e) => setAgreeTerms(e.target.checked)}
                                />
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${agreeTerms ? 'bg-yellow-500 border-yellow-500' : 'bg-zinc-100 border-zinc-300'}`}>
                                  {agreeTerms && (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <span className="text-sm text-zinc-500 group-hover:text-zinc-700 transition-colors">
                                {t.login?.agreeTerms || 'I agree to the terms of service'}
                              </span>
                            </label>
                          </div>

                          <button 
                            type="submit"
                            disabled={!agreeTerms || isLoading}
                            className="w-full py-3.5 bg-yellow-500 text-black font-semibold rounded-full hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? <Loader2 className="animate-spin" /> : (t.login?.createAccount || 'Create Account')}
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
                            text={locale === 'zh' ? '使用 Google 账号注册' : locale === 'ms' ? 'Daftar dengan Google' : 'Sign Up With Google'}
                          />
                        </div>

                        <div className="mt-12 text-left flex items-center gap-2">
                          <span className="text-sm text-zinc-500">{t.login?.existingMember || 'Already a member?'}</span>
                          <button 
                            onClick={() => { setIsRegistering(false); setError(''); setSuccess(''); setRegStep('form'); }}
                            className="text-sm text-yellow-600 font-semibold hover:text-yellow-500 transition-colors"
                          >
                            {t.login?.signInInstead || 'Sign in'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <form onSubmit={handleVerifyAndRegister} className="space-y-6 mt-4 w-full">
                        <div className="mb-6 text-center">
                          <h1 className="text-3xl md:text-4xl font-light text-zinc-900 mb-3">Account Verification</h1>
                          <p className="text-zinc-500 text-sm">
                            Enter OTP code sent to <span className="text-zinc-900 font-medium">{registerData.email}</span>
                          </p>
                        </div>
                        
                        {error && (
                          <div className="flex items-start gap-3 bg-[#1a1a1a]/80 backdrop-blur-md border border-zinc-800 border-t-[3px] border-t-red-500 p-4 mb-6 rounded-b-lg shadow-lg">
                            <div className="text-red-500 mt-0.5 flex-shrink-0">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <p className="text-[13px] text-zinc-300 font-medium leading-relaxed text-left">
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
                                className="w-full aspect-square text-center text-2xl font-bold rounded-lg bg-zinc-100 border border-zinc-200 focus:border-yellow-500 focus:bg-white outline-none transition-all text-zinc-900"
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
                            className="text-yellow-500 font-medium flex items-center gap-1 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
