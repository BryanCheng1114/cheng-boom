import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { Lock, Eye, EyeOff, Terminal, AlertCircle, ShieldAlert } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState<'idle' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

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
          router.push('/admin/dashboard');
        }, 1500);
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{`Secure Admin Portal - Cheng-BOOM`}</title>
      </Head>

      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Deep background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-primary/5 rounded-full blur-[160px]" />
          <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px] p-4 relative z-10"
        >
          {/* Header Section - Clean & Minimal */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white tracking-[0.15em] mb-3 uppercase flex items-center justify-center gap-3">
              {t.admin.loginTitle}
            </h1>
            <div className="h-1 w-20 bg-primary mx-auto rounded-full mb-6" />
            <p className="text-zinc-500 font-bold text-[11px] uppercase tracking-widest px-8 leading-relaxed opacity-80">
              {t.admin.loginSubtitle}
            </p>
          </div>

          {/* Secure Login Container */}
          <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[32px] p-8 md:p-10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden group">
            {/* Animated focus light */}
            <div className="absolute -top-px left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-scan-fast" />

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {/* Username Input */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 ml-1">
                  {t.admin.usernameLabel}
                </label>
                <div className="relative group/input">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within/input:text-primary transition-colors duration-300">
                    <Terminal size={18} strokeWidth={2.5} />
                  </div>
                  <input 
                    type="text"
                    required
                    className="w-full pl-14 pr-6 py-4.5 rounded-2xl bg-black/60 border border-white/5 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-300 font-bold text-white placeholder:text-zinc-800 tracking-wide"
                    placeholder={t.admin.usernamePlaceholder}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 ml-1">
                  {t.admin.passwordLabel}
                </label>
                <div className="relative group/input">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within/input:text-primary transition-colors duration-300">
                    <Lock size={18} strokeWidth={2.5} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full pl-14 pr-14 py-4.5 rounded-2xl bg-black/60 border border-white/5 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-300 font-bold text-white placeholder:text-zinc-800 tracking-widest"
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-primary transition-colors duration-300 p-2"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-xs font-bold"
                >
                  <AlertCircle size={14} />
                  {error}
                </motion.div>
              )}

              {/* Action Button */}
              <motion.button 
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                type="submit"
                disabled={isLoading}
                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 mt-4 relative overflow-hidden group/btn transition-all ${
                  isLoading ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-primary text-zinc-950 shadow-primary/20 hover:brightness-110'
                }`}
              >
                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500" />
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" />
                ) : (
                  <ShieldAlert size={18} strokeWidth={3} className="relative z-10" />
                )}
                <span className="relative z-10">
                  {isLoading ? 'Verifying...' : t.admin.signIn}
                </span>
              </motion.button>
            </form>

            {/* Monitoring Notice */}
            <div className="mt-10 pt-8 border-t border-white/5 flex items-start gap-4 opacity-40 hover:opacity-100 transition-opacity duration-500">
              <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.15em] leading-relaxed">
                {t.admin.securityNotice}
              </p>
            </div>
          </div>

          {/* System Footer */}
          <div className="mt-8 flex flex-col items-center gap-2">
            <p className="text-center text-[9px] font-black uppercase tracking-[0.4em] text-zinc-700">
              TERMINAL ACCESS // SECURE NODE
            </p>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes scan-fast {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-scan-fast {
          animation: scan-fast 3s ease-in-out infinite;
        }
        body {
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
