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
      <meta name="apple-mobile-web-app-title" content={settings?.businessName || 'Cheng-BOOM'} />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="theme-color" content={hasRedHeader ? '#d52b20' : '#ffffff'} />
    </Head>
  );
}

function CustomerSessionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [verifiedPath, setVerifiedPath] = useState('');
  const path = router.pathname.replace(/^\/(en|zh)(?=\/|$)/, '') || '/';
  const isAdminPath = path === '/admin' || path.startsWith('/admin/');
  const isPublicPath = ['/', '/login', '/forgot-password', '/reset-password'].includes(path);
  const requiresCustomerSession = !isAdminPath && !isPublicPath;

  useEffect(() => {
    if (!router.isReady || !requiresCustomerSession) return;
    let active = true;
    setVerifiedPath('');
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((response) => {
        if (!active) return;
        if (!response.ok) {
          const next = encodeURIComponent(router.asPath);
          void router.replace(`/login?next=${next}`);
          return;
        }
        setVerifiedPath(router.pathname);
      })
      .catch(() => {
        if (active) void router.replace('/login');
      });
    return () => { active = false; };
  }, [router, requiresCustomerSession]);

  if (requiresCustomerSession && verifiedPath !== router.pathname) {
    return <main className="flex min-h-screen items-center justify-center bg-white" aria-label="Checking sign-in"><Loader2 className="h-6 w-6 animate-spin text-[#d92e20]" /></main>;
  }
  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAdminPath = router.pathname.startsWith('/admin');

  return (
    <BusinessProvider>
      <LanguageProvider>
        <AppHead />
        <CartProvider>
          <FlyToCartProvider>
            <CustomerSessionGate>
              {isAdminPath ? <Component {...pageProps} /> : <Layout><Component {...pageProps} /></Layout>}
            </CustomerSessionGate>
          </FlyToCartProvider>
        </CartProvider>
      </LanguageProvider>
    </BusinessProvider>
  );
}
