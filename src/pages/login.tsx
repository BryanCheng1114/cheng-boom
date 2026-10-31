import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ChevronDown, Eye, EyeOff, Globe2, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { useCart } from '../components/cart/CartProvider';
import { useBusiness } from '../context/BusinessContext';
import { useTranslation } from '../hooks/useTranslation';

function AuthContent() {
  const { clearCart } = useCart();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { settings } = useBusiness();
  const [showPassword, setShowPassword] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });

  useEffect(() => {
    if (router.query.registered) setSuccess(t.login?.successCreated || 'Account created successfully! Please sign in.');
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
        setError(result.message || (locale === 'zh' ? '请检查您的电邮和密码。' : 'Please check your email and password.'));
        return;
      }
      localStorage.setItem('user', JSON.stringify(result));
      localStorage.setItem('user_role', result.role);
      window.dispatchEvent(new Event('user-updated'));
      clearCart();
      await router.push('/shop');
    } catch {
      setError(locale === 'zh' ? '发生错误，请重试。' : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copy = locale === 'zh' ? {
    welcome: '欢迎回来', subtitle: '登录您的账户以继续', email: '电子邮箱', password: '密码', forgot: '忘记密码？', login: '登录', language: '语言',
  } : {
    welcome: 'Welcome back', subtitle: 'Sign in to continue to your account', email: 'Email address', password: 'Password', forgot: 'Forgot password?', login: 'Log in', language: 'Language',
  };

  return <>
    <Head>
      <title>{`Sign In - ${settings?.businessName || 'Cheng-BOOM'}`}</title>
      <meta name="theme-color" content="#b4232c" />
    </Head>

    <main className="min-h-screen bg-white font-sans text-slate-900">
      <section className="relative h-[35vh] min-h-[270px] max-h-[390px] bg-[#d92e20]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[120px] overflow-hidden">
          <svg className="login-wave absolute -bottom-px left-0 h-[120px] w-[200%]" viewBox="0 0 800 120" preserveAspectRatio="none">
            <path d="M0 52 C50 30 100 30 150 52 S250 74 300 52 S350 30 400 52 C450 30 500 30 550 52 S650 74 700 52 S750 30 800 52 L800 120 L0 120 Z" fill="#fff" opacity="0.32" />
            <path d="M0 68 C50 46 100 46 150 68 S250 90 300 68 S350 46 400 68 C450 46 500 46 550 68 S650 90 700 68 S750 46 800 68 L800 120 L0 120 Z" fill="white" />
          </svg>
        </div>
        <div className="absolute bottom-[-54px] left-1/2 z-10 flex h-[116px] w-[116px] -translate-x-1/2 items-center justify-center overflow-hidden rounded-full border-[7px] border-white bg-white shadow-lg">
          <img src={settings?.logoUrl || '/logo.png'} alt={`${settings?.businessName || 'Business'} logo`} className="h-full w-full object-contain p-2" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[480px] px-6 pb-12 pt-[76px] sm:px-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <header className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{copy.welcome}</h1>
            <p className="mt-2 text-sm text-slate-500">{copy.subtitle}</p>
          </header>

          {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {success && <div role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 size={17} />{success}</div>}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <label className="relative block">
              <span className="sr-only">{copy.email}</span>
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="email" required autoComplete="email" aria-label={copy.email} placeholder={copy.email} className="h-12 w-full rounded-full border-0 bg-[#f3f3f3] pl-12 pr-5 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-[#d92e20]/40" value={loginData.identifier} onChange={(event) => { const identifier = event.target.value; setLoginData({ ...loginData, identifier }); sessionStorage.setItem('sellerLoginEmail', identifier); }} />
            </label>
            <label className="relative block">
              <span className="sr-only">{copy.password}</span>
              <LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type={showPassword ? 'text' : 'password'} required autoComplete="current-password" aria-label={copy.password} placeholder={copy.password} className="h-12 w-full rounded-full border-0 bg-[#f3f3f3] pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-[#d92e20]/40" value={loginData.password} onChange={(event) => setLoginData({ ...loginData, password: event.target.value })} />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-900">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </label>
            <button type="submit" disabled={isLoading} className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#d92e20] text-sm font-semibold uppercase tracking-wide text-white shadow-[0_6px_14px_rgba(217,46,32,0.22)] transition hover:bg-[#bd251b] focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60">
              {isLoading ? <><Loader2 className="animate-spin" size={18} />{locale === 'zh' ? '正在登录…' : 'Signing in…'}</> : <>{copy.login}<ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-5 flex flex-col items-center gap-3">
            <Link href="/forgot-password" className="text-sm font-medium text-[#b4232c] underline-offset-4 hover:underline">{copy.forgot}</Link>
            <div className="relative">
              <button type="button" aria-expanded={showLanguages} onClick={() => setShowLanguages((shown) => !shown)} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-[#a51f29]">
                <Globe2 size={16} />{copy.language}<span className="text-slate-400">·</span>{locale === 'zh' ? '中文' : 'English'}<ChevronDown size={15} className={`transition-transform ${showLanguages ? 'rotate-180' : ''}`} />
              </button>
              {showLanguages && <div className="absolute left-1/2 top-full z-20 mt-2 flex min-w-36 -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-red-100 bg-white p-1.5 shadow-[0_12px_35px_rgba(80,20,20,0.14)]" role="menu" aria-label={copy.language}>
                {[{ code: 'en', label: 'English' }, { code: 'zh', label: '中文' }].map((language) => <button key={language.code} type="button" role="menuitem" onClick={() => { setShowLanguages(false); if (locale !== language.code) void router.push(router.pathname, router.asPath, { locale: language.code }); }} className={`rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-red-50 hover:text-[#aa1e27] ${locale === language.code ? 'font-semibold text-[#aa1e27]' : 'text-slate-700'}`}>{language.label}{locale === language.code ? ' ✓' : ''}</button>)}
              </div>}
            </div>
          </div>
        </motion.div>
      </section>
    </main>

    <style jsx global>{`
      input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus {
        -webkit-text-fill-color: #0f172a;
        box-shadow: 0 0 0 1000px #f8fafc inset;
        transition: background-color 9999s ease-out 0s;
      }
      .login-wave { animation: login-wave-drift 14s linear infinite; }
      @keyframes login-wave-drift { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      @media (prefers-reduced-motion: reduce) { .login-wave { animation: none; } }
    `}</style>
  </>;
}

export default AuthContent;
