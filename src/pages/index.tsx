import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { prisma } from '../lib/prisma';
import { verifyCustomerSessionToken } from '../lib/customerSession';

interface IndexRouteProps {
  businessName: string;
  logoUrl: string | null;
  canonicalUrl: string;
}

export default function IndexRoute({ businessName, logoUrl, canonicalUrl }: IndexRouteProps) {
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
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
        <p className="text-sm text-slate-600">{`Welcome to ${businessName}`}</p>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<IndexRouteProps> = async ({ req, res }) => {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');

  const userAgent = Array.isArray(req.headers['user-agent'])
    ? req.headers['user-agent'].join(' ')
    : req.headers['user-agent'] || '';
  const isLinkPreviewBot = /facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|pinterest|whatsapp|googlebot|bingbot/i.test(userAgent);

  if (!isLinkPreviewBot) {
    const session = await verifyCustomerSessionToken(req.cookies.customer_token);
    if (session) {
      const customer = await prisma.customer.findUnique({
        where: { id: session.id },
        select: { isActive: true },
      });
      if (customer?.isActive) {
        return { redirect: { destination: '/shop', permanent: false } };
      }
    }
    return { redirect: { destination: '/login', permanent: false } };
  }

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
