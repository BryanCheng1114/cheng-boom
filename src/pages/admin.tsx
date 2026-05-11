import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';
import { User, Lock, ShieldAlert, Loader2, LogIn, Sun, Moon, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function AdminLogin() {
  const router = useRouter();
  const { t } = useTranslation();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState<'idle' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

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

      <div className="min-h-screen w-full flex items-center justify-center relative font-sans transition-colors duration-500 bg-[#050505]">
        
        {/* Constant Cinematic Background */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/istockphoto-1174615840-612x612.jpg"
            alt="Background"
            fill
            className="object-cover opacity-50"
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 backdrop-blur-[3px]" />
        </div>

        {/* Top Right Controls */}
        <div className="absolute top-8 right-8 z-20 flex items-center gap-3">
          <LanguageSwitcher />
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all active:scale-90 shadow-xl"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Centered Login Panel - Following Customer Login Design */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-[440px] px-4"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-black text-white tracking-tight mb-2 uppercase italic drop-shadow-md">
              {t.admin?.panelTitle || 'Admin Panel'}
            </h1>
            <p className="text-zinc-400 font-medium text-sm">
              {t.admin?.panelSubtitle || 'Please sign in to continue'}
            </p>
          </div>

          {/* Login Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
              backdrop-blur-3xl border transition-all duration-500 rounded-[40px] p-8 md:p-10 shadow-2xl
              ${theme === 'dark' 
                ? 'bg-zinc-900/60 border-white/10 shadow-black/40 text-white' 
                : 'bg-zinc-100/95 border-white/30 shadow-black/30 text-zinc-900'
              }
            `}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {loginStatus === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-12 flex flex-col items-center gap-4 text-center"
                  >
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary border border-primary/30">
                      <LogIn size={40} />
                    </div>
                    <div>
                      <p className={`text-xl font-black italic uppercase ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{t.admin?.accessGranted || 'Access Granted'}</p>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">{t.admin?.redirecting || 'Redirecting...'}</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-5">
                    {/* Username */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                        {t.admin?.usernameLabel || 'Username'}
                      </label>
                      <div className="relative group">
                        <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-zinc-500 group-focus-within:text-primary' : 'text-zinc-400 group-focus-within:text-primary'}`}>
                          <User size={18} strokeWidth={2.5} />
                        </div>
                        <input 
                          type="text"
                          required
                          disabled={isLoading}
                          className={`
                            w-full pl-14 pr-6 py-4 rounded-2xl border outline-none transition-all font-bold
                            ${theme === 'dark' 
                              ? 'bg-zinc-950/50 border-white/5 text-white placeholder:text-zinc-800 focus:border-primary focus:ring-4 focus:ring-primary/10' 
                              : 'bg-white/85 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:ring-4 focus:ring-primary/10'
                            }
                          `}
                          placeholder={t.admin?.usernamePlaceholder || 'Admin ID'}
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                        {t.admin?.passwordLabel || 'Password'}
                      </label>
                      <div className="relative group">
                        <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-zinc-500 group-focus-within:text-primary' : 'text-zinc-400 group-focus-within:text-primary'}`}>
                          <Lock size={18} strokeWidth={2.5} />
                        </div>
                        <input 
                          type="password"
                          required
                          disabled={isLoading}
                          className={`
                            w-full pl-14 pr-6 py-4 rounded-2xl border outline-none transition-all font-bold tracking-widest
                            ${theme === 'dark' 
                              ? 'bg-zinc-950/50 border-white/5 text-white placeholder:text-zinc-800 focus:border-primary focus:ring-4 focus:ring-primary/10' 
                              : 'bg-white/85 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:ring-4 focus:ring-primary/10'
                            }
                          `}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-2 italic"
                        >
                          <ShieldAlert size={16} className="shrink-0" />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit */}
                    <motion.button 
                      whileHover={{ scale: isLoading ? 1 : 1.01 }}
                      whileTap={{ scale: isLoading ? 1 : 0.99 }}
                      type="submit"
                      disabled={isLoading}
                      className={`
                        w-full py-4.5 bg-primary text-zinc-950 rounded-[20px] font-black text-lg hover:brightness-110 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 mt-2
                        ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
                      `}
                    >
                      {isLoading ? (
                        <Loader2 size={24} className="animate-spin" />
                      ) : (
                        <>
                          <Sparkles size={18} strokeWidth={3} />
                          {t.admin?.signIn || 'Log In'}
                        </>
                      )}
                    </motion.button>
                  </div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>

          {/* Footer Branding */}
          <p className="mt-8 text-center text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 opacity-40">
            {t.admin?.copyright || '© 2026 Cheng-BOOM Global Pyrotechnics'}
          </p>
        </motion.div>
      </div>

      <style jsx global>{`
        body {
          overflow: hidden;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: ${theme === 'dark' ? 'white' : 'black'};
          -webkit-box-shadow: 0 0 0px 1000px ${theme === 'dark' ? '#000' : '#fff'} inset;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </>
  );
}
