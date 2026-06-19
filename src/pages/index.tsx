import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUp, ChevronLeft, ChevronRight, FileCheck, ShieldCheck, Headphones, Truck } from 'lucide-react';
import { categoriesData as mockCategories } from '../utils/mockData';
import { useTranslation } from '../hooks/useTranslation';
import { useBusiness } from '../context/BusinessContext';

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

type Category = {
  id?: string;
  key?: string;
  code?: string;
  name?: string;
  nameZh?: string | null;
  nameMs?: string | null;
  image?: string | null;
  count?: number | null;
};

const tickerItems = [
  '🎆 Child Fireworks', '🎇 Fountains', '✨ Sparklers', '🚀 Skyline',
  '🔥 Dragon Pili', '💥 Firecrackers', '🌟 Spinning', '🎉 Huge Displays',
];

export default function Home() {
  const { t, locale } = useTranslation();
  const { settings } = useBusiness();

  const mapImageSrc = locale === 'zh' ? '/mapzh.png' : locale === 'ms' ? '/mapms.png' : '/map.png';

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [catPage, setCatPage] = useState(0);
  const [catAtStart, setCatAtStart] = useState(true);
  const [catAtEnd, setCatAtEnd] = useState(false);
  const [mobileCatIndex, setMobileCatIndex] = useState(0);
  const [mobileScrollProgress, setMobileScrollProgress] = useState(0);
  const [infoSliderIndex, setInfoSliderIndex] = useState(0);
  const [infoScrollProgress, setInfoScrollProgress] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollStartLeft = useRef(0);
  const VISIBLE = 4; // full cards visible (4 + half peek)

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
            setCategories(data.filter((c: any) => c.status !== 'Hold'));
          } else {
            setCategories(mockCategories);
          }
        } else {
          setCategories(mockCategories);
        }
      } catch {
        setCategories(mockCategories);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Measure card width from the first rendered card
  const getCardW = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return 220;
    const card = el.querySelector('[data-cat-card]') as HTMLElement | null;
    return card ? card.offsetWidth + 12 : 200; // 12 = gap-3
  }, []);

  // Advance / retreat by exactly VISIBLE cards
  const slideNext = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: getCardW() * VISIBLE, behavior: 'smooth' });
  }, [getCardW]);

  const slidePrev = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: -getCardW() * VISIBLE, behavior: 'smooth' });
  }, [getCardW]);

  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const cw = getCardW();
    const page = Math.round(el.scrollLeft / (cw * VISIBLE));
    setCatPage(page);
    setCatAtStart(el.scrollLeft < 10);
    setCatAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 10);
  }, [getCardW]);

  const getCategoryLabel = useCallback((category: Category) => {
    const fallback = category.name || category.key || category.code || category.id || 'Category';
    const key = category.key || category.code || fallback.toLowerCase().replace(/\s+/g, '');

    if (locale === 'zh' && category.nameZh) return category.nameZh;
    if (locale === 'ms' && category.nameMs) return category.nameMs;
    return (t.shopCategories as Record<string, string>)[key] || fallback;
  }, [locale, t.shopCategories]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) =>
      getCategoryLabel(a).toLowerCase().localeCompare(getCategoryLabel(b).toLowerCase())
    );
  }, [categories, getCategoryLabel]);

  const totalPages = Math.max(1, Math.ceil(sortedCategories.length / VISIBLE));

  // Mouse-drag handlers
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = carouselRef.current;
    if (!el) return;
    isDragging.current = true;
    dragStartX.current = e.pageX;
    scrollStartLeft.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
  }, []);
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const el = carouselRef.current;
    if (!el) return;
    el.scrollLeft = scrollStartLeft.current - (e.pageX - dragStartX.current);
  }, []);
  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    const el = carouselRef.current;
    if (el) el.style.cursor = 'grab';
  }, []);

  return (
    <>
      <Head>
        <title>{`${settings?.businessName || 'Cheng-BOOM'} - Premium Fireworks`}</title>
        <meta name="description" content="Buy premium fireworks online." />
      </Head>

      {/* ===== SECTION 1: Full-Screen Hero — ALWAYS DARK, no theme toggle ===== */}
      <section className="relative min-h-screen flex flex-col items-center justify-end overflow-hidden bg-black px-4 pb-24 md:pb-32">

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
          <div className="space-y-4 md:space-y-5" style={{ animation: 'fade-in-up 0.9s 0.15s ease both' }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white tracking-tight leading-tight drop-shadow-lg">
              {t.home.heroTitle1} <br className="hidden sm:block" />
              <span className="text-white">
                {t.home.heroTitle2}
              </span>
            </h1>
            <p className="text-sm md:text-base text-zinc-300 max-w-lg mx-auto leading-relaxed font-medium drop-shadow-md">
              {t.home.heroDesc}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="mt-8 md:mt-10 flex justify-center items-center" style={{ animation: 'fade-in-up 0.9s 0.3s ease both' }}>
            <Link
              href="/shop"
              className="group inline-flex justify-center items-center px-6 py-2.5 rounded-full font-bold text-sm text-black bg-white hover:bg-yellow-400 transition-colors duration-300 shadow-lg"
            >
              <span className="tracking-wide">{t.nav.shop || 'Shop'}</span>
            </Link>
          </div>
        </div>
      </section>

        {/* ===== SECTION 2: Category Row ===== */}
      <section id="shop-categories" className="relative bg-black py-12 md:py-16 group/section overflow-hidden">

        {/* Subtle noise/texture background overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.08] dark:opacity-[0.03] text-zinc-900 dark:text-white transition-opacity duration-500"
          style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />

        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px]" />
        </div>

        {/* ── DESKTOP VIEW (hidden on mobile, visible on medium screens and up) ── */}
        <div className="hidden md:block">
          {/* ── Section title ── */}
          <div className="px-[12%] mb-5 md:mb-7 flex items-end justify-between gap-4 relative z-20">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/35 mb-2 ml-1 hidden md:block">
                Curated
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-white tracking-tight leading-tight">
                {t.home.shopByCategory || 'Shop by Category'}
              </h2>
            </div>
            {/* Progress pills */}
            {!isLoadingCategories && totalPages > 1 && (
              <div className="hidden sm:flex items-center gap-[5px] pb-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-[2px] rounded-full transition-all duration-300 ${
                      i === catPage ? 'w-8 bg-white' : 'w-4 bg-white/20'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Carousel area ── */}
          <div className="relative">

            {/* ── LEFT WALL (Solid Black) ── */}
            <div className="absolute inset-y-0 left-0 w-[12%] z-40 bg-black pointer-events-none" />
            
            {/* ── LEFT BUTTON ── */}
            <div 
              onClick={slidePrev}
              className={`absolute inset-y-0 left-0 w-[12%] z-50 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                catAtStart ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto hover:bg-white/5'
              }`}
            >
              <ChevronLeft className="w-8 h-8 text-white md:w-12 md:h-12 drop-shadow-lg" strokeWidth={2.5} />
            </div>

            {/* ── RIGHT WALL (Solid Black) ── */}
            <div className="absolute inset-y-0 right-0 w-[12%] z-40 bg-black pointer-events-none" />

            {/* ── RIGHT BUTTON ── */}
            <div 
              onClick={slideNext}
              className={`absolute inset-y-0 right-0 w-[12%] z-50 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                catAtEnd ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto hover:bg-white/5'
              }`}
            >
              <ChevronRight className="w-8 h-8 text-white md:w-12 md:h-12 drop-shadow-lg" strokeWidth={2.5} />
            </div>

            {/* ── Scroll track ── */}
            {/* relative z-10 isolates the stacking context, so nothing inside here can EVER overlap the z-40 walls */}
            <div
              ref={carouselRef}
              onScroll={handleCarouselScroll}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              className="relative z-10 flex gap-8 overflow-x-auto scrollbar-hide py-8 pl-[16%] pr-[12%]"
              style={{ cursor: 'grab', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
            >
              {isLoadingCategories ? (
                /* Skeleton */
                [...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 rounded-lg bg-white/[0.07] animate-pulse"
                    style={{ width: 'calc((72vw - 3.5 * 32px) / 4.5)', aspectRatio: '2/3' }}
                  />
                ))
              ) : (
                sortedCategories.map((category, index) => {
                  const fallback = category.name || category.key || category.code || category.id || 'category';
                  const key = category.key || category.code || fallback.toLowerCase().replace(/\s+/g, '');
                  const image = category.image || '/example.png';

                  return (
                    <div
                      key={category.id || key}
                      data-cat-card
                      className="relative flex-shrink-0"
                      style={{
                        // 72vw available (100vw - 16vw left pad - 12vw right pad), minus 3.5 gaps of 32px
                        width: 'calc((72vw - 3.5 * 32px) / 4.5)',
                        minWidth: '80px',
                      }}
                    >
                      {/* The wrapper handles the hover scale for BOTH image and number together */}
                      <div className="group/card relative w-full h-full transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.04] hover:z-40 cursor-pointer">
                        
                        {/* ── Image card ── */}
                        <Link
                          href={`/shop?category=${key}`}
                          draggable={false}
                          onClick={(e) => { if (isDragging.current) e.preventDefault(); }}
                          className="relative block overflow-hidden rounded-[20px] sm:rounded-[32px] select-none w-full shadow-lg"
                          style={{ aspectRatio: '2/3' }}
                        >
                          {/* Image */}
                          <div
                            className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover/card:scale-110"
                            style={{ backgroundImage: `url(${image})` }}
                          />
                          {/* Top fade */}
                          <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/35 via-transparent to-transparent" />
                          {/* Bottom vignette */}
                          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />



                          {/* Hover ring */}
                          <div className="absolute inset-0 z-30 rounded-[20px] sm:rounded-[32px] ring-1 ring-inset ring-white/0 group-hover/card:ring-white/25 transition-all duration-300 pointer-events-none" />
                        </Link>

                        {/* ── Rank number (Stacked in front) ── */}
                        <span
                          aria-hidden="true"
                          className="absolute -left-[14%] bottom-[2%] z-50 font-black leading-[0.8] tracking-tighter select-none pointer-events-none drop-shadow-2xl text-black transition-colors duration-300 [-webkit-text-stroke:2.5px_rgba(255,255,255,0.9)] group-hover/card:text-yellow-400 group-hover/card:[-webkit-text-stroke:2.5px_#facc15]"
                          style={{
                            fontSize: 'clamp(60px, 11vw, 140px)',
                          }}
                        >
                          {index + 1}
                        </span>

                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── MOBILE VIEW (visible on mobile, hidden on medium screens and up) ── */}
        <div className="md:hidden relative z-20">
          {/* Mobile Title */}
          <div className="px-6 mb-6">
            <h2 className="text-3xl font-serif text-white tracking-tight leading-tight">
              {t.home.shopByCategory || 'Shop by Category'}
            </h2>
          </div>

          {/* Mobile Carousel Track */}
          <div
            className="flex gap-4 overflow-x-auto scrollbar-hide px-6 pb-4 pt-2 snap-x snap-mandatory scroll-px-6 after:content-[''] after:w-1 after:shrink-0"
            style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
            onScroll={(e) => {
              const el = e.currentTarget;
              const maxScrollLeft = el.scrollWidth - el.clientWidth;
              if (maxScrollLeft > 0) {
                const progress = el.scrollLeft / maxScrollLeft;
                setMobileScrollProgress(Math.min(1, Math.max(0, progress)));
              }
            }}
          >
            {isLoadingCategories ? (
              /* Mobile Skeletons */
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[65%] aspect-[4/5] bg-white/[0.07] animate-pulse rounded-[16px] snap-start"
                />
              ))
            ) : (
              sortedCategories.map((category, index) => {
                const fallback = category.name || category.key || category.code || category.id || 'category';
                const key = category.key || category.code || fallback.toLowerCase().replace(/\s+/g, '');
                const image = category.image || '/example.png';
                const title = getCategoryLabel(category);

                return (
                  <div
                    key={category.id || key}
                    className="relative flex-shrink-0 w-[65%] aspect-[4/5] snap-start"
                  >
                    <Link
                      href={`/shop?category=${key}`}
                      className="absolute inset-0 overflow-hidden shadow-xl active:scale-[0.98] transition-all duration-200 block rounded-[16px]"
                    >
                      <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                      
                      {/* Subtle bottom overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    </Link>

                    {/* Mobile Category Number */}
                    <span
                      aria-hidden="true"
                      className="absolute -left-[10%] bottom-[2%] z-50 font-black leading-[0.8] tracking-tighter select-none pointer-events-none drop-shadow-2xl text-black transition-colors duration-300 [-webkit-text-stroke:2px_rgba(255,255,255,0.9)]"
                      style={{
                        fontSize: 'clamp(50px, 15vw, 90px)',
                      }}
                    >
                      {index + 1}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Mobile Page Indicator Line */}
          {!isLoadingCategories && sortedCategories.length > 0 && (
            <div className="flex justify-center items-center mt-4 mb-2 px-6">
              <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden relative">
                <div 
                  className="absolute top-0 h-full bg-white rounded-full transition-all duration-75 ease-out"
                  style={{
                    width: `${100 / sortedCategories.length}%`,
                    left: `${mobileScrollProgress * (100 - (100 / sortedCategories.length))}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== SECTION 2.5: UNIFIED MOBILE SLIDER (Coverage & Safety) ===== */}
      <section className="md:hidden relative bg-[#f8f7f9] dark:bg-black py-16 flex flex-col items-center overflow-hidden">
        {/* Dynamic Text Area */}
        <div className="px-8 text-center min-h-[160px] flex flex-col justify-center z-10">
          <h2 className="text-3xl font-serif text-zinc-900 dark:text-white leading-tight tracking-tight mb-4 transition-opacity duration-300" key={`title-${infoSliderIndex}`}>
            {infoSliderIndex === 0 ? (t.coverage?.title || 'Our Delivery Coverage.') : (t.safety?.title || 'Safety First, Always')}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium transition-opacity duration-300" key={`desc-${infoSliderIndex}`}>
            {infoSliderIndex === 0 
              ? (t.coverage?.desc || 'We exclusively serves customers only in Bintulu. We bring premium fireworks directly to your local celebrations with reliable, safe delivery.') 
              : (t.safety?.desc || 'We deliver joy, but safety is our promise. All our fireworks are strictly tested and approved, ensuring you can enjoy a spectacular and secure celebration.')}
          </p>
        </div>

        {/* Image Slider Track */}
        <div 
          className="w-full mt-4 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide px-6 pb-6"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
          onScroll={(e) => {
             const el = e.currentTarget;
             const maxScrollLeft = el.scrollWidth - el.clientWidth;
             if (maxScrollLeft > 0) {
               const progress = el.scrollLeft / maxScrollLeft;
               setInfoScrollProgress(Math.min(1, Math.max(0, progress)));
             }
             const index = Math.round(el.scrollLeft / el.clientWidth);
             if (index !== infoSliderIndex) setInfoSliderIndex(index);
          }}
        >
          {/* Slide 0: Map Image */}
          <div className="w-full flex-shrink-0 snap-center px-1">
            <div 
              className="relative w-full aspect-[4/5] rounded-[24px] overflow-hidden bg-transparent"
              onClick={() => setLightboxSrc(mapImageSrc)}
            >
               <Image
                 src={mapImageSrc}
                 alt="Map"
                 fill
                 className="object-contain"
               />
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                 <img src={settings?.watermarkUrl || "/transparent-Background.png"} className="w-[30%] h-[30%] object-contain opacity-30 mix-blend-multiply dark:mix-blend-screen" alt=""/>
               </div>
            </div>
          </div>

          {/* Slide 1: Safety Image */}
          <div className="w-full flex-shrink-0 snap-center px-1">
            <div 
              className="relative w-full aspect-[4/5] rounded-[24px] overflow-hidden bg-transparent"
              onClick={() => setLightboxSrc(locale === 'zh' ? '/safe_guide_zh.png' : '/safe_guide.png')}
            >
               <Image
                 src={locale === 'zh' ? '/safe_guide_zh.png' : '/safe_guide.png'}
                 alt="Safety"
                 fill
                 className="object-contain"
               />
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                 <img src={settings?.watermarkUrl || "/transparent-Background.png"} className="w-[30%] h-[30%] object-contain opacity-30 mix-blend-multiply dark:mix-blend-screen" alt=""/>
               </div>
            </div>
          </div>
        </div>

        {/* Mobile Page Indicator Line */}
        <div className="flex justify-center items-center mt-2 mb-2 px-6">
          <div className="w-24 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full overflow-hidden relative">
            <div 
              className="absolute top-0 h-full bg-zinc-800 dark:bg-white rounded-full transition-all duration-75 ease-out"
              style={{
                width: `50%`,
                left: `${infoScrollProgress * 50}%`
              }}
            />
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: Our Delivery Coverage — East Malaysia ===== */}
      <section id="coverage" className="hidden md:flex relative h-[75vh] bg-white dark:bg-black overflow-hidden flex-col md:flex-row transition-colors duration-500">
        
        {/* Left Side: Text Content */}
        <div className="w-full md:w-[45%] flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-24 py-16 md:py-0">
          <div className="max-w-xl space-y-6 md:ml-12 lg:ml-24 xl:ml-32">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-zinc-900 dark:text-white leading-tight tracking-tight">
              {t.coverage?.title || 'Our Delivery Coverage.'}
            </h2>
            <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
              {t.coverage?.desc || 'We exclusively serves customers only in Bintulu. We bring premium fireworks directly to your local celebrations with reliable, safe delivery.'}
            </p>
          </div>
        </div>

        {/* Right Side: Map Image */}
        <div className="w-full md:w-[55%] h-[50vh] md:h-full relative bg-white dark:bg-black flex items-center justify-center p-8 md:p-16 lg:p-24">
          <div
            onClick={() => setLightboxSrc(mapImageSrc)}
            className="relative w-full h-full cursor-zoom-in group"
          >
            <Image
              src={mapImageSrc}
              alt={t.coverage?.title || 'Bintulu Map'}
              fill
              className="object-contain object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              priority
            />

            {/* Centered Watermark Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <img 
                src={settings?.watermarkUrl || "/transparent-Background.png"} 
                className="w-[30%] h-[30%] object-contain opacity-30 select-none mix-blend-multiply dark:mix-blend-screen transition-all duration-700" 
                alt="" 
                draggable={false}
              />
            </div>

            {/* Click hint overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/10 pointer-events-none">
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/95 backdrop-blur-sm shadow-xl border border-zinc-200 transition-all duration-500 scale-95 group-hover:scale-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-800"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                <span className="text-xs font-bold text-zinc-800">{t.coverage?.clickExpand || 'Click to expand'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 4: Safety First ===== */}
      <section id="safety" className="hidden md:flex relative h-[75vh] bg-black overflow-hidden flex-col md:flex-row transition-colors duration-500">
        
        {/* Left Side: Image Content */}
        <div className="w-full md:w-[55%] h-[50vh] md:h-full relative bg-black flex items-center justify-center p-8 md:p-16 lg:p-24">
          <div
            onClick={() => setLightboxSrc(locale === 'zh' ? '/safe_guide_zh.png' : '/safe_guide.png')}
            className="relative w-full h-full cursor-zoom-in group"
          >
            <Image
              src={locale === 'zh' ? '/safe_guide_zh.png' : '/safe_guide.png'}
              alt={t.safety?.title || 'Safety First, Always'}
              fill
              className="object-contain object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            />

            {/* Centered Watermark Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <img 
                src={settings?.watermarkUrl || "/transparent-Background.png"} 
                className="w-[30%] h-[30%] object-contain opacity-30 select-none mix-blend-multiply dark:mix-blend-screen transition-all duration-700" 
                alt="" 
                draggable={false}
              />
            </div>

            {/* Click hint overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/10 pointer-events-none">
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/95 backdrop-blur-sm shadow-xl border border-zinc-200 transition-all duration-500 scale-95 group-hover:scale-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-800"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                <span className="text-xs font-bold text-zinc-800">{t.coverage?.clickExpand || 'Click to expand'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Text Content */}
        <div className="w-full md:w-[45%] flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-24 py-16 md:py-0">
          <div className="max-w-xl space-y-6 md:mr-12 lg:mr-24 xl:mr-32">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-white leading-tight tracking-tight">
              {t.safety?.title || 'Safety First, Always'}
            </h2>
            <p className="text-sm md:text-base text-zinc-400 leading-relaxed font-medium">
              {t.safety?.desc || 'We deliver joy, but safety is our promise. All our fireworks are strictly tested and approved, ensuring you can enjoy a spectacular and secure celebration.'}
            </p>
          </div>
        </div>
      </section>

      {/* ===== SECTION 5: Feature Highlights ===== */}
      <section className="bg-[#F9F9F9] dark:bg-black py-16 md:py-24 transition-colors duration-500">
        <div className="w-full mx-auto px-6 sm:px-12 md:px-16 lg:px-24">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif text-zinc-900 dark:text-white leading-tight tracking-tight">{t.features?.title || 'What We Guarantee'}</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-8 lg:gap-12 text-center">
            
            {/* Feature 1 */}
            <div className="flex flex-col items-center justify-center w-full mx-auto aspect-square md:aspect-auto p-3 sm:p-4 md:p-8 lg:p-10 bg-[#FAFAFA] dark:bg-zinc-900/50 rounded-xl group transition-all duration-300 shadow-sm md:shadow-none hover:shadow-md md:hover:shadow-sm hover:-translate-y-0.5 md:hover:-translate-y-0.5">
              <div className="mb-2 md:mb-6 text-zinc-400 md:text-zinc-500 transition-colors duration-300 group-hover:text-zinc-800 dark:group-hover:text-zinc-300">
                <FileCheck strokeWidth={1.5} className="w-10 h-10 md:w-14 md:h-14" />
              </div>
              <h3 className="text-[13px] sm:text-sm md:text-[17px] font-bold text-zinc-900 dark:text-white mb-1 md:mb-3 tracking-tight leading-tight">
                {t.features?.licensed || 'Fully Licensed'}
              </h3>
              <p className="text-[11px] sm:text-xs md:text-[15px] text-zinc-500 dark:text-zinc-400 leading-tight md:leading-relaxed max-w-[160px] md:max-w-[260px]">
                {t.features?.licensedDesc || '100% legal & certified'}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center justify-center w-full mx-auto aspect-square md:aspect-auto p-3 sm:p-4 md:p-8 lg:p-10 bg-[#FAFAFA] dark:bg-zinc-900/50 rounded-xl group transition-all duration-300 shadow-sm md:shadow-none hover:shadow-md md:hover:shadow-sm hover:-translate-y-0.5 md:hover:-translate-y-0.5">
              <div className="mb-2 md:mb-6 text-zinc-400 md:text-zinc-500 transition-colors duration-300 group-hover:text-zinc-800 dark:group-hover:text-zinc-300">
                <ShieldCheck strokeWidth={1.5} className="w-10 h-10 md:w-14 md:h-14" />
              </div>
              <h3 className="text-[13px] sm:text-sm md:text-[17px] font-bold text-zinc-900 dark:text-white mb-1 md:mb-3 tracking-tight leading-tight">
                {t.features?.safety || 'Safety Approved'}
              </h3>
              <p className="text-[11px] sm:text-xs md:text-[15px] text-zinc-500 dark:text-zinc-400 leading-tight md:leading-relaxed max-w-[160px] md:max-w-[260px]">
                {t.features?.safetyDesc || 'Tested & secure'}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center justify-center w-full mx-auto aspect-square md:aspect-auto p-3 sm:p-4 md:p-8 lg:p-10 bg-[#FAFAFA] dark:bg-zinc-900/50 rounded-xl group transition-all duration-300 shadow-sm md:shadow-none hover:shadow-md md:hover:shadow-sm hover:-translate-y-0.5 md:hover:-translate-y-0.5">
              <div className="mb-2 md:mb-6 text-zinc-400 md:text-zinc-500 transition-colors duration-300 group-hover:text-zinc-800 dark:group-hover:text-zinc-300">
                <Headphones strokeWidth={1.5} className="w-10 h-10 md:w-14 md:h-14" />
              </div>
              <h3 className="text-[13px] sm:text-sm md:text-[17px] font-bold text-zinc-900 dark:text-white mb-1 md:mb-3 tracking-tight leading-tight">
                {t.features?.support || 'Expert Support'}
              </h3>
              <p className="text-[11px] sm:text-xs md:text-[15px] text-zinc-500 dark:text-zinc-400 leading-tight md:leading-relaxed max-w-[160px] md:max-w-[260px]">
                {t.features?.supportDesc || 'Always here to help'}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col items-center justify-center w-full mx-auto aspect-square md:aspect-auto p-3 sm:p-4 md:p-8 lg:p-10 bg-[#FAFAFA] dark:bg-zinc-900/50 rounded-xl group transition-all duration-300 shadow-sm md:shadow-none hover:shadow-md md:hover:shadow-sm hover:-translate-y-0.5 md:hover:-translate-y-0.5">
              <div className="mb-2 md:mb-6 text-zinc-400 md:text-zinc-500 transition-colors duration-300 group-hover:text-zinc-800 dark:group-hover:text-zinc-300">
                <Truck strokeWidth={1.5} className="w-10 h-10 md:w-14 md:h-14" />
              </div>
              <h3 className="text-[13px] sm:text-sm md:text-[17px] font-bold text-zinc-900 dark:text-white mb-1 md:mb-3 tracking-tight leading-tight">
                {t.features?.fastDelivery || 'Fast Delivery'}
              </h3>
              <p className="text-[11px] sm:text-xs md:text-[15px] text-zinc-500 dark:text-zinc-400 leading-tight md:leading-relaxed max-w-[160px] md:max-w-[260px]">
                {t.features?.fastDeliveryDesc || 'Nationwide secure shipping'}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ===== LIGHTBOX MODAL ===== */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8"
          onClick={() => setLightboxSrc(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxSrc(null)}
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
              src={lightboxSrc}
              alt="Expanded view"
              width={1600}
              height={900}
              className="w-full h-auto object-contain"
              priority
            />

            {/* Centered Watermark Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <img 
                src={settings?.watermarkUrl || "/transparent-Background.png"} 
                className="w-[30%] h-[30%] object-contain opacity-30 select-none mix-blend-multiply dark:mix-blend-screen transition-all duration-700" 
                alt="" 
                draggable={false}
              />
            </div>
          </div>

          {/* ESC hint */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/40 font-medium">
            {t.coverage?.escHint || 'Click anywhere outside to close'}
          </p>
        </div>
      )}

      {/* Removed old floating scroll to top button */}
    </>
  );
}
