import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Inter } from 'next/font/google';
import { cn } from '../../utils/cn';
import { useRouter } from 'next/router';
import { MobileNavigation } from './MobileNavigation';

const inter = Inter({ subsets: ['latin'] });

export function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthPage = ['/login', '/forgot-password', '/reset-password'].includes(router.pathname);

  return (
    <div className={cn("min-h-screen flex flex-col font-sans", inter.className)}>
      {!isAuthPage && <Navbar />}
      <main className="relative flex flex-1 flex-col">
        {children}
      </main>
      {!isAuthPage && <Footer />}
      {!isAuthPage && <MobileNavigation />}
    </div>
  );
}
