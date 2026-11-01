import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Loader2 } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import { prisma } from '../lib/prisma';

interface IndexRouteProps {
  businessName: string;
  logoUrl: string | null;
  canonicalUrl: string;
}

export default function IndexRoute({ businessName, logoUrl, canonicalUrl }: IndexRouteProps) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((response) => {
        if (cancelled) return;
        void router.replace(response.ok ? '/shop' : '/login');
      })
      .catch(() => {
        if (!cancelled) void router.replace('/login');
      });
    return () => { cancelled = true; };
  }, [router]);

  return (
    <>
      <Head>
        <title>{businessName}</title>
        <meta name="description" content={`Sign in to browse the ${businessName} store.`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={businessName} />
        <meta property="og:description" content={`Browse products and offers from ${businessName}. Sign in to continue.`} />
        <meta property="og:url" content={canonicalUrl} />
        {logoUrl && <meta property="og:image" content={logoUrl} />}
        {logoUrl && <meta property="og:image:alt" content={`${businessName} logo`} />}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={businessName} />
        {logoUrl && <meta name="twitter:image" content={logoUrl} />}
      </Head>
      <main className="flex min-h-[60vh] items-center justify-center bg-white" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-[#d92e20]" aria-label="Opening the shop" />
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<IndexRouteProps> = async ({ req, res }) => {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  const settings = await prisma.businessSettings.findFirst({ select: { businessName: true, logoUrl: true } });
  const businessName = settings?.businessName?.trim() || 'Cheng-BOOM';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || (host.toString().startsWith('localhost') ? 'http' : 'https');
  const firstHost = (Array.isArray(host) ? host[0] : host).split(',')[0].trim();
  const firstProtocol = (Array.isArray(protocol) ? protocol[0] : protocol).split(',')[0].trim();
  const origin = `${firstProtocol}://${firstHost}`;
  const logoUrl = settings?.logoUrl ? new URL(settings.logoUrl, origin).toString() : null;

  return { props: { businessName, logoUrl, canonicalUrl: origin } };
};
