import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import '../assets/globals.css';
import { CartProvider } from '../components/cart/CartProvider';
import { FlyToCartProvider } from '../components/ui/FlyToCartProvider';
import { Layout } from '../components/layout/Layout';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <Head>
        <link rel="icon" href="/logo.png" />
      </Head>
      <CartProvider>
        <FlyToCartProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </FlyToCartProvider>
      </CartProvider>
    </ThemeProvider>
  );
}
