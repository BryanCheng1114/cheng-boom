import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { Loader2, Eye, EyeOff } from 'lucide-react';
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

      <div className="min-h-screen bg-[#0A1017] flex flex-col md:flex-row text-white font-sans relative overflow-hidden">
        
        {/* Subtle radial gradient background effect on the left side */}
        <div className="absolute top-0 left-0 w-full md:w-[40%] h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        </div>

        {/* LEFT SIDE: Form */}
        <div className="w-full md:w-[40%] flex flex-col p-6 sm:p-8 relative z-10 min-h-screen md:min-h-0 bg-[#0A1017]">
          
          <div className="w-full max-w-[400px] mx-auto flex-1 flex flex-col justify-center pb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-semibold mb-3">
                <span className="text-primary">Admin</span> Login
              </h1>
              <p className="text-zinc-400 text-sm mb-10">
                Please enter your credentials to proceed.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm font-medium animate-shake">
                  {error}
                </div>
              )}

              <motion.form 
                key="form"
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                {/* Username Input */}
                <div className="relative mt-2">
                  <label className="absolute -top-2.5 left-3 bg-[#0A1017] px-1 text-sm text-zinc-400 z-10 transition-colors">
                    Username
                  </label>
                  <input 
                    type="text"
                    required
                    disabled={isLoading || loginStatus === 'success'}
                    className="w-full bg-transparent border border-zinc-700 focus:border-primary rounded-lg px-4 py-3.5 text-white outline-none transition-colors disabled:opacity-50"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>

                {/* Password Input */}
                <div className="relative mt-2">
                  <label className="absolute -top-2.5 left-3 bg-[#0A1017] px-1 text-sm text-zinc-400 z-10 transition-colors">
                    Password
                  </label>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isLoading || loginStatus === 'success'}
                    className="w-full bg-transparent border border-zinc-700 focus:border-primary rounded-lg px-4 py-3.5 text-white outline-none transition-colors tracking-wide disabled:opacity-50"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button 
                    type="button"
                    disabled={isLoading || loginStatus === 'success'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <label className={`flex items-center gap-2.5 cursor-pointer select-none group ${(isLoading || loginStatus === 'success') ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox"
                        className="sr-only"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={isLoading || loginStatus === 'success'}
                      />
                      <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all duration-200 ${rememberMe ? 'bg-primary border-primary text-black' : 'border-zinc-600 bg-transparent group-hover:border-primary'}`}>
                        {rememberMe && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                      Remember me
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit"
                  disabled={isLoading || loginStatus === 'success'}
                  className="w-full py-3.5 bg-primary text-zinc-900 rounded-lg font-bold text-base hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-wait"
                >
                  {(isLoading || loginStatus === 'success') ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      {loginStatus === 'success' ? 'Redirecting...' : 'Signing in...'}
                    </>
                  ) : 'Sign in'}
                </button>
              </motion.form>
            </motion.div>
          </div>
        </div>

        {/* RIGHT SIDE: Image */}
        <div className="hidden md:block w-[60%] relative bg-zinc-900 border-l border-zinc-800">
          <Image 
            src="/adminlogin.jpg"
            alt="Admin Dashboard Preview"
            fill
            className="object-cover object-left"
            priority
          />
          <div className="absolute inset-0 bg-black/5 mix-blend-overlay pointer-events-none" />
        </div>

      </div>

      <style jsx global>{`
        body {
          overflow-y: auto !important;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: white;
          -webkit-box-shadow: 0 0 0px 1000px #0A1017 inset;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </>
  );
}
