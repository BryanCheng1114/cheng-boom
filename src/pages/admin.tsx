import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Globe2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '../context/LanguageContext';

const loginCopy = {
  en: {
    title: 'Admin Portal',
    subtitle: 'Sign in to manage your Cheng-BOOM store.',
    username: 'User ID',
    usernamePlaceholder: 'Enter your admin ID',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    remember: 'Remember me',
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    redirecting: 'Redirecting…',
    browserNote: 'For the best experience, use Chrome or Safari.',
    imageTitle: 'Admin Management',
    imageDescription: 'Manage products, inventory, orders, and store settings in one place.',
    pageTitle: 'Admin Portal | Cheng-BOOM',
  },
  zh: {
    title: '管理后台',
    subtitle: '登录以管理 Cheng-BOOM 商店。',
    username: '管理员账号',
    usernamePlaceholder: '请输入管理员账号',
    password: '密码',
    passwordPlaceholder: '请输入密码',
    remember: '记住我',
    signIn: '登录',
    signingIn: '正在登录…',
    redirecting: '正在跳转…',
    browserNote: '建议使用 Chrome 或 Safari 浏览器。',
    imageTitle: '管理中心',
    imageDescription: '在一个地方管理商品、库存、订单和店铺设置。',
    pageTitle: '管理后台 | Cheng-BOOM',
  },
} as const;

export default function AdminLogin() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const copy = language === 'zh' ? loginCopy.zh : loginCopy.en;
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState<'idle' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const remembered = localStorage.getItem('admin_remembered_username');
    if (remembered) {
      setFormData((previous) => ({ ...previous, username: remembered }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Invalid credentials');

      if (rememberMe) localStorage.setItem('admin_remembered_username', formData.username);
      else localStorage.removeItem('admin_remembered_username');
      if (data.user?.theme) localStorage.setItem('theme', data.user.theme);
      if (data.user?.language) localStorage.setItem('admin_selected_language', data.user.language);

      setLoginStatus('success');
      window.setTimeout(() => { window.location.href = '/admin/dashboard'; }, 1200);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{copy.pageTitle}</title>
        <meta name="description" content={copy.subtitle} />
      </Head>

      <main className="grid min-h-screen bg-white font-sans text-slate-800 md:grid-cols-[56%_44%]">
        <section className="relative hidden min-h-screen flex-col items-center justify-center p-6 md:flex lg:p-8">
          <div className="mb-8 w-full text-left sm:mb-10">
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-black sm:text-4xl">{copy.imageTitle}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:mt-4 sm:text-base">{copy.imageDescription}</p>
          </div>
          <div className="relative h-[50vh] max-h-[520px] min-h-[260px] w-full overflow-hidden bg-slate-100">
            <Image src="/adminlogin.jpg" alt="Cheng-BOOM" fill priority sizes="54vw" className="object-cover" />
          </div>
          <p className="mt-3 w-full text-left text-[10px] text-slate-500">© 2026 All rights reserved.</p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-6 py-12 md:px-10 lg:px-14">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-[360px]">
            <header className="mb-12 text-center">
              <h1 className="text-[32px] font-bold leading-tight tracking-tight text-slate-800">{copy.title}</h1>
              <p className="mt-2 text-sm text-slate-600">Cheng-BOOM</p>
            </header>

            {error && <div role="alert" className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-500">{copy.username}</span>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  disabled={isLoading || loginStatus === 'success'}
                  placeholder={copy.usernamePlaceholder}
                  value={formData.username}
                  onChange={(event) => setFormData({ ...formData, username: event.target.value })}
                  className="h-11 w-full border-0 border-b border-slate-300 bg-transparent px-0 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-0 disabled:opacity-60"
                />
              </label>

              <label className="relative block">
                <span className="mb-2 block text-xs font-medium text-slate-500">{copy.password}</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  disabled={isLoading || loginStatus === 'success'}
                  placeholder={copy.passwordPlaceholder}
                  value={formData.password}
                  onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                  className="h-11 w-full border-0 border-b border-slate-300 bg-transparent px-0 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-0 disabled:opacity-60"
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute bottom-3 right-1 text-slate-500 hover:text-slate-800">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </label>

              <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs text-slate-600">
                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} disabled={isLoading || loginStatus === 'success'} className="h-3.5 w-3.5 accent-blue-600" />
                {copy.remember}
              </label>

              <button type="submit" disabled={isLoading || loginStatus === 'success'} className="mt-1 flex h-11 w-full items-center justify-center gap-2 border border-blue-600 bg-white text-xs font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60">
                {(isLoading || loginStatus === 'success') && <Loader2 size={15} className="animate-spin" />}
                {loginStatus === 'success' ? copy.redirecting : isLoading ? copy.signingIn : copy.signIn}
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center gap-4 text-center">
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <Globe2 size={14} />
                <select aria-label="Language" value={language === 'zh' ? 'zh' : 'en'} onChange={(event) => { void setLanguage(event.target.value as 'en' | 'zh'); }} className="cursor-pointer border-0 bg-transparent pr-1 text-xs text-slate-700 outline-none focus:ring-0">
                  <option value="en">English</option>
                  <option value="zh">简体中文</option>
                </select>
              </label>
              <p className="text-[10px] text-slate-500">{copy.browserNote}</p>
            </div>
          </motion.div>
        </section>
      </main>
    </>
  );
}
