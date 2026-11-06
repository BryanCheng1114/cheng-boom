import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Phone, UserRound, UsersRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBusiness } from '../context/BusinessContext';
import { useTranslation } from '../hooks/useTranslation';

export default function AccountRequestPage() {
  const { locale } = useTranslation();
  const { settings } = useBusiness();
  const isZh = locale === 'zh';
  const [form, setForm] = useState({ name: '', phone: '', referredBy: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [error, setError] = useState('');
  const copy = isZh ? {
    title: '申请账户', subtitle: '留下您的联系方式，我们的团队会尽快与您联系。', name: '姓名', phone: '电话号码', referredBy: '介绍人姓名（选填）', send: '发送申请', sending: '正在发送…', successTitle: '申请已发送', successText: '感谢您联系我们。我们的团队会尽快跟进。', back: '返回登录', note: '提交申请不会自动创建账户。', error: '无法发送申请，请稍后重试。',
  } : {
    title: 'Request an account', subtitle: 'Leave your contact details and our team will get in touch soon.', name: 'Full name', phone: 'Phone number', referredBy: 'Referred by (optional)', send: 'Send request', sending: 'Sending request…', successTitle: 'Request received', successText: 'Thanks for reaching out. Our team will follow up with you soon.', back: 'Back to sign in', note: 'Sending this request does not create an account.', error: 'We could not send your request. Please try again.',
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setStatus('loading');
    try {
      const response = await fetch('/api/account-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || copy.error);
      setStatus('success');
      setForm({ name: '', phone: '', referredBy: '' });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : copy.error);
      setStatus('idle');
    }
  };

  return <>
    <Head>
      <title>{`${copy.title} - ${settings?.businessName || 'Dolphin Firework'}`}</title>
      <meta name="theme-color" content="#d52b20" />
    </Head>
    <main className="account-request-screen relative flex h-[100dvh] min-h-0 items-start justify-center overflow-hidden px-6 pb-5 text-white" style={{ height: '100dvh', background: 'linear-gradient(145deg, #e23a2b 0%, #d52b20 52%, #b51f26 100%)' }}>
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full border border-white/20 shadow-[0_0_0_32px_rgba(255,255,255,.04),0_0_0_64px_rgba(255,255,255,.03)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-44 -left-32 h-80 w-80 rounded-full border border-white/15 shadow-[0_0_0_30px_rgba(255,255,255,.035),0_0_0_60px_rgba(255,255,255,.025)]" />

      <Link href="/login" className="absolute left-6 top-5 z-20 inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-medium text-white/90 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:left-12 md:top-8" style={{ top: 'max(1rem, env(safe-area-inset-top, 0px))', left: 'max(1.5rem, env(safe-area-inset-left, 0px))' }}>
        <ArrowLeft size={17} />{copy.back}
      </Link>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className={`relative z-10 mx-auto w-full max-w-md ${status === 'success' ? 'my-auto' : 'pt-[max(5.5rem,calc(env(safe-area-inset-top)+4.5rem))]'}`}>
        {status === 'success' ? (
          <div role="status" className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30"><CheckCircle2 size={32} /></div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight">{copy.successTitle}</h1>
            <p className="mt-3 text-sm leading-6 text-white/90">{copy.successText}</p>
            <Link href="/login" className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-bold text-[#b51f26] shadow-[0_8px_22px_rgba(80,10,15,0.18)] transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40">{copy.back}<ArrowRight size={17} /></Link>
          </div>
        ) : (
          <>
            <header className="mb-6 text-center">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{copy.title}</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-5 text-white/90 md:text-base md:leading-6">{copy.subtitle}</p>
            </header>

            {error && <div role="alert" className="mb-5 rounded-xl bg-white/95 p-3.5 text-sm leading-5 text-red-700 shadow-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-left">
                <span className="mb-2 ml-1 block text-xs font-semibold text-white/90">{copy.name}</span>
                <span className="relative block"><UserRound size={18} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input required minLength={2} maxLength={100} autoComplete="name" aria-label={copy.name} placeholder={copy.name} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-12 w-full rounded-2xl border border-white/70 bg-white px-12 text-base text-slate-900 shadow-[0_5px_16px_rgba(80,10,15,0.08)] outline-none placeholder:text-slate-400 transition focus:border-white focus:ring-4 focus:ring-white/25" />
                </span>
              </label>
              <label className="block text-left">
                <span className="mb-2 ml-1 block text-xs font-semibold text-white/90">{copy.phone}</span>
                <span className="relative block"><Phone size={18} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input required type="tel" minLength={5} maxLength={40} autoComplete="tel" aria-label={copy.phone} placeholder={copy.phone} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="h-12 w-full rounded-2xl border border-white/70 bg-white px-12 text-base text-slate-900 shadow-[0_5px_16px_rgba(80,10,15,0.08)] outline-none placeholder:text-slate-400 transition focus:border-white focus:ring-4 focus:ring-white/25" />
                </span>
              </label>
              <label className="block text-left">
                <span className="mb-2 ml-1 block text-xs font-semibold text-white/90">{copy.referredBy}</span>
                <span className="relative block"><UsersRound size={18} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input maxLength={100} aria-label={copy.referredBy} placeholder={copy.referredBy} value={form.referredBy} onChange={(event) => setForm({ ...form, referredBy: event.target.value })} className="h-12 w-full rounded-2xl border border-white/70 bg-white px-12 text-base text-slate-900 shadow-[0_5px_16px_rgba(80,10,15,0.08)] outline-none placeholder:text-slate-400 transition focus:border-white focus:ring-4 focus:ring-white/25" />
                </span>
              </label>
              <button type="submit" disabled={status === 'loading'} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-bold text-[#b51f26] shadow-[0_8px_22px_rgba(80,10,15,0.18)] transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-70">
                {status === 'loading' ? <><Loader2 className="animate-spin" size={18} />{copy.sending}</> : copy.send}
              </button>
              <p className="pt-1 text-center text-xs leading-5 text-white/75">{copy.note}</p>
            </form>
          </>
        )}
      </motion.section>
      <style jsx global>{`
        html:has(.account-request-screen), body:has(.account-request-screen) { min-height:100%; background:#d52b20; }
        .account-request-screen { height:100vh; height:100dvh; overflow:hidden; }
      `}</style>
    </main>
  </>;
}
