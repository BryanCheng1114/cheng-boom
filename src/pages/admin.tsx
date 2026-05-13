import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';
import { User, Lock, Loader2, LogIn, Sparkles, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export default function AdminLogin() {
  const router = useRouter();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState<'idle' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const remembered = localStorage.getItem('admin_remembered_username');
    if (remembered) {
      setFormData(prev => ({ ...prev, username: remembered }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (rememberMe) {
          localStorage.setItem('admin_remembered_username', formData.username);
        } else {
          localStorage.removeItem('admin_remembered_username');
        }
        
        // Write theme & language choices from database to memory
        if (data.user?.theme) {
          localStorage.setItem('theme', data.user.theme);
        }
        if (data.user?.language) {
          localStorage.setItem('admin_selected_language', data.user.language);
        }

        setLoginStatus('success');
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 1500);
      } else {
        throw new Error(data.message || 'Invalid Credentials');
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{t.admin?.headTitle || 'Admin Login - Cheng-BOOM'}</title>
      </Head>

      <div className="dark min-h-screen bg-[#050505] flex flex-col relative overflow-x-hidden text-zinc-100">
        
        {/* Cinematic Background Image */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/istockphoto-1174615840-612x612.jpg"
            alt="Background"
            fill
            className="object-cover opacity-20 dark:opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-black/60 dark:bg-black/85" />
          <div className="absolute inset-0 backdrop-blur-[2px]" />
        </div>

        {/* Dynamic Glowing Accents on Top of Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <motion.div 
            animate={{ 
              scale: 1,
              rotate: 0
            }}
            className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]" 
          />
          <motion.div 
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[120px]" 
          />
        </div>

        {/* Top Navigation */}
        <div className="relative z-20 p-6 flex justify-end items-center">
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-[460px] py-4">
            
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2 uppercase italic drop-shadow-md">
                {t.admin?.panelTitle || 'Admin Panel'}
              </h1>
              <p className="text-zinc-400 font-medium text-[13px] max-w-xs mx-auto">
                {t.admin?.panelSubtitle || 'Please sign in to continue'}
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-zinc-900/80 backdrop-blur-3xl border border-white/5 rounded-[40px] shadow-2xl shadow-black/40 overflow-hidden relative text-white">
              <AnimatePresence mode="wait">
                {loginStatus === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-8 md:p-10 py-12 flex flex-col items-center gap-4 text-center"
                  >
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary border border-primary/30">
                      <LogIn size={40} />
                    </div>
                    <div>
                      <p className="text-xl font-black italic uppercase text-white">
                        {t.admin?.accessGranted || 'Access Granted'}
                      </p>
                      <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                        {t.admin?.redirecting || 'Redirecting...'}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="login-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 md:p-10"
                  >
                    {error && (
                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-shake">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                          {t.admin?.usernameLabel || 'Username'}
                        </label>
                        <div className="relative group">
                          <User className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" size={18} />
                          <input 
                            type="text"
                            required
                            disabled={isLoading}
                            className="w-full pl-14 pr-6 py-3.5 rounded-2xl bg-zinc-950/60 border border-white/10 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-white placeholder:text-zinc-500"
                            placeholder={t.admin?.usernamePlaceholder || 'Admin ID'}
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                          {t.admin?.passwordLabel || 'Password'}
                        </label>
                        <div className="relative group">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" size={18} />
                          <input 
                            type={showPassword ? "text" : "password"}
                            required
                            disabled={isLoading}
                            className="w-full pl-14 pr-14 py-3.5 rounded-2xl bg-zinc-950/60 border border-white/10 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-white placeholder:text-zinc-500"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

                      {/* Remember Me Checkbox */}
                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                          <div className="relative">
                            <input 
                              type="checkbox"
                              className="sr-only"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${rememberMe ? 'bg-primary border-primary text-zinc-900 shadow-md shadow-primary/20' : 'border-white/10 hover:border-primary/50 bg-zinc-950/40'}`}>
                              {rememberMe && (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3.5} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 group-hover:text-zinc-300 transition-colors select-none ml-1">
                            {t.admin?.rememberMe || 'REMEMBER ME'}
                          </span>
                        </label>
                      </div>

                      <motion.button 
                        whileHover={{ scale: isLoading ? 1 : 1.01 }}
                        whileTap={{ scale: isLoading ? 1 : 0.99 }}
                        disabled={isLoading}
                        type="submit"
                        className="w-full py-4 bg-primary text-zinc-900 rounded-[20px] font-black text-lg hover:brightness-110 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                      >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} strokeWidth={3} />}
                        {t.admin?.signIn || 'Log In'}
                      </motion.button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Branding */}
            <p className="mt-6 text-center text-[8px] font-black uppercase tracking-[0.4em] text-zinc-400 opacity-40">
              {t.admin?.copyright || '© 2026 Cheng-BOOM Global Pyrotechnics'}
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        body {
          overflow-y: auto !important;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: inherit;
          -webkit-box-shadow: 0 0 0px 1000px transparent inset;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </>
  );
}
