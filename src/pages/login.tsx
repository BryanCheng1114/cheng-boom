import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { CheckCircle2, ChevronDown, Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { useCart } from '../components/cart/CartProvider';
import { useBusiness } from '../context/BusinessContext';

function AuthContent() {
  const { clearCart } = useCart();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { settings } = useBusiness();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });

  useEffect(() => {
    if (router.query.registered) {
      setSuccess(t.login?.successCreated || 'Account created successfully! Please sign in.');
    }
  }, [router.query.registered, t.login]);

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginData.identifier.trim().toLowerCase(), password: loginData.password }),
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.message || t.login?.loginError || 'Please check your email and password.');
        return;
      }

      localStorage.setItem('user', JSON.stringify(result));
      localStorage.setItem('user_role', result.role);
      window.dispatchEvent(new Event('user-updated'));
      clearCart();
      await router.push('/');
    } catch {
      setError(t.login?.genericError || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{`Sign In - ${settings?.businessName || 'Cheng-BOOM'}`}</title>
      </Head>

      <div className="auth-page relative min-h-screen bg-white text-zinc-900">
        <main className="absolute inset-0 flex items-center justify-center px-6 py-12 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[440px]"
          >
            <div className="mb-8">
              <h1 className="mb-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">Sign In</h1>
              <p className="text-sm leading-relaxed text-zinc-500">
                {locale === 'zh' ? '登录以查看订单，为下一场精彩庆典做好准备。' : locale === 'ms' ? 'Log masuk untuk mengurus pesanan dan bersedia untuk sambutan anda yang seterusnya.' : 'Sign in to manage your orders and get ready for your next celebration.'}
              </p>
            </div>

              {error && <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-left text-sm text-red-700">{error}</div>}
              {success && <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-left text-sm text-green-700"><CheckCircle2 size={16} /> {success}</div>}

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
                    onChange={(event) => setLoginData({ ...loginData, identifier: event.target.value })}
                  />
                </div>

                <div className="relative">
                  <LockKeyhole size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    aria-label={locale === 'zh' ? '密码' : locale === 'ms' ? 'Kata Laluan' : 'Password'}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-100 py-3 pl-11 pr-12 text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-amber-400 focus:bg-white"
                    placeholder={locale === 'zh' ? '密码' : locale === 'ms' ? 'Kata Laluan' : 'Password'}
                    value={loginData.password}
                    onChange={(event) => setLoginData({ ...loginData, password: event.target.value })}
                  />
                  <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-700">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="-mt-1 flex justify-end">
                  <Link href="/forgot-password" className="text-sm font-medium text-zinc-500 transition-colors hover:text-amber-700">
                    {locale === 'zh' ? '忘记密码？' : locale === 'ms' ? 'Lupa Kata Laluan?' : 'Forgot Password?'}
                  </Link>
                </div>

                <button type="submit" disabled={isLoading} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Sign in'}
                </button>
              </form>
          </motion.div>
        </main>

        <footer className="fixed inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-[11px] text-zinc-500 sm:px-8">
          <span className="shrink-0">Version 0.1.0</span>
          <div className="flex items-center gap-5">
            <Link href="/contact" className="font-medium text-zinc-600 transition-colors hover:text-zinc-900">{t.nav?.contact || 'Contact Us'}</Link>
            <button type="button" onClick={() => router.push(router.pathname, router.asPath, { locale: locale === 'zh' ? 'en' : 'zh' })} className="inline-flex items-center gap-1.5 font-medium text-zinc-600 transition-colors hover:text-zinc-900">
              {locale === 'zh' ? '中文' : 'English'}
              <ChevronDown size={13} />
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}

export default AuthContent;
