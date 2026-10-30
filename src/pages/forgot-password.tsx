import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useBusiness } from '../context/BusinessContext';

export default function ForgotPassword() {
  const router = useRouter();
  const { locale } = useTranslation();
  const { settings } = useBusiness();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const isZh = locale === 'zh';
  const text = isZh ? {
    title: '忘记密码了吗？', explain: '点击下方按钮通知管理员，为您的卖家账户准备新的临时密码。', submit: '通知管理员', sending: '正在发送…', back: '返回登录', successTitle: '请求已发送', successText: '管理员已收到您的密码协助请求，将尽快联系您并提供临时密码。', note: '为保护您的账户，请勿与他人分享临时密码。', error: '发送失败，请稍后重试。', missingEmail: '请先返回登录页面并输入您的账户电邮，再点击“忘记密码”。',
  } : {
    title: 'Forgot your password?', explain: 'Tap below to notify the admin to prepare a new temporary password for your seller account.', submit: 'Notify admin', sending: 'Sending request…', back: 'Back to login', successTitle: 'Request received', successText: 'The admin has been notified and will contact you with a temporary password as soon as possible.', note: 'For your security, never share your temporary password with anyone.', error: 'Could not send your request. Please try again.', missingEmail: 'Go back to login, enter your account email, then tap “Forgot password?” again.',
  };

  useEffect(() => {
    if (!router.isReady) return;
    const queryEmail = typeof router.query.email === 'string' ? router.query.email : '';
    const savedEmail = sessionStorage.getItem('sellerLoginEmail') || '';
    setEmail((queryEmail || savedEmail).trim().toLowerCase());
  }, [router.isReady, router.query.email]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!email) {
      setError(text.missingEmail);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setError(result.message || text.error);
        return;
      }
      setSuccess(true);
    } catch {
      setError(text.error);
    } finally {
      setIsLoading(false);
    }
  };

  return <>
    <Head>
      <title>{`${text.title} - ${settings?.businessName || 'Cheng-BOOM'}`}</title>
      <meta name="theme-color" content="#d92e20" />
    </Head>
    <main className="forgot-password-screen relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12 text-white" style={{ height: '100dvh', background: 'linear-gradient(145deg, #e23a2b 0%, #d52b20 52%, #b51f26 100%)' }}>
      <div className="pointer-events-none absolute -right-16 -top-32 h-80 w-80 rounded-full border border-white/20 shadow-[0_0_0_32px_rgba(255,255,255,.04),0_0_0_64px_rgba(255,255,255,.03)]" />
      <Link href="/login" className="absolute left-6 top-5 z-10 inline-flex items-center gap-2 text-sm font-medium text-white/90 transition hover:text-white md:left-12 md:top-8" style={{ top: 'max(1.25rem, env(safe-area-inset-top, 0px))' }}>
        <ArrowLeft size={17} />{text.back}
      </Link>
      <div className="relative z-10 mx-auto w-full max-w-md text-center">
        {success ? (
          <div role="status">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30"><CheckCircle2 size={32} /></div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight md:text-3xl">{text.successTitle}</h1>
            <p className="mt-3 text-sm leading-6 text-white/90">{text.successText}</p>
            <Link href="/login" className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-white py-4 text-sm font-bold text-[#b51f26] shadow-[0_8px_22px_rgba(80,10,15,0.18)] transition hover:bg-red-50">{text.back}</Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{text.title}</h1>
            <p className="mt-3 text-sm leading-6 text-white/90 md:text-base">{text.explain}</p>
            {error && <div role="alert" className="mt-6 rounded-xl bg-white/95 p-3.5 text-left text-sm leading-5 text-red-700">{error}</div>}
            <form onSubmit={handleSubmit} className="mt-7">
              {!email && <p className="mb-4 text-sm leading-5 text-white/90">{text.missingEmail}</p>}
              <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 text-sm font-bold text-[#b51f26] shadow-[0_8px_22px_rgba(80,10,15,0.18)] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70">
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}{isLoading ? text.sending : text.submit}
              </button>
            </form>
          </>
        )}
      </div>
      <style jsx global>{`
        html:has(.forgot-password-screen), body:has(.forgot-password-screen) { min-height:100%; background:#d52b20; }
        .forgot-password-screen { height:100vh; height:100dvh; overflow:hidden; }
      `}</style>
    </main>
  </>;
}
