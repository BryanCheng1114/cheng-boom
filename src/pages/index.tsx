import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Phone, BookOpen, ShoppingBag, ArrowUp } from 'lucide-react';
import { getProducts, categoriesData as mockCategories } from '../utils/mockData';
import { ProductCard } from '../components/ui/ProductCard';
import { useTranslation } from '../hooks/useTranslation';

// Pre-computed spark data — no Math.random() to avoid SSR hydration mismatch
const SPARKS = [
  { bottom: '10%', left: '15%', animationDelay: '0s',   animationDuration: '3.5s' },
  { bottom: '15%', left: '30%', animationDelay: '0.8s',  animationDuration: '4.0s' },
  { bottom: '8%',  left: '50%', animationDelay: '1.4s',  animationDuration: '2.8s' },
  { bottom: '20%', left: '68%', animationDelay: '0.3s',  animationDuration: '3.8s' },
  { bottom: '12%', left: '82%', animationDelay: '1.9s',  animationDuration: '4.5s' },
  { bottom: '25%', left: '8%',  animationDelay: '2.2s',  animationDuration: '3.1s' },
  { bottom: '5%',  left: '92%', animationDelay: '0.6s',  animationDuration: '4.2s' },
];

// Spark particle — uses separate animation props to avoid React style warnings
function Spark({ bottom, left, animationDelay, animationDuration }: {
  bottom: string; left: string; animationDelay: string; animationDuration: string;
}) {
  return (
    <span
      className="absolute w-2 h-2 rounded-full bg-primary opacity-0 pointer-events-none"
      style={{ bottom, left, animationName: 'spark', animationDuration, animationTimingFunction: 'ease-out', animationIterationCount: 'infinite', animationDelay }}
    />
  );
}

const tickerItems = [
  '🎆 Child Fireworks', '🎇 Fountains', '✨ Sparklers', '🚀 Skyline',
  '🔥 Dragon Pili', '💥 Firecrackers', '🌟 Spinning', '🎉 Huge Displays',
];

