import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import '../assets/globals.css';
import { CartProvider } from '../components/cart/CartProvider';
import { FlyToCartProvider } from '../components/ui/FlyToCartProvider';
import { Layout } from '../components/layout/Layout';
import { LanguageProvider } from '../context/LanguageContext';
import { BusinessProvider, useBusiness } from '../context/BusinessContext';
import Head from 'next/head';
import { getPwaIconUrl } from '../utils/pwa';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

function AppHead() {
  const { settings, isLoading } = useBusiness();
  const router = useRouter();
  const redHeaderRoutes = ['/shop', '/shop/[id]', '/cart', '/profile', '/about', '/contact', '/safety'];
  const hasRedHeader = router.isReady && redHeaderRoutes.includes(router.pathname);
  return (
    <Head>
      <link rel="manifest" href="/api/pwa-manifest" />
      {!isLoading && (settings?.logoUrl || settings?.faviconUrl) && <link rel="icon" href={settings?.logoUrl || settings?.faviconUrl || undefined} />}
      {!isLoading && (settings?.logoUrl || settings?.faviconUrl) && <link rel="apple-touch-icon" href={getPwaIconUrl(settings?.logoUrl || settings?.faviconUrl, 180)} />}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content={settings?.businessName || 'Dolphin Firework'} />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="theme-color" content={hasRedHeader ? '#d52b20' : '#ffffff'} />
    </Head>
  );
}

function CustomerSessionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [hasVerifiedSession, setHasVerifiedSession] = useState(false);
  const path = router.pathname.replace(/^\/(en|zh)(?=\/|$)/, '') || '/';
  const isAdminPath = path === '/admin' || path.startsWith('/admin/');
  const isPublicPath = ['/', '/login', '/forgot-password', '/reset-password', '/account-request'].includes(path);
  const requiresCustomerSession = !isAdminPath && !isPublicPath;

  useEffect(() => {
    if (!router.isReady || !requiresCustomerSession || hasVerifiedSession) return;
    let active = true;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((response) => {
        if (!active) return;
        if (!response.ok) {
          const next = encodeURIComponent(router.asPath);
          void router.replace(`/login?next=${next}`);
          return;
        }
        setHasVerifiedSession(true);
      })
      .catch(() => {
        if (active) void router.replace('/login');
      });
    return () => { active = false; };
  }, [router.isReady, requiresCustomerSession, hasVerifiedSession]);

  if (requiresCustomerSession && !hasVerifiedSession) {
    return <main className="flex min-h-screen items-center justify-center bg-white" aria-label="Checking sign-in"><Loader2 className="h-6 w-6 animate-spin text-[#d92e20]" /></main>;
  }
  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAdminPath = router.pathname.startsWith('/admin');
  const [isEnteringShop, setIsEnteringShop] = useState(false);

  useEffect(() => {
    const isMobile = () => window.matchMedia('(max-width: 767px)').matches;
    const handleStart = (url: string) => {
      const destination = new URL(url, window.location.origin).pathname.replace(/^\/(en|zh|ms)(?=\/|$)/, '') || '/';
      const current = new URL(window.location.href).pathname.replace(/^\/(en|zh|ms)(?=\/|$)/, '') || '/';
      if (isMobile() && destination === '/shop' && !current.startsWith('/shop')) setIsEnteringShop(true);
    };
    const clear = () => setIsEnteringShop(false);
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', clear);
    router.events.on('routeChangeError', clear);
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', clear);
      router.events.off('routeChangeError', clear);
    };
  }, [router]);

  return (
    <BusinessProvider>
      <LanguageProvider>
        <AppHead />
        <CartProvider>
          <FlyToCartProvider>
            <CustomerSessionGate>
              {isAdminPath ? <Component {...pageProps} /> : <Layout><Component {...pageProps} /></Layout>}
            </CustomerSessionGate>
            {isEnteringShop && <div className="fixed inset-0 z-[500] flex items-center justify-center bg-white md:hidden" role="status" aria-label="Loading"><Loader2 className="h-8 w-8 animate-spin text-[#d52b20]" /></div>}
          </FlyToCartProvider>
        </CartProvider>
      </LanguageProvider>
    </BusinessProvider>
  );
}
