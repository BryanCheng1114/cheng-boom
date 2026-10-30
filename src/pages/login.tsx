import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { ArrowRight, CheckCircle2, ChevronDown, Eye, EyeOff, Globe2, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { useCart } from '../components/cart/CartProvider';
import { useBusiness } from '../context/BusinessContext';

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
    event.preventDefault(); setIsLoading(true); setError(''); setSuccess('');
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: loginData.identifier.trim().toLowerCase(), password: loginData.password }) });
      const result = await response.json();
      if (!response.ok) { setError(result.message || (locale === 'zh' ? '请检查您的电邮和密码。' : 'Please check your email and password.')); return; }
      localStorage.setItem('user', JSON.stringify(result)); localStorage.setItem('user_role', result.role); window.dispatchEvent(new Event('user-updated')); clearCart(); await router.push('/shop');
    } catch { setError(locale === 'zh' ? '发生错误，请重试。' : 'An error occurred. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const copy = locale === 'zh' ? {
    welcome: '欢迎回来', email: '电子邮箱', password: '密码', forgot: '忘记密码？', login: '登录', language: '语言',
  } : {
    welcome: 'Welcome back', email: 'Email address', password: 'Password', forgot: 'Forgot password?', login: 'Log in', language: 'Language',
  };

  return <>
    <Head><title>{`Seller Sign In - ${settings?.businessName || 'Cheng-BOOM'}`}</title><meta name="theme-color" content="#d92e20" /></Head>
    <div className="seller-login min-h-screen bg-[#faf9f7] text-zinc-900">
      <main className="relative flex min-h-screen w-full flex-col overflow-hidden bg-white shadow-[0_24px_100px_rgba(54,23,20,0.10)] md:min-h-screen md:flex-col">
        <section className="seller-login-hero relative flex min-h-[300px] shrink-0 flex-col items-center justify-center overflow-hidden px-8 pb-14 pt-14 text-center text-white md:w-full md:pb-14">
          <div className="seller-orb seller-orb-one" /><div className="seller-orb seller-orb-two" />
          <div aria-hidden="true" className="seller-login-dots seller-login-dots-left" />
          <div aria-hidden="true" className="seller-login-dots seller-login-dots-right" />
          <div className="relative z-10 mx-auto max-w-lg">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">{locale === 'zh' ? '让每场庆典' : 'Make every'}<br />{locale === 'zh' ? '都闪耀夺目' : <span className="text-[#ffd6a5]">celebration shine.</span>}</h1>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-white/75 sm:text-base">{locale === 'zh' ? '欢迎回到您的 Cheng-BOOM 卖家账户。' : 'Your store, your customers, and every order in one bright place.'}</p>
          </div>
          <div className="seller-wave" />
        </section>

        <section className="relative z-10 -mt-8 flex flex-1 flex-col items-center rounded-t-[30px] bg-white px-6 pb-8 pt-1 md:mt-0 md:justify-center md:rounded-none md:px-12 md:pt-12 lg:px-20">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="seller-login-card w-full max-w-[430px]">
            <div className="flex flex-col items-center text-center">
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]">{copy.welcome}</h2>
            </div>

            {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">{error}</div>}
            {success && <div role="status" className="mt-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3.5 text-sm text-green-700"><CheckCircle2 size={17} />{success}</div>}

            <form onSubmit={handleLoginSubmit} className="seller-login-form mt-7 space-y-5">
              <label className="seller-login-field relative block">
                <span className="seller-login-field-label">{copy.email}</span><Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type="email" required autoComplete="email" aria-label={copy.email} placeholder={copy.email} className="seller-login-input w-full rounded-full border border-transparent bg-[#f4f4f4] py-[15px] pl-12 pr-5 text-[15px] text-zinc-900 outline-none transition placeholder:text-zinc-500 focus:border-[#dc4a3d] focus:bg-white" value={loginData.identifier} onChange={(event) => { const identifier = event.target.value; setLoginData({ ...loginData, identifier }); sessionStorage.setItem('sellerLoginEmail', identifier); }} />
              </label>
              <label className="seller-login-field relative block">
                <span className="seller-login-field-label">{copy.password}</span><LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type={showPassword ? 'text' : 'password'} required autoComplete="current-password" aria-label={copy.password} placeholder={copy.password} className="seller-login-input w-full rounded-full border border-transparent bg-[#f4f4f4] py-[15px] pl-12 pr-12 text-[15px] text-zinc-900 outline-none transition placeholder:text-zinc-500 focus:border-[#dc4a3d] focus:bg-white" value={loginData.password} onChange={(event) => setLoginData({ ...loginData, password: event.target.value })} />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
              </label>
              <div className="seller-login-forgot flex justify-end px-1"><Link href="/forgot-password" className="text-sm font-medium text-[#c93225] hover:text-[#a92219]">{copy.forgot}</Link></div>
              <button type="submit" disabled={isLoading} className="seller-login-button mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#aa1e27] py-[15px] text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_8px_18px_rgba(170,30,39,0.20)] transition hover:bg-[#951b23] disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? <Loader2 className="animate-spin" size={19} /> : <>{copy.login}<ArrowRight size={21} strokeWidth={2.2} /></>}</button>
            </form>

            <div className="seller-login-language relative mt-4 flex justify-center">
              <button type="button" aria-expanded={showLanguages} onClick={() => setShowLanguages((shown) => !shown)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"><Globe2 size={16} />{copy.language}<span className="text-zinc-400">·</span>{locale === 'zh' ? '中文' : 'English'}<ChevronDown size={15} className={`transition-transform ${showLanguages ? 'rotate-180' : ''}`} /></button>
              {showLanguages && <div className="absolute bottom-full z-20 mb-2 flex min-w-40 flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white p-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.14)]" role="menu" aria-label={copy.language}>
                {[{ code: 'en', label: 'English' }, { code: 'zh', label: '中文' }].map((language) => <button key={language.code} type="button" role="menuitem" onClick={() => { setShowLanguages(false); if (locale !== language.code) void router.push(router.pathname, router.asPath, { locale: language.code }); }} className={`rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-red-50 hover:text-[#aa1e27] ${locale === language.code ? 'font-semibold text-[#aa1e27]' : 'text-zinc-700'}`}>{language.label}{locale === language.code ? ' ✓' : ''}</button>)}
              </div>}
            </div>
          </motion.div>
        </section>
      </main>
      <style jsx global>{`
        html:has(.seller-login), body:has(.seller-login) { min-height:100%; background:#fff; }
        .seller-login { min-height:100vh; min-height:100dvh; width:100%; background:#faf9f7; }
        .seller-login > main { min-height:100vh; min-height:100dvh; }
        .seller-login-hero { background: linear-gradient(145deg, #e23a2b 0%, #d52b20 52%, #b51f26 100%); }
        @media (max-width:767px) {
          html:has(.seller-login), body:has(.seller-login) { height:100%; overflow:hidden; }
          .seller-login { height:100vh; height:100dvh; min-height:0; overflow:hidden; }
          .seller-login > main { height:100vh; height:100dvh; min-height:0; }
          .seller-login-hero { flex:0 0 30%; min-height:0; padding:20px 24px 38px; }
          .seller-login-hero h1 { font-size:clamp(27px, 7vw, 34px); line-height:1.12; }
          .seller-login-hero p { margin-top:9px; font-size:13px; line-height:1.35; }
          .seller-login > main > section:last-child { min-height:0; justify-content:center; padding:10px 24px max(12px, env(safe-area-inset-bottom)); }
          .seller-login > main > section:last-child > div { position:relative; top:-20px; max-width:390px; }
          .seller-login > main > section:last-child h2 { margin-top:0; font-size:24px; }
          .seller-login > main > section:last-child p { margin-top:5px; font-size:13px; line-height:1.4; }
          .seller-login-form { display:flex; flex-direction:column; margin-top:18px; gap:13px; }
          .seller-login-form > * { margin:0 !important; }
          .seller-login-forgot { margin-bottom:9px !important; }
          .seller-login-form .seller-login-button { margin-top:7px !important; }
          .seller-login-language { margin-top:24px !important; }
          .seller-login-input { height:50px; }
          .seller-login-button { min-height:50px; padding-top:12px; padding-bottom:12px; }
        }
        @media (max-width:767px) and (max-height:700px) {
          .seller-login-hero { flex-basis:27%; padding-top:12px; padding-bottom:30px; }
          .seller-login-hero p { display:none; }
          .seller-login > main > section:last-child { padding-top:6px; padding-bottom:max(8px, env(safe-area-inset-bottom)); }
          .seller-login > main > section:last-child > div { top:-12px; }
          .seller-login > main > section:last-child h2 { font-size:22px; }
          .seller-login-form { margin-top:12px; gap:10px; }
          .seller-login-forgot { margin-bottom:6px !important; }
          .seller-login-form .seller-login-button { margin-top:5px !important; }
          .seller-login-language { margin-top:18px !important; }
          .seller-login-input { height:46px; }
          .seller-login-button { min-height:46px; }
        }
        .seller-login-hero:before { content:''; position:absolute; inset:0; background: radial-gradient(ellipse at 25% 25%, rgba(255,206,171,.2), transparent 42%), radial-gradient(ellipse at 78% 72%, rgba(111,12,27,.23), transparent 40%); }
        .seller-login-field-label { display:none; }
        .seller-orb { position:absolute; border:1px solid rgba(255,255,255,.17); border-radius:50%; }
        .seller-orb-one { width:360px;height:360px;right:-100px;top:-180px;box-shadow:0 0 0 32px rgba(255,255,255,.035),0 0 0 64px rgba(255,255,255,.025); }
        .seller-orb-two { width:220px;height:220px;left:-100px;bottom:6%;box-shadow:0 0 0 24px rgba(255,255,255,.035); }
        .seller-wave { position:absolute; z-index:1; left:-10%; right:-10%; bottom:-2px; height:58px; background:#fff; clip-path:polygon(0 30%,22% 58%,44% 100%,65% 72%,82% 48%,100% 34%,100% 100%,0 100%); }
        @media (max-width:767px) { .seller-wave { animation:seller-wave-motion 3.8s cubic-bezier(.45,0,.55,1) infinite; } }
        @media (min-width:768px) {
          .seller-login { position:relative; isolation:isolate; background:#fff; }
          .seller-login:before { content:''; position:absolute; inset:0; z-index:0; pointer-events:none; background:radial-gradient(circle at 0% 100%, transparent 0 145px,rgba(230,53,58,.045) 146px 184px,transparent 185px 218px,rgba(230,53,58,.035) 219px 234px,transparent 235px),radial-gradient(circle at 100% 100%, transparent 0 165px,rgba(230,53,58,.045) 166px 204px,transparent 205px 238px,rgba(230,53,58,.035) 239px 254px,transparent 255px); }
          .seller-login > main { position:relative; z-index:1; background:transparent; box-shadow:none; }
          .seller-login-hero { height:34vh; height:34dvh; min-height:260px; max-height:360px; flex:0 0 auto; padding-bottom:56px; }
          .seller-login-hero h1 { font-size:clamp(44px,4vw,56px); line-height:1.08; }
          .seller-login-hero p { margin-top:20px; font-size:16px; line-height:1.55; }
          .seller-login-dots { position:absolute; z-index:2; width:68px; height:52px; pointer-events:none; background-image:radial-gradient(circle,rgba(255,255,255,.48) 2px,transparent 2.6px); background-size:19px 19px; }
          .seller-login-dots-left { left:9%; top:24%; }
          .seller-login-dots-right { right:10%; bottom:22%; }
          .seller-wave { left:-10%; right:-10%; top:auto; bottom:-2px; width:auto; height:68px; clip-path:polygon(0 18%,15% 37%,30% 54%,45% 67%,60% 70%,75% 62%,90% 35%,100% 12%,100% 100%,0 100%); animation:seller-wave-motion 3.8s cubic-bezier(.45,0,.55,1) infinite; }
          .seller-login > main > section:last-child { justify-content:flex-start; padding:28px 24px 32px; }
          .seller-login > main > section:last-child { background:transparent; }
          .seller-login-card { width:min(610px,calc(100vw - 48px)); max-width:none; padding:25px 42px 23px; border:1px solid #f0f1f4; border-radius:18px; background:rgba(255,255,255,.96); box-shadow:0 18px 48px rgba(26,38,58,.10); }
          .seller-login > main > section:last-child .seller-login-card { width:min(610px,calc(100vw - 48px)); max-width:none; }
          .seller-login-card h2 { margin:0 0 20px; font-size:30px; line-height:1.2; color:#202938; }
          .seller-login-form { display:flex; width:100%; max-width:none; flex-direction:column; gap:20px; margin:0; }
          .seller-login-form > * { margin:0 !important; }
          .seller-login-field { height:67px; overflow:hidden; border:1px solid #e1e5ec; border-radius:22px; background:#fafafb; transition:border-color .2s, box-shadow .2s; }
          .seller-login-field:focus-within { border-color:#f07b74; box-shadow:0 0 0 3px rgba(217,46,32,.08); }
          .seller-login-field-label { position:absolute; z-index:1; top:10px; left:68px; display:block; color:#7b8391; font-size:12px; line-height:1.2; }
          .seller-login-field > svg { left:19px; color:#596273; }
          .seller-login-input { height:100%; padding:26px 48px 7px 68px; border:0; border-radius:22px; background:transparent; box-shadow:none; font-size:15px; line-height:1.25; }
          .seller-login-input::placeholder { color:transparent; }
          .seller-login-input:focus { border:0; background:transparent; box-shadow:none; }
          .seller-login-field > button { right:18px; color:#596273; }
          .seller-login-forgot { margin:0 2px -2px !important; }
          .seller-login-forgot a { color:#e32d26; font-size:14px; }
          .seller-login-form .seller-login-button { min-height:58px; margin:0 !important; border-radius:22px; font-size:15px; }
          .seller-login-language { margin-top:17px !important; }
          .seller-login-language:before { content:''; position:absolute; top:-9px; left:20%; right:20%; height:1px; background:linear-gradient(90deg,transparent,#edf0f4,transparent); }
        }
        @keyframes seller-wave-motion {
          0%,100% { clip-path:polygon(0 18%,15% 37%,30% 54%,45% 67%,60% 70%,75% 62%,90% 35%,100% 12%,100% 100%,0 100%); }
          50% { clip-path:polygon(0 24%,15% 46%,30% 64%,45% 74%,60% 72%,75% 56%,90% 26%,100% 7%,100% 100%,0 100%); }
        }
        @media (prefers-reduced-motion:reduce) { .seller-wave { animation:none !important; } }
        .seller-login-input { display:block; box-sizing:border-box; width:100%; height:54px; min-width:0; padding:0 48px; border-radius:9999px; font-size:16px; line-height:1.25; appearance:none; box-shadow:inset 0 1px 2px rgba(0,0,0,.025); }
        .seller-login-input:-webkit-autofill, .seller-login-input:-webkit-autofill:hover, .seller-login-input:-webkit-autofill:focus { -webkit-text-fill-color:#18181b; box-shadow:0 0 0 1000px #f4f4f4 inset; transition:background-color 9999s ease-out 0s; }
        .seller-login-button, .seller-login-button:visited { background:#d92e20 !important; background:linear-gradient(145deg,#e23a2b 0%,#d52b20 52%,#b51f26 100%) !important; color:#fff !important; border:0; cursor:pointer; }
        .seller-login-button:hover:not(:disabled) { filter:brightness(.95); }
        .seller-login-button:disabled { background:linear-gradient(145deg,#e23a2b 0%,#d52b20 52%,#b51f26 100%) !important; color:#fff !important; opacity:.7; }
        @media (min-width:768px) {
          .seller-login-field .seller-login-input { height:100%; padding:26px 48px 7px 68px; border:0; border-radius:22px; background:transparent; box-shadow:none; font-size:15px; line-height:1.25; }
          .seller-login-field .seller-login-input::placeholder { color:transparent; }
          .seller-login-field .seller-login-input:focus { border:0; background:transparent; box-shadow:none; }
        }
      `}</style>
    </div>
  </>;
}

export default AuthContent;
