import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { 
  Phone, 
  Lock, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  User, 
  MapPin, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';

export default function AuthPage() {
  const { t } = useTranslation();
  const router = useRouter();
  
  // Toggle between Login and Register
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form States
  const [loginData, setLoginData] = useState({ phone: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', phone: '', password: '', address: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  useEffect(() => {
    if (router.query.registered) {
      setSuccess(t.login?.successCreated || 'Account created successfully! Please sign in.');
    }
    if (router.query.mode === 'register') {
      setIsRegistering(true);
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
        body: JSON.stringify(loginData),
      });

      if (res.ok) {
        const user = await res.json();
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user_role', user.role);
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

    // Validate Password Strength (Min 8 chars, 1 number, 1 special character)
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(registerData.password)) {
      setError(t.login?.passwordTooWeak || 'Password must be at least 8 characters long and contain at least one number and one special character.');
      setIsLoading(false);
      return;
    }

    // Verify Password Match
    if (registerData.password !== confirmPassword) {
      setError(t.login?.passwordsDoNotMatch || 'Passwords do not match');
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
        setSuccess(t.login?.successRegister || 'Welcome to the BOOM! Your account is ready. Please sign in.');
        setLoginData({ ...loginData, phone: registerData.phone });
      } else {
        const data = await res.json();
        if (data.code === 'PHONE_EXISTS') {
          setError(t.login?.phoneExists || data.message || 'An account with this phone number already exists.');
        } else {
          setError(data.message || 'Registration failed');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const containerVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <>
      <Head>
        <title>{isRegistering ? (t.login?.joinTitle || 'Join Cheng-BOOM') : (t.login?.signInTitle || 'Sign In - Cheng-BOOM')}</title>
      </Head>

      <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden dark:bg-zinc-950">
        {/* Dynamic Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ 
              scale: isRegistering ? 1.2 : 1,
              rotate: isRegistering ? 45 : 0
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ 
              scale: isRegistering ? 0.8 : 1,
              x: isRegistering ? -100 : 0
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[120px]" 
          />
        </div>

        {/* Top Navigation */}
        <div className="relative z-20 p-6 flex justify-between items-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-primary transition-all font-bold group text-sm"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            {t.login?.backToHome || 'Back to Home'}
          </Link>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-500/5 rounded-full border border-zinc-500/10 backdrop-blur-sm">
              <ShieldCheck size={14} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t.login?.secureProtocol || 'Secure Protocol'}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-[460px] py-4">
            
            <div className="text-center mb-6">
              <motion.h1 
                key={isRegistering ? 'reg' : 'log'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2"
              >
                {isRegistering ? (
                  <>{t.login?.joinBoom || 'Join the BOOM'}</>
                ) : (
                  <>{t.login?.welcomeBack || 'Welcome Back'}</>
                )}
              </motion.h1>
              <p className="text-muted-foreground font-medium text-[13px] max-w-xs mx-auto">
                {isRegistering 
                  ? (t.login?.registerDesc || "Experience the full power of premium pyrotechnics with your new member account.")
                  : (t.login?.loginDesc || "Sign in to access your orders and exclusive seller pricing benefits.")}
              </p>
            </div>

            {/* Auth Card */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl border border-zinc-200 dark:border-white/5 rounded-[40px] shadow-2xl shadow-black/5 overflow-hidden relative">
              
              <AnimatePresence mode="wait">
                {!isRegistering ? (
                  /* ── LOGIN FORM ────────────────────────────────────────── */
                  <motion.div 
                    key="login"
                    variants={containerVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="p-8 md:p-10"
                  >
                    {error && (
                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-shake">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
                        <CheckCircle2 size={14} /> {success}
                      </div>
                    )}

                    <form onSubmit={handleLoginSubmit} className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.login?.phoneLabel || 'Phone Number'}</label>
                        <div className="relative group">
                          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" size={18} />
                          <input 
                            type="tel"
                            required
                            className="w-full pl-14 pr-6 py-3.5 rounded-2xl bg-zinc-500/5 dark:bg-zinc-950/50 border border-zinc-500/10 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-foreground dark:text-white"
                            placeholder={t.login?.phonePlaceholder || '+60 12-345 6789'}
                            value={loginData.phone}
                            onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.login?.labelPassword || 'Password'}</label>
                        <div className="relative group">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" size={18} />
                          <input 
                            type={showPassword ? "text" : "password"}
                            required
                            className="w-full pl-14 pr-14 py-3.5 rounded-2xl bg-zinc-500/5 dark:bg-zinc-950/50 border border-zinc-500/10 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-foreground dark:text-white"
                            placeholder={t.login?.placeholderPassword || '••••••••'}
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-primary transition-colors p-2"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <motion.button 
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        disabled={isLoading}
                        type="submit"
                        className="w-full py-4 bg-primary text-zinc-900 rounded-[20px] font-black text-lg hover:brightness-110 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} strokeWidth={3} />}
                        {t.login?.signIn || 'Sign In'}
                      </motion.button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-zinc-500/10 text-center">
                      <p className="text-[12px] font-medium text-muted-foreground mb-3">{t.login?.newUser || 'New user? Click below to register'}</p>
                      <button 
                        onClick={() => { setIsRegistering(true); setError(''); setSuccess(''); }}
                        className="w-full py-3.5 border border-zinc-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-500/5 transition-all flex items-center justify-center gap-2 group"
                      >
                        {t.login?.createAccount || 'Create Account'} <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* ── REGISTER FORM ─────────────────────────────────────── */
                  <motion.div 
                    key="register"
                    variants={containerVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="p-8 md:p-10"
                  >
                    {error && (
                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-shake">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.login?.fullNameLabel || 'Full Name'}</label>
                        <div className="relative group">
                          <User className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" size={18} />
                          <input 
                            type="text"
                            required
                            className="w-full pl-14 pr-6 py-3.5 rounded-2xl bg-zinc-500/5 dark:bg-zinc-950/50 border border-zinc-500/10 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-foreground dark:text-white"
                            placeholder={t.login?.fullNamePlaceholder || 'John Doe'}
                            value={registerData.name}
                            onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.login?.phoneLabel || 'Phone Number'}</label>
                        <div className="relative group">
                          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" size={18} />
                          <input 
                            type="tel"
                            required
                            className="w-full pl-14 pr-6 py-3.5 rounded-2xl bg-zinc-500/5 dark:bg-zinc-950/50 border border-zinc-500/10 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-foreground dark:text-white"
                            placeholder={t.login?.phonePlaceholder || '+60 12-345 6789'}
                            value={registerData.phone}
                            onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.login?.labelPassword || 'Password'}</label>
                        <div className="relative group">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" size={18} />
                          <input 
                            type={showRegPassword ? "text" : "password"}
                            required
                            className="w-full pl-14 pr-14 py-3.5 rounded-2xl bg-zinc-500/5 dark:bg-zinc-950/50 border border-zinc-500/10 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-foreground dark:text-white"
                            placeholder={t.login?.passwordMinPlaceholder || 'Min. 8 characters with a number & symbol'}
                            value={registerData.password}
                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-primary transition-colors p-2"
                          >
                            {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {registerData.password.length > 0 && !/^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(registerData.password) && (
                          <p className="text-[10px] font-bold text-amber-500 dark:text-amber-400 ml-1 mt-1 animate-pulse">
                            ⚠️ {t.login?.passwordTooWeak || 'Password must be at least 8 characters with a number & symbol.'}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.login?.labelConfirmPassword || 'Confirm Password'}</label>
                        <div className="relative group">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" size={18} />
                          <input 
                            type={showRegConfirmPassword ? "text" : "password"}
                            required
                            className="w-full pl-14 pr-14 py-3.5 rounded-2xl bg-zinc-500/5 dark:bg-zinc-950/50 border border-zinc-500/10 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-foreground dark:text-white"
                            placeholder={t.login?.placeholderConfirmPassword || '••••••••'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-primary transition-colors p-2"
                          >
                            {showRegConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {confirmPassword.length > 0 && confirmPassword !== registerData.password && (
                          <p className="text-[10px] font-bold text-red-500 dark:text-red-400 ml-1 mt-1 animate-pulse">
                            ⚠️ {t.login?.passwordsDoNotMatch || 'Passwords do not match.'}
                          </p>
                        )}
                      </div>

                      {/* Spacer to push Join Now button down slightly */}
                      <div className="h-4" />

                      <motion.button 
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        disabled={isLoading}
                        type="submit"
                        className="w-full py-4 bg-primary text-zinc-900 rounded-[20px] font-black text-lg hover:brightness-110 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} strokeWidth={3} />}
                        {t.login?.joinNow || 'Join Now'}
                      </motion.button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-zinc-500/10 text-center">
                      <p className="text-[12px] font-medium text-muted-foreground mb-3">{t.login?.existingMember || 'Existing member? Sign in here'}</p>
                      <button 
                        onClick={() => { setIsRegistering(false); setError(''); setSuccess(''); }}
                        className="w-full py-3 border border-zinc-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-500/5 transition-all"
                      >
                        {t.login?.signInInstead || 'Sign In Instead'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500 opacity-40">
              {t.login?.copyright || '© 2026 Cheng-BOOM Global Pyrotechnics'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
