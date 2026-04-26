import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { WhatsAppButton } from '../ui/WhatsAppButton';
import { MusicToggle } from '../ui/MusicToggle';
import { Inter } from 'next/font/google';
import { cn } from '../../utils/cn';

const inter = Inter({ subsets: ['latin'] });

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn("min-h-screen flex flex-col font-sans", inter.className)}>
      <Navbar />
      <main className="flex-1 flex flex-col relative">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
      <MusicToggle />
    </div>
  );
}
