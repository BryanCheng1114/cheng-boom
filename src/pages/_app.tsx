import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import '../assets/globals.css';
import { CartProvider } from '../components/cart/CartProvider';
import { FlyToCartProvider } from '../components/ui/FlyToCartProvider';
import { Layout } from '../components/layout/Layout';
import { LanguageProvider } from '../context/LanguageContext';
import { BusinessProvider, useBusiness } from '../context/BusinessContext';
import Head from 'next/head';

function AppHead() {
  const { settings } = useBusiness();
  return (
    <Head>
      <link rel="icon" href={settings?.logoUrl || '/logo.png'} />
    </Head>
  );
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
            {isAdminPath ? (
              <Component {...pageProps} />
            ) : (
              <Layout>
                <Component {...pageProps} />
              </Layout>
            )}
          </FlyToCartProvider>
        </CartProvider>
      </LanguageProvider>
    </BusinessProvider>
  );
}
