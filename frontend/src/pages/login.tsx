import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { Mail, Lock, ArrowLeft, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function Login() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    account: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', formData);
  };

  return (
    <>
      <Head>
        <title>{`${t.login.signIn} - Cheng-BOOM`}</title>
      </Head>

      <div className="h-screen bg-background flex flex-col relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]" />
        </div>

        {/* Top Navigation */}
        <div className="relative z-20 p-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-primary transition-all font-bold group text-sm"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            {t.login.backToHome}
          </Link>
        </div>

        {/* Centered Form */}
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-[440px]"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">
                {t.login.title}
              </h1>
              <p className="text-muted-foreground font-medium text-sm">
                {t.login.subtitle}
              </p>
            </div>

            {/* Login Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border border-border rounded-[40px] p-8 md:p-10 shadow-2xl shadow-black/5"
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Account */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                    {t.login.labelAccount}
                  </label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors">
                      <Mail size={18} strokeWidth={2.5} />
                    </div>
                    <input 
                      type="text"
                      required
                      className="w-full pl-14 pr-6 py-4 rounded-2xl bg-zinc-100/50 dark:bg-zinc-950/50 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold"
                      placeholder={t.login.placeholderAccount}
                      value={formData.account}
                      onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                    {t.login.labelPassword}
                  </label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors">
                      <Lock size={18} strokeWidth={2.5} />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full pl-14 pr-14 py-4 rounded-2xl bg-zinc-100/50 dark:bg-zinc-950/50 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold"
                      placeholder={t.login.placeholderPassword}
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

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between px-1 text-[11px] font-bold uppercase tracking-wider">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" className="peer sr-only" />
                      <div className="w-4 h-4 border-2 border-border rounded peer-checked:bg-primary peer-checked:border-primary transition-all" />
                      <div className="absolute opacity-0 peer-checked:opacity-100 transition-opacity">
                        <svg className="w-3 h-3 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">Remember Me</span>
                  </label>
                  <button type="button" className="text-primary underline underline-offset-4 decoration-primary/30">
                    {t.login.forgotPassword}
                  </button>
                </div>

                {/* Submit */}
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  className="w-full py-4.5 bg-primary text-zinc-900 rounded-[20px] font-black text-lg hover:brightness-110 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 mt-2"
                >
                  <Sparkles size={18} strokeWidth={3} />
                  {t.login.signIn}
                </motion.button>
              </form>

              {/* Registration Hint */}
              <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-2">
                <p className="text-[13px] font-medium text-muted-foreground">
                  {t.login.noAccount}
                </p>
                <Link 
                  href="/contact"
                  className="text-[13px] font-black text-primary hover:brightness-125 transition-all underline underline-offset-4 decoration-primary/30"
                >
                  {t.login.signUp}
                </Link>
              </div>
            </motion.div>

            {/* Footer */}
            <p className="mt-8 text-center text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 opacity-40">
              © 2026 Cheng-BOOM Global Pyrotechnics
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
