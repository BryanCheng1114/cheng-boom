import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { WhatsAppButton } from '../ui/WhatsAppButton';
import { Inter } from 'next/font/google';
import { cn } from '../../utils/cn';
import { useRouter } from 'next/router';

const inter = Inter({ subsets: ['latin'] });

export function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isLoginPage = router.pathname === '/login';

  return (
    <div className={cn("min-h-screen flex flex-col font-sans", inter.className)}>
      {!isLoginPage && <Navbar />}
      <main className="flex-1 flex flex-col relative">
        {children}
      </main>
      {!isLoginPage && <Footer />}
      {!isLoginPage && <WhatsAppButton />}
    </div>
  );
}