export default function Home() {
  const featuredProducts = getProducts().slice(0, 3);
  const { t, locale } = useTranslation();

  const mapImageSrc = locale === 'zh' ? '/mapzh.png' : locale === 'ms' ? '/mapms.png' : '/map.png';

  const [categories, setCategories] = useState<any[]>([]);
  const [mapOpen, setMapOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setCategories(data);
          } else {
            setCategories(mockCategories);
          }
        } else {
          setCategories(mockCategories);
        }
      } catch (err) {
        setCategories(mockCategories);
      }
    };
    fetchCategories();
  }, []);

  return (
    <>
      <Head>
        <title>Cheng-BOOM - Premium Fireworks</title>
        <meta name="description" content="Buy premium fireworks online." />
      </Head>

      {/* ===== SECTION 1: Full-Screen Hero — ALWAYS DARK, no theme toggle ===== */}
      <section className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center overflow-hidden bg-black px-4">

        {/* New Year background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 z-0 w-full h-full object-cover scale-105"
          style={{ filter: 'brightness(0.35) saturate(1.2)' }}
        >
          <source src="/video/firework3.mp4" type="video/mp4" />
        </video>

        {/* Dark gradient overlay — stronger at bottom for text readability */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black via-black/50 to-black/10" />

        {/* Radial amber glow behind the logo */}
        <div className="absolute inset-0 z-[3] flex items-center justify-center pointer-events-none">
          <div className="w-[550px] h-[550px] bg-primary/12 rounded-full blur-[120px] animate-pulse" />
        </div>

        {/* Floating spark particles */}
        {SPARKS.map((s, i) => <Spark key={i} {...s} />)}

        {/* Subtle dot grid texture */}
        <div
          className="absolute inset-0 z-[3] opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        {/* Bottom vignette fade */}
        <div className="absolute bottom-0 left-0 right-0 h-64 z-[4] pointer-events-none bg-gradient-to-t from-black to-transparent" />

        {/* ---- Main Content ---- */}
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center">



          {/* Headline */}
          <div className="space-y-4" style={{ animation: 'fade-in-up 0.9s 0.15s ease both' }}>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-snug drop-shadow-xl">
              {t.home.heroTitle1}&nbsp;
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent font-extrabold">
                {t.home.heroTitle2}
              </span>
            </h1>
            <p className="text-sm md:text-base text-zinc-300/90 max-w-lg mx-auto leading-relaxed font-normal">
              {t.home.heroDesc}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center" style={{ animation: 'fade-in-up 0.9s 0.3s ease both' }}>

            {/* Primary — Shop All */}
            <Link
              href="/shop"
              className="group relative inline-flex items-center gap-2.5 px-8 py-3 rounded-2xl font-bold text-sm text-zinc-900 overflow-hidden transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 shadow-[0_4px_24px_rgba(245,158,11,0.45)] hover:shadow-[0_6px_32px_rgba(245,158,11,0.65)]"
              style={{ background: 'linear-gradient(135deg, #facc15 0%, #f97316 60%, #ef4444 100%)' }}
            >
              {/* Shine sweep */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-in-out" />
              <ShoppingBag size={17} className="relative z-10 shrink-0" />
              <span className="relative z-10 tracking-wide">{t.nav.shopAll}</span>
            </Link>

            {/* Divider dot */}
            <span className="hidden sm:block w-1 h-1 rounded-full bg-white/30" />

            {/* Secondary — Contact Us */}
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2.5 px-8 py-3 rounded-2xl font-bold text-sm text-white transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 border border-white/20 hover:border-white/40 hover:bg-white/10"
              style={{ backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.07)' }}
            >
              <Phone size={17} className="shrink-0 group-hover:rotate-12 transition-transform duration-300" />
              <span className="tracking-wide">{t.nav.contact}</span>
            </Link>

          </div>
        </div>
      </section>

      {/* ===== SECTION 2: Shop All Categories (Full Screen Video) ===== */}
      <section id="shop-categories" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black px-4 py-20">
        
        {/* Background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 z-0 w-full h-full object-cover scale-105"
          style={{ filter: 'brightness(0.3) saturate(1.2)' }}
        >
          <source src="/video/firework2.mp4" type="video/mp4" />
        </video>

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/80 via-black/40 to-black/80" />

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg">
              {t.shop.categoriesDesc}
            </h2>
            <p className="mt-4 text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
              {t.shop.categoriesInfo}
            </p>
          </div>

          {(() => {
            // Sort categories from A to Z alphabetically based on translation or name
            const sortedCategories = [...categories].sort((a, b) => {
              const keyA = a.key || a.name.toLowerCase().replace(/\s+/g, '');
              const keyB = b.key || b.name.toLowerCase().replace(/\s+/g, '');
              
              let titleA = a.name;
              if (locale === 'zh' && a.nameZh) titleA = a.nameZh;
              else if (locale === 'ms' && a.nameMs) titleA = a.nameMs;
              else titleA = (t.shopCategories as any)[keyA] || a.name;
              
              let titleB = b.name;
              if (locale === 'zh' && b.nameZh) titleB = b.nameZh;
              else if (locale === 'ms' && b.nameMs) titleB = b.nameMs;
              else titleB = (t.shopCategories as any)[keyB] || b.name;

              return titleA.toLowerCase().localeCompare(titleB.toLowerCase());
            });

            const hasMoreThan11 = sortedCategories.length > 11;
            const displayedCategories = hasMoreThan11 ? sortedCategories.slice(0, 11) : sortedCategories;

            return (
              <div className={hasMoreThan11 
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 justify-items-center max-w-5xl mx-auto gap-y-12 gap-x-6 md:gap-x-12 w-full"
                : "flex flex-wrap justify-center max-w-5xl mx-auto gap-10 md:gap-14 w-full"
              }>
                {displayedCategories.map((category) => {
                  const key = category.key || category.name.toLowerCase().replace(/\s+/g, '');
                  const image = category.image || '/example.png';
                  
                  let title = category.name;
                  if (locale === 'zh' && category.nameZh) title = category.nameZh;
                  else if (locale === 'ms' && category.nameMs) title = category.nameMs;
                  else title = (t.shopCategories as any)[key] || category.name;

                  return (
                    <Link
                      key={category.id}
                      href={`/shop?category=${key}`}
                      className="group flex flex-col items-center gap-4 cursor-pointer transition-all duration-300 hover:scale-[1.15] hover:-translate-y-3 z-0 hover:z-10"
                    >
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-black/50 backdrop-blur-sm border-4 border-white/10 group-hover:border-primary transition-all duration-300 shadow-xl group-hover:shadow-[0_10px_40px_rgba(245,158,11,0.7)]">
                        <div
                          className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700 ease-out"
                          style={{ backgroundImage: `url(${image})` }}
                        />
                        {/* Dynamic Watermark Overlay - Bottom Right */}
                        <div className="absolute bottom-1.5 right-1.5 z-10 pointer-events-none w-7 h-7 sm:w-8 sm:h-8 opacity-85 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.5)]">
                          <img 
                            src="/transparent-Background.png" 
                            className="w-full h-full object-contain select-none" 
                            alt="" 
                            draggable={false}
                          />
                        </div>
                        <div className="absolute inset-0 rounded-full border border-white/20 z-10 pointer-events-none" />
                      </div>
                      <span className="font-extrabold text-sm sm:text-base text-white/90 group-hover:text-primary transition-colors text-center uppercase tracking-widest leading-tight drop-shadow-md group-hover:drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">
                        {title}
                      </span>
                    </Link>
                  );
                })}

                {/* View More Card - Only appears if strictly > 11 categories */}
                {hasMoreThan11 && (
                  <Link
                    href="/shop"
                    className="group flex flex-col items-center gap-4 cursor-pointer transition-all duration-300 hover:scale-[1.15] hover:-translate-y-3 z-0 hover:z-10"
                  >
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-zinc-900 border-4 border-white/10 group-hover:border-primary flex items-center justify-center transition-all duration-300 shadow-xl group-hover:shadow-[0_10px_40px_rgba(245,158,11,0.7)]">
                      <div className="flex flex-col items-center justify-center text-zinc-400 group-hover:text-primary transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 16 16 12 12 8" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                      </div>
                      <div className="absolute inset-0 rounded-full border border-white/20 z-10 pointer-events-none" />
                    </div>
                    <span className="font-extrabold text-sm sm:text-base text-white/90 group-hover:text-primary transition-colors text-center uppercase tracking-widest leading-tight drop-shadow-md group-hover:drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">
                      {t.nav.shopAll || 'View More'}
                    </span>
                  </Link>
                )}
              </div>
            );
          })()}
        </div>
      </section>

      {/* ===== SECTION 3: Our Delivery Coverage — East Malaysia ===== */}
      <section id="coverage" className="relative min-h-screen bg-white dark:bg-black overflow-hidden flex flex-col items-center justify-between pt-20 pb-0 transition-colors duration-500">

        {/* Sunrise Background Image */}
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="/sunrise.jpg"
            alt="Sunrise background"
            fill
            className="object-cover object-center opacity-100 transition-opacity duration-500"
            priority
          />
        </div>

        {/* Subtle noise/texture background overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.08] dark:opacity-[0.03] text-zinc-900 dark:text-white transition-opacity duration-500"
          style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />

        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[120px]" />
        </div>

        {/* Supporting text above image */}
        <div className="relative z-10 text-center max-w-3xl mx-auto mb-4 space-y-4 px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            {t.coverage?.title || 'Our Delivery Coverage'}
          </h2>
          <p className="text-sm md:text-base text-white/90 max-w-xl mx-auto leading-relaxed font-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            {t.coverage?.desc || 'Cheng-BOOM exclusively serves customers across Sabah and Sarawak. We bring premium fireworks directly to your local celebrations with reliable, safe delivery.'}
          </p>
        </div>

        {/* Full-width white long horizontal box - stretches to fill the rest of the viewport screen */}
        <div
          onClick={() => setMapOpen(true)}
          className="relative z-10 w-full flex-1 min-h-[350px] sm:min-h-[450px] md:min-h-[550px] cursor-zoom-in group bg-transparent overflow-hidden transition-all duration-500 mt-auto"
        >
          {/* Safe padded intermediate layout wrapper */}
          <div className="absolute inset-0 pt-2 px-4 pb-4 sm:pt-3 sm:px-6 sm:pb-6 md:pt-4 md:px-10 md:pb-10 flex items-center justify-center">
            <div className="relative w-full h-full">
              <Image
                src={mapImageSrc}
                alt={t.coverage?.title || 'East Malaysia Coverage Map — Sabah & Sarawak'}
                fill
                className="object-contain object-center group-hover:scale-[1.01] transition-transform duration-700 ease-out"
                priority
              />
            </div>
          </div>

          {/* Click hint overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/5">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/95 backdrop-blur-sm shadow-xl border border-zinc-200 transition-all duration-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-800"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              <span className="text-xs font-bold text-zinc-800">{t.coverage?.clickExpand || 'Click to expand'}</span>
            </div>
          </div>
        </div>

      </section>

      {/* ===== LIGHTBOX MODAL ===== */}
      {mapOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8"
          onClick={() => setMapOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setMapOpen(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all duration-200 z-10"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          {/* Image container — stop click propagation so clicking image doesn't close */}
          <div
            className="relative w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={mapImageSrc}
              alt={t.coverage?.title || 'East Malaysia Coverage Map — Sabah & Sarawak'}
              width={1600}
              height={900}
              className="w-full h-auto object-contain"
              priority
            />
          </div>

          {/* ESC hint */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/40 font-medium">
            {t.coverage?.escHint || 'Click anywhere outside to close'}
          </p>
        </div>
      )}


      {/* ===== FLOATING SCROLL TO TOP BUTTON (MIDDLE BOTTOM) ===== */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[999] flex items-center justify-center w-12 h-12 rounded-full shadow-xl border hover:scale-110 active:scale-95 transition-all duration-300
          bg-zinc-900 border-zinc-800 text-white hover:bg-black
          dark:bg-white dark:border-white dark:text-zinc-950 dark:hover:bg-zinc-100
          ${showScrollTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
        aria-label={t.coverage?.backToTop || 'Back to Top'}
      >
        <ArrowUp size={18} strokeWidth={2.5} />
      </button>

    </>
  );
}
