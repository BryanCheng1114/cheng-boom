import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Loader2 } from 'lucide-react';

export default function IndexRoute() {
  const router = useRouter();

  useEffect(() => {
    const destination = localStorage.getItem('user') ? '/shop' : '/login';
    void router.replace(destination);
  }, [router]);

  return (
    <>
      <Head><title>Opening Shop - Cheng-BOOM</title></Head>
      <main className="flex min-h-[60vh] items-center justify-center bg-white" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-[#d92e20]" aria-label="Opening the shop" />
      </main>
    </>
  );
}
