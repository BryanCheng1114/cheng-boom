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
function CustomGoogleButton({ onSuccess, onError, isLoading }: { onSuccess: (res: any) => void, onError: () => void, isLoading: boolean }) {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => onSuccess(tokenResponse),
    onError: () => onError(),
  });

  return (
    <button 
      type="button"
      onClick={() => login()}
      disabled={isLoading}
      className="w-full py-3.5 bg-white text-black font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" />
        {/* We want it full colored like standard google or single color? The prompt said "a google icon, and text is Continue With Google". Let's use the standard SVG colors but ensure it looks good on white. The `fill="currentColor"` overrides might conflict. Let's just use the proper colored paths. */}
      </svg>
      Continue With Google
    </button>
  );
}

// Inner Auth Content
function AuthContent() {
  const { clearCart } = useCart();
  const { t } = useTranslation();
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
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!agreeTerms) {
      setError('You must agree to the terms of service.');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (registerData.email && !emailRegex.test(registerData.email)) {
      setError('Please enter a valid email address.');
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      if (res.ok) {
        setIsRegistering(false);
        setSuccess(t.login?.successRegister || 'Welcome! Your account is ready. Please sign in.');
        setLoginData({ ...loginData, identifier: registerData.email || registerData.phone });
      } else {
        const data = await res.json();
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
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
        setError(data.message || 'Google Login failed.');
      }
    } catch (err) {
      setError('An error occurred during Google Login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{isRegistering ? `Sign Up - ${settings?.businessName || 'Cheng-BOOM'}` : `Sign In - ${settings?.businessName || 'Cheng-BOOM'}`}</title>
      </Head>

      <div className="min-h-screen bg-[#050505] text-zinc-100 flex relative overflow-hidden">
        
        {/* Absolute Back Button over everything (top left of viewport) */}
        <div className="absolute top-6 left-6 md:top-10 md:left-10 z-50">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-zinc-200 hover:text-white transition-all text-sm font-medium drop-shadow-md"
          >
            <ArrowLeft size={16} />
            Back to Home Page
          </Link>
        </div>

        {/* Mobile Background Image */}
        <div className="absolute inset-0 md:hidden z-0">
          <Image 
            src={isRegistering ? "/image.png" : "/login_signin.jpg"}
            alt="Background"
            fill
            sizes="100vw"
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-black/80" />
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
              src={isRegistering ? "/image.png" : "/login_signin.jpg"}
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
            className={`w-full md:w-[35%] flex flex-col justify-center relative bg-transparent md:bg-[#0a0a0a] ${isRegistering ? 'order-1' : 'order-2'} min-h-screen overflow-y-auto py-12 md:py-0`}
          >
            <div className="w-full max-w-[440px] mx-auto px-6 mt-16 md:mt-0">
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
                      <h1 className="text-4xl md:text-5xl font-light text-white mb-3">Sign in</h1>
                      <p className="text-zinc-400 text-sm">
                        Welcome back to the Smart Site System for Oil Depots.<br />
                        Sign in to continue to your account.
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
                      <div className="space-y-2">
                        <label className="text-sm text-zinc-400">Phone Number or E-mail</label>
                        <input 
                          type="text"
                          required
                          className="w-full px-4 py-3.5 rounded-lg bg-[#1a1a1a] border border-transparent focus:border-yellow-500/50 outline-none transition-all text-white placeholder:text-zinc-600"
                          placeholder="your@email.com or +60123456789"
                          value={loginData.identifier}
                          onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-zinc-400">Password</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"}
                            required
                            className="w-full pl-4 pr-12 py-3.5 rounded-lg bg-[#1a1a1a] border border-transparent focus:border-yellow-500/50 outline-none transition-all text-white tracking-wider"
                            placeholder="••••••••••••"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
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
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${rememberMe ? 'bg-yellow-500 border-yellow-500' : 'bg-[#1a1a1a] border-zinc-700'}`}>
                              {rememberMe && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                            {t.login?.rememberMe || 'Remember me'}
                          </span>
                        </label>
                      </div>

                      <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm"
                      >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Sign In'}
                      </button>
                    </form>

                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-800"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-[#050505] md:bg-[#0a0a0a] text-zinc-500">Or continue with</span>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <CustomGoogleButton 
                        onSuccess={handleGoogleSuccess} 
                        onError={() => setError('Google Login Failed')}
                        isLoading={isLoading}
                      />
                    </div>

                    <div className="mt-12 text-left flex items-center gap-2">
                      <span className="text-sm text-zinc-400">No Account?</span>
                      <button 
                        onClick={() => { setIsRegistering(true); setError(''); setSuccess(''); }}
                        className="text-sm text-yellow-500 font-semibold hover:text-yellow-400 transition-colors"
                      >
                        Create Now
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
                    <div className="mb-8">
                      <h1 className="text-4xl md:text-5xl font-light text-white mb-3">Sign up</h1>
                      <p className="text-zinc-400 text-sm">
                        Welcome to the Smart Site System for Oil Depots.<br />
                        Register as a member to experience.
                      </p>
                    </div>

                    {error && (
                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-left">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleRegisterSubmit} className="space-y-4" autoComplete="off">
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm text-zinc-400">Name</label>
                          <input 
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-transparent focus:border-yellow-500/50 outline-none transition-all text-white"
                            placeholder="John Doe"
                            autoComplete="off"
                            value={registerData.name}
                            onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-zinc-400">Phone Number</label>
                          <input 
                            type="tel"
                            required
                            pattern="^(\+?60|0)1[0-9]{8,9}$"
                            title="Please enter a valid Malaysian phone number, e.g., 0123456789 or +60123456789"
                            className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-transparent focus:border-yellow-500/50 outline-none transition-all text-white"
                            placeholder="0123456789"
                            autoComplete="off"
                            value={registerData.phone}
                            onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-zinc-400">E-mail</label>
                        <input 
                          type="email"
                          required
                          className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-transparent focus:border-yellow-500/50 outline-none transition-all text-white"
                          placeholder="yatingzang0215@gmail.com"
                          autoComplete="off"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-zinc-400">Password</label>
                        <div className="relative">
                          <input 
                            type={showRegPassword ? "text" : "password"}
                            required
                            className="w-full pl-4 pr-12 py-3 rounded-lg bg-[#1a1a1a] border border-transparent focus:border-yellow-500/50 outline-none transition-all text-white tracking-wider"
                            placeholder="••••••••••••"
                            autoComplete="new-password"
                            value={registerData.password}
                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                          >
                            {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {registerData.password.length > 0 && !/^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(registerData.password) && (
                          <p className="text-xs text-yellow-500 mt-1">
                            ⚠️ Password must be at least 8 chars with a number & symbol.
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
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${agreeTerms ? 'bg-yellow-500 border-yellow-500' : 'bg-[#1a1a1a] border-zinc-700'}`}>
                              {agreeTerms && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                            I agree to the terms of service
                          </span>
                        </label>
                      </div>

                      <button 
                        type="submit"
                        disabled={!agreeTerms || isLoading}
                        className="w-full py-3.5 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Create Account'}
                      </button>
                    </form>

                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-800"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-[#050505] md:bg-[#0a0a0a] text-zinc-500">Or continue with</span>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <CustomGoogleButton 
                        onSuccess={handleGoogleSuccess} 
                        onError={() => setError('Google Login Failed')}
                        isLoading={isLoading}
                      />
                    </div>

                    <div className="mt-12 text-left flex items-center gap-2">
                      <span className="text-sm text-zinc-400">Already a member?</span>
                      <button 
                        onClick={() => { setIsRegistering(false); setError(''); setSuccess(''); }}
                        className="text-sm text-yellow-500 font-semibold hover:text-yellow-400 transition-colors"
                      >
                        Sign in
                      </button>
                    </div>

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
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthContent />
    </GoogleOAuthProvider>
  );
}
